import BarcodeScanner from "./BarcodeScanner";
import InvoicePDF from "./InvoicePDF";

export default function App() {
  return (
    <>
      <InvoicePDF />
      <hr />
      <BarcodeScanner
        onScanSuccess={(barcode) => {
          console.log("Scanned barcode:", barcode);
        }}
      />
    </>
  );
}
