import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraOff, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QRScannerProps {
  onScan: (text: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const containerId = "qr-reader-container";

  const startScanner = async () => {
    setError(null);
    try {
      const html5QrCode = new Html5Qrcode(containerId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopScanner();
          onScan(decodedText.trim());
        },
        () => { /* ignore scan errors */ }
      );
      setScanning(true);
    } catch {
      setError("Camera not available. Use manual entry below.");
      setManualMode(true);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch { /* ignore */ }
    }
    setScanning(false);
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onScan(manualInput.trim());
    }
  };

  return (
    <div className="space-y-4">
      {!manualMode ? (
        <>
          <div className="relative rounded-xl overflow-hidden bg-black">
            <div id={containerId} className="w-full" style={{ minHeight: 280 }} />
            {scanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="border-2 border-primary rounded-lg w-48 h-48 opacity-60">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-md" />
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-md" />
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-md" />
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-md" />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</div>
          )}

          <div className="flex gap-2">
            {scanning ? (
              <Button variant="outline" className="flex-1" onClick={stopScanner}>
                <CameraOff className="w-4 h-4 mr-2" /> Stop Camera
              </Button>
            ) : (
              <Button variant="outline" className="flex-1" onClick={startScanner}>
                <Camera className="w-4 h-4 mr-2" /> Start Camera
              </Button>
            )}
            <Button variant="ghost" onClick={() => { stopScanner(); setManualMode(true); }}>
              <Keyboard className="w-4 h-4 mr-2" /> Manual Entry
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-xl p-6 text-center border-2 border-dashed">
            <Keyboard className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-1">Enter the Meter ID printed on the QR label</p>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. Meter004"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
              autoFocus
              className="font-mono"
            />
            <Button onClick={handleManualSubmit} disabled={!manualInput.trim()}>
              Submit
            </Button>
          </div>
          <Button variant="ghost" className="w-full" onClick={() => { setManualMode(false); startScanner(); }}>
            <Camera className="w-4 h-4 mr-2" /> Try Camera Again
          </Button>
        </div>
      )}

      <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => { stopScanner(); onClose(); }}>
        Cancel
      </Button>
    </div>
  );
}
