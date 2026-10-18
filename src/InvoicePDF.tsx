import { useState } from "react";

type Item = {
  id: number;
  description: string;
  qty: number;
  price: number;
};

type DocStatus = "QUOTATION" | "INVOICE";

const GST_RATE = 0.18;

const initialItems: Item[] = [
  { id: 1, description: "Website Design", qty: 1, price: 15000 },
  { id: 2, description: "Logo & Branding", qty: 1, price: 5000 },
  { id: 3, description: "Hosting (1 year)", qty: 1, price: 3000 },
];

const formatINR = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2 });

export default function InvoicePDF() {
  const [status, setStatus] = useState<DocStatus>("QUOTATION");
  const [docNumber, setDocNumber] = useState("QUO-2026-001");
  const [issuedOn, setIssuedOn] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>(initialItems);

  // Price snapshot: frozen copy of items + totals taken at conversion
  const [snapshot, setSnapshot] = useState<{
    items: Item[];
    subtotal: number;
    tax: number;
    total: number;
  } | null>(null);

  const locked = status === "INVOICE";

  const liveSubtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
  const liveTax = liveSubtotal * GST_RATE;
  const liveTotal = liveSubtotal + liveTax;

  // Once converted, always show the locked snapshot
  const shownItems = snapshot ? snapshot.items : items;
  const subtotal = snapshot ? snapshot.subtotal : liveSubtotal;
  const tax = snapshot ? snapshot.tax : liveTax;
  const total = snapshot ? snapshot.total : liveTotal;

  const updateItem = (id: number, field: keyof Item, value: string) => {
    if (locked) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              [field]: field === "description" ? value : Number(value) || 0,
            }
          : i
      )
    );
  };

  const handleConvert = () => {
    if (locked) return;
    setSnapshot({
      items: items.map((i) => ({ ...i })),
      subtotal: liveSubtotal,
      tax: liveTax,
      total: liveTotal,
    });
    setDocNumber("INV-2026-001");
    setStatus("INVOICE");
    setIssuedOn(new Date().toLocaleDateString("en-IN"));
  };

  const handlePrint = () => window.print();

  return (
    <div className="page-wrapper">
      {/* ---------- PRINT CSS ---------- */}
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #e5e7eb; font-family: Arial, Helvetica, sans-serif; color: #111827; }

        .page-wrapper { padding: 24px; }

        .toolbar {
          max-width: 210mm; margin: 0 auto 16px; display: flex;
          gap: 12px; align-items: center; justify-content: space-between;
        }
        .toolbar .btns { display: flex; gap: 10px; }
        .btn {
          padding: 10px 18px; border: none; border-radius: 6px; cursor: pointer;
          font-size: 14px; font-weight: 600; color: #fff;
        }
        .btn-print { background: #2563eb; }
        .btn-convert { background: #16a34a; }
        .btn:disabled { background: #9ca3af; cursor: not-allowed; }

        .a4 {
          width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff;
          padding: 18mm; box-shadow: 0 2px 12px rgba(0,0,0,.15);
        }

        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111827; padding-bottom: 12px; }
        .company h1 { margin: 0; font-size: 22px; }
        .company p { margin: 2px 0; font-size: 12px; color: #4b5563; }
        .doc-meta { text-align: right; }
        .doc-meta h2 { margin: 0; font-size: 26px; letter-spacing: 1px; }
        .doc-meta p { margin: 3px 0; font-size: 12px; }
        .badge {
          display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 11px;
          font-weight: 700; border: 1px solid #111827; margin-top: 4px;
        }

        .billto { margin: 20px 0; font-size: 13px; }
        .billto h3 { margin: 0 0 4px; font-size: 12px; color: #6b7280; text-transform: uppercase; }

        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f3f4f6; text-align: left; padding: 8px; border-bottom: 1px solid #d1d5db; }
        td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .num { text-align: right; }
        td input {
          width: 100%; border: 1px solid #d1d5db; border-radius: 4px; padding: 4px 6px; font-size: 13px;
        }
        td input.small { width: 80px; text-align: right; }
        td input:disabled { border-color: transparent; background: transparent; color: #111827; }

        .totals { width: 260px; margin: 16px 0 0 auto; font-size: 13px; }
        .totals div { display: flex; justify-content: space-between; padding: 5px 0; }
        .totals .grand { border-top: 2px solid #111827; font-weight: 700; font-size: 15px; margin-top: 4px; padding-top: 8px; }

        .footer { margin-top: 40px; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; }

        /* ---------- PRINT RULES ---------- */
        @page { size: A4; margin: 0; }

        @media print {
          body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-wrapper { padding: 0; }
          .no-print { display: none !important; }   /* hides buttons/clutter */
          .a4 { box-shadow: none; margin: 0; width: 210mm; min-height: 297mm; padding: 15mm; }
          td input { border: none !important; background: transparent !important; padding: 0; }
          tr { page-break-inside: avoid; }
        }
      `}</style>

      {/* ---------- TOOLBAR (hidden when printing) ---------- */}
      <div className="toolbar no-print">
        <strong>
          Status: {status} ({docNumber})
        </strong>
        <div className="btns">
          <button className="btn btn-convert" onClick={handleConvert} disabled={locked}>
            {locked ? "Converted ✓" : "Convert to Invoice"}
          </button>
          <button className="btn btn-print" onClick={handlePrint}>
            Print / Download PDF
          </button>
        </div>
      </div>

      {/* ---------- A4 DOCUMENT ---------- */}
      <div className="a4">
        <div className="header">
          <div className="company">
            <h1>ABC Company</h1>
            <p>XYZ Business Street, Hyderabad, Telangana 500001</p>
            <p>GSTIN: 36ABCDE1234F1Z5</p>
            <p>Email: hello@yourcompany.com | Phone: +91 98765 43210</p>
          </div>
          <div className="doc-meta">
            <h2>{status}</h2>
            <p><strong>No:</strong> {docNumber}</p>
            <p><strong>Date:</strong> {issuedOn ?? new Date().toLocaleDateString("en-IN")}</p>
            <span className="badge">{locked ? "PRICE LOCKED" : "DRAFT"}</span>
          </div>
        </div>

        <div className="billto">
          <h3>Bill To</h3>
          <div><strong>Client Name</strong></div>
          <div>456 Client Road, Mumbai, Maharashtra 400001</div>
          <div>client@email.com</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Description</th>
              <th className="num">Qty</th>
              <th className="num">Rate</th>
              <th className="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            {shownItems.map((item, idx) => (
              <tr key={item.id}>
                <td>{idx + 1}</td>
                <td>
                  <input
                    value={item.description}
                    disabled={locked}
                    onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  />
                </td>
                <td className="num">
                  <input
                    className="small"
                    type="number"
                    value={item.qty}
                    disabled={locked}
                    onChange={(e) => updateItem(item.id, "qty", e.target.value)}
                  />
                </td>
                <td className="num">
                  <input
                    className="small"
                    type="number"
                    value={item.price}
                    disabled={locked}
                    onChange={(e) => updateItem(item.id, "price", e.target.value)}
                  />
                </td>
                <td className="num">{formatINR(item.qty * item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="totals">
          <div><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          <div><span>GST ({GST_RATE * 100}%)</span><span>{formatINR(tax)}</span></div>
          <div className="grand"><span>Total</span><span>{formatINR(total)}</span></div>
        </div>

        <div className="footer">
          Payment due within 15 days. Thank you for your business.
          {locked && " | Prices locked on conversion from quotation."}
        </div>
      </div>
    </div>
  );
}