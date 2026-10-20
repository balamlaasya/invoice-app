import { useState, type Dispatch, type SetStateAction } from "react";

export type Item = {
  id: number;
  description: string;
  qty: number;
  price: number;
};

export type LineItemsTableProps = {
  items?: Item[];
  setItems?: Dispatch<SetStateAction<Item[]>>;
  isLocked?: boolean;
};

const GST_RATE = 0.18; // 18% GST (no 5% discount)

// Paste Deepak's Supabase Project URL and anon key here once he shares them in the group:
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

const DEFAULT_ITEMS: Item[] = [];

export function formatINR(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return (
    "₹" +
    safeAmount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function LineItemsTable({
  items: externalItems,
  setItems: externalSetItems,
  isLocked = false,
}: LineItemsTableProps) {
  const [internalItems, setInternalItems] = useState<Item[]>(DEFAULT_ITEMS);
  const [saveStatus, setSaveStatus] = useState<string>("");

  const items = externalItems ?? internalItems;
  const setItems = externalSetItems ?? setInternalItems;

  const handleAddRow = () => {
    const nextId =
      items.length > 0 ? Math.max(...items.map((item) => item.id)) + 1 : 1;
    setItems([...items, { id: nextId, description: "", qty: 1, price: 0 }]);
    setSaveStatus("");
  };

  const handleRemoveRow = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
    setSaveStatus("");
  };

  const handleUpdateRow = (
    id: number,
    field: keyof Omit<Item, "id">,
    value: string | number
  ) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
    setSaveStatus("");
  };

  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0),
    0
  );
  const gstAmount = subtotal * GST_RATE;
  const grandTotal = subtotal + gstAmount;

  // Inserts invoice data into Supabase
  const handleSaveToSupabase = async () => {
    const invoicePayload = {
      subtotal,
      gst_amount: gstAmount,
      grand_total: grandTotal,
      items,
      created_at: new Date().toISOString(),
    };

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      setSaveStatus(
        `Invoice data ready (${formatINR(grandTotal)})! Add Supabase URL & key to sync.`
      );
      return;
    }

    try {
      setSaveStatus("Saving to Supabase...");
      const response = await fetch(`${SUPABASE_URL}/rest/v1/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Prefer: "return=minimal",
        },
        body: JSON.stringify(invoicePayload),
      });

      if (!response.ok) {
        throw new Error("Failed to insert into Supabase");
      }
      setSaveStatus("Saved to Supabase successfully ✓");
    } catch {
      setSaveStatus("Error saving to Supabase. Check table name & API key.");
    }
  };

  return (
    <div
      style={{
        width: "100%",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#0f172a",
      }}
    >
      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead>
            <tr
              style={{
                borderBottom: "1px solid #e2e8f0",
                backgroundColor: "#f8fafc",
                fontSize: "12px",
                fontWeight: 600,
                textTransform: "uppercase",
                color: "#475569",
              }}
            >
              <th style={{ padding: "12px 16px", width: "48px", textAlign: "center" }}>
                #
              </th>
              <th style={{ padding: "12px 16px" }}>Description</th>
              <th style={{ padding: "12px 16px", width: "110px", textAlign: "right" }}>
                Qty
              </th>
              <th style={{ padding: "12px 16px", width: "150px", textAlign: "right" }}>
                Price (₹)
              </th>
              <th style={{ padding: "12px 16px", width: "150px", textAlign: "right" }}>
                Line Total (₹)
              </th>
              {!isLocked && (
                <th
                  className="no-print"
                  style={{ padding: "12px 16px", width: "96px", textAlign: "center" }}
                >
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody style={{ fontSize: "14px" }}>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={isLocked ? 5 : 6}
                  style={{
                    padding: "32px 16px",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  No items added yet. Click "+ Add Line Item" below to add a row.
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const lineTotal =
                  (Number(item.qty) || 0) * (Number(item.price) || 0);
                return (
                  <tr
                    key={item.id}
                    style={{ borderBottom: "1px solid #e2e8f0" }}
                  >
                    <td
                      style={{
                        padding: "10px 16px",
                        textAlign: "center",
                        color: "#64748b",
                      }}
                    >
                      {index + 1}
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <input
                        type="text"
                        value={item.description}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleUpdateRow(item.id, "description", e.target.value)
                        }
                        placeholder="Enter item description"
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          boxSizing: "border-box",
                        }}
                      />
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.qty}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleUpdateRow(
                            item.id,
                            "qty",
                            e.target.value === ""
                              ? 0
                              : Math.max(0, Number(e.target.value))
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          textAlign: "right",
                          boxSizing: "border-box",
                        }}
                      />
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={item.price}
                        disabled={isLocked}
                        onChange={(e) =>
                          handleUpdateRow(
                            item.id,
                            "price",
                            e.target.value === ""
                              ? 0
                              : Math.max(0, Number(e.target.value))
                          )
                        }
                        style={{
                          width: "100%",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          textAlign: "right",
                          boxSizing: "border-box",
                        }}
                      />
                    </td>
                    <td
                      style={{
                        padding: "10px 16px",
                        textAlign: "right",
                        fontWeight: 600,
                      }}
                    >
                      {formatINR(lineTotal)}
                    </td>
                    {!isLocked && (
                      <td
                        className="no-print"
                        style={{ padding: "10px 16px", textAlign: "center" }}
                      >
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(item.id)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "6px",
                            border: "1px solid #fecdd3",
                            backgroundColor: "#fff1f2",
                            color: "#e11d48",
                            fontSize: "12px",
                            fontWeight: 500,
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{
          padding: "16px 24px",
          backgroundColor: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "16px",
        }}
      >
        <div
          className="no-print"
          style={{ display: "flex", flexDirection: "column", gap: "8px" }}
        >
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {!isLocked && (
              <button
                type="button"
                onClick={handleAddRow}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#4f46e5",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                + Add Line Item
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveToSupabase}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#059669",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Save Invoice to Supabase
            </button>
          </div>
          {saveStatus && (
            <span style={{ fontSize: "12px", color: "#059669", fontWeight: 500 }}>
              {saveStatus}
            </span>
          )}
        </div>

        <div
          style={{
            minWidth: "260px",
            backgroundColor: "#ffffff",
            padding: "16px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            marginLeft: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
              fontSize: "14px",
              color: "#475569",
            }}
          >
            <span>Subtotal</span>
            <span style={{ fontWeight: 600, color: "#1e293b" }}>
              {formatINR(subtotal)}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "8px",
              fontSize: "14px",
              color: "#475569",
            }}
          >
            <span>GST (18%)</span>
            <span style={{ fontWeight: 600, color: "#1e293b" }}>
              {formatINR(gstAmount)}
            </span>
          </div>
          <div
            style={{
              paddingTop: "8px",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
              Grand Total
            </span>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#4f46e5" }}>
              {formatINR(grandTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LineItemsTable;
