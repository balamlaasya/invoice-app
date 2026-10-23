import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
}

export default function BarcodeScanner({ onScanSuccess }: BarcodeScannerProps) {
  const [scanResult, setScanResult] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "barcode-reader",
      { fps: 10, qrbox: { width: 250, height: 150 } },
      false
    );

    scanner.render(
      (decodedText) => {
        setScanResult(decodedText);
        onScanSuccess(decodedText); // Sends scanned barcode to parent component
        scanner.clear().catch((error) => console.error("Failed to clear scanner.", error));
      },
      (error) => {
        // Suppress continuous frame scanning error logs
        console.warn(error);
      }
    );

    return () => {
      scanner.clear().catch((error) => {
        console.error("Failed to clear html5-qrcode scanner on unmount.", error);
      });
    };
  }, [onScanSuccess]);

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
      <h3>Barcode Scanner</h3>
      
      {/* Required HTML container for the scanner */}
      <div id="barcode-reader" style={{ width: '100%' }} />

      <div style={{ marginTop: '15px' }}>
        <p><strong>Scanned Barcode:</strong> {scanResult || "Not scanned yet"}</p>
        
        {scanResult && (
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '8px 16px', cursor: 'pointer', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}
          >
            Scan Another Item
          </button>
        )}
      </div>
    </div>
