import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

type BarcodeScannerProps = {
  onScanSuccess?: (barcode: string) => void;
};

export default function BarcodeScanner({
  onScanSuccess,
}: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [status, setStatus] = useState(
    "Allow camera access when your browser asks."
  );

  const lastBarcodeRef = useRef("");
  const onScanSuccessRef = useRef(onScanSuccess);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "barcode-reader",
      {
        fps: 10,
        qrbox: { width: 260, height: 140 },
        rememberLastUsedCamera: true,
        formatsToSupport: [
          0,  // QR_CODE
          2,  // CODABAR
          3,  // CODE_39
          4,  // CODE_93
          5,  // CODE_128
          8,  // ITF
          9,  // EAN_13
          10, // EAN_8
          13, // UPC_A
          14, // UPC_E
        ],
      },
      false
    );

    let active = true;

    scanner.render(
      (decodedText) => {
        if (
          !active ||
          decodedText === lastBarcodeRef.current
        ) {
          return;
        }

        lastBarcodeRef.current = decodedText;

        setBarcode(decodedText);
        setStatus("Barcode scanned successfully.");

        onScanSuccessRef.current?.(decodedText);
      },
      () => {
        // Ignore normal unsuccessful scanning attempts.
      }
    );

    return () => {
      active = false;

      scanner.clear().catch((error) => {
        console.warn(
          "Could not stop barcode scanner cleanly:",
          error
        );
      });
    };
  }, []);

  return (
    <section className="barcode-scanner">
      <h2>Scan product barcode</h2>

      <p>
        Place the barcode inside the camera scan box.
      </p>

      <div id="barcode-reader" />

      <p role="status" aria-live="polite">
        {status}
      </p>

      <label htmlFor="scanned-barcode">
        Scanned barcode number
      </label>

      <input
        id="scanned-barcode"
        value={barcode}
        readOnly
        placeholder="The barcode number will appear here"
      />

      {barcode && (
        <button
          type="button"
          onClick={() => {
            setBarcode("");
            lastBarcodeRef.current = "";
            setStatus("Ready to scan another item.");
          }}
        >
          Scan another item
        </button>
      )}
    </section>
  );
}
