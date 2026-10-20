import { useState } from "react";
import LineItemsTable from "./LineItemsTable";

type Item = {
  id: number;
  description: string;
  qty: number;
  price: number;
};

type DocStatus = "QUOTATION" | "INVOICE";

const initialItems: Item[] = [];

export default function InvoicePDF() {
  const [status, setStatus] = useState<DocStatus>("QUOTATION");
  const [docNumber, setDocNumber] = useState("QUO-2026-001");
  const [issuedOn, setIssuedOn] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>(initialItems);

  // Price snapshot: frozen copy of items taken at conversion
  const [snapshot, setSnapshot] = useState<Item[] | null>(null);

  const locked = status === "INVOICE";
  const shownItems = snapshot ?? items;

  const handleConvert = () => {
    if (locked) return;
    setSnapshot(items.map((i) => ({ ...i })));
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

        .footer { margin-top: 40px; font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 10px; }

        /* ---------- PRINT RULES ---------- */
        @page { size: A4; margin: 0; }

        @media print {
          body { background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-wrapper { padding: 0; }
          .no-print { display: none !important; }
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

        <LineItemsTable
          items={shownItems}
          setItems={setItems}
          isLocked={locked}
        />

        <div className="footer">
          Payment due within 15 days. Thank you for your business.
          {locked && " | Prices locked on conversion from quotation."}
        </div>
      </div>
    </div>
  );
}
