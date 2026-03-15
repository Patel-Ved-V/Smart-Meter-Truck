import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetTrucks,
  useScanDeliver,
  getGetTrucksQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Package, Truck, CheckCircle, QrCode, CheckCircle2, 
  XCircle, Clock, AlertTriangle, ChevronDown, ChevronUp 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import QRScanner from "@/components/QRScanner";

export default function ReceiverDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: trucks, isLoading } = useGetTrucks();

  const [scanTarget, setScanTarget] = useState<{ truckId: number; truckPlate: string } | null>(null);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; meterId?: string } | null>(null);
  const [expandedTruck, setExpandedTruck] = useState<number | null>(null);

  const scanDeliverMutation = useScanDeliver();

  const handleScan = async (text: string) => {
    if (!scanTarget) return;

    const result = await scanDeliverMutation.mutateAsync({
      data: { meterIdText: text, truckId: scanTarget.truckId }
    });

    queryClient.invalidateQueries({ queryKey: getGetTrucksQueryKey() });

    if (result.success) {
      setScanResult({ success: true, message: result.message, meterId: text });
      toast({
        title: "Meter Verified",
        description: `Meter ID: ${text} — Delivered`,
      });
    } else {
      setScanResult({ success: false, message: result.message, meterId: text });
    }
  };

  const openScanner = (truckId: number, truckPlate: string) => {
    setScanResult(null);
    setScanTarget({ truckId, truckPlate });
  };

  const closeScanner = () => {
    setScanTarget(null);
    setScanResult(null);
  };

  const scanAnother = () => {
    setScanResult(null);
  };

  const deliveryStatusBadge = (status: string) => {
    if (status === "delivered") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-success/10 text-success border border-success/20">
          <CheckCircle2 className="w-3 h-3" /> Delivered
        </span>
      );
    }
    if (status === "partially_delivered") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-warning/10 text-warning-foreground border border-warning/20">
          <Clock className="w-3 h-3" /> Partial
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground border">
        <Package className="w-3 h-3" /> Pending
      </span>
    );
  };

  const meterDeliveryBadge = (status: string) => {
    if (status === "delivered") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success">
          <CheckCircle2 className="w-3 h-3" /> Delivered
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
        <Clock className="w-3 h-3" /> Pending
      </span>
    );
  };

  const incomingTrucks = trucks?.filter((t) => t.deliveryStatus !== "delivered") || [];
  const completedTrucks = trucks?.filter((t) => t.deliveryStatus === "delivered") || [];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex items-end justify-between border-b pb-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Receiver Operations</h1>
          <p className="text-muted-foreground mt-2">Scan meter QR codes to confirm delivery truck by truck.</p>
        </div>
        <div className="flex gap-3">
          <div className="text-center px-4 py-2 bg-warning/10 rounded-xl border border-warning/20">
            <p className="text-2xl font-bold text-warning-foreground">{incomingTrucks.length}</p>
            <p className="text-xs text-muted-foreground">Incoming</p>
          </div>
          <div className="text-center px-4 py-2 bg-success/10 rounded-xl border border-success/20">
            <p className="text-2xl font-bold text-success">{completedTrucks.length}</p>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </div>
        </div>
      </div>

      {/* Incoming trucks */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Truck className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold">Incoming Shipments</h2>
          <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-xs font-bold">
            {incomingTrucks.length}
          </span>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)
          ) : incomingTrucks.length === 0 ? (
            <Card className="border-dashed border-2 bg-transparent shadow-none">
              <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mb-4 opacity-20 text-success" />
                <p className="text-lg font-medium">All deliveries complete!</p>
              </CardContent>
            </Card>
          ) : (
            incomingTrucks.map((truck, i) => {
              const isExpanded = expandedTruck === truck.id;
              const meters = (truck as any).meters || [];
              const deliveredCount = truck.deliveredMeterCount ?? 0;
              const total = truck.meterCount;
              const progress = total > 0 ? Math.round((deliveredCount / total) * 100) : 0;

              return (
                <motion.div
                  key={truck.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card className="overflow-hidden border-2 hover:border-primary/40 transition-all shadow-sm">
                    {/* Truck header */}
                    <div className="flex items-center gap-4 p-5">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Truck className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-display font-bold text-lg">{truck.numberPlate}</h3>
                          {deliveryStatusBadge(truck.deliveryStatus ?? "pending")}
                          {truck.status === "WARNING" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-destructive/10 text-destructive">
                              <AlertTriangle className="w-3 h-3" /> WARNING
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-success rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0 font-medium">
                            {deliveredCount} / {total} scanned
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => openScanner(truck.id, truck.numberPlate)}
                          className="shadow-sm"
                        >
                          <QrCode className="w-4 h-4 mr-1.5" /> Scan Meter QR
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExpandedTruck(isExpanded ? null : truck.id)}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    {/* Meter list (expandable) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t bg-muted/20">
                            {truck.meterCount === 0 ? (
                              <p className="text-sm text-muted-foreground text-center py-6">No meters assigned to this truck.</p>
                            ) : (
                              <div className="divide-y">
                                {/* We show meter delivery status from truck list; meters details from truck detail fetch */}
                                {Array.from({ length: truck.meterCount }).map((_, idx) => (
                                  <div key={idx} className="flex items-center justify-between px-5 py-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                                        <Package className="w-3.5 h-3.5 text-muted-foreground" />
                                      </div>
                                      <span className="font-mono text-sm text-muted-foreground">Meter {idx + 1} of {truck.meterCount}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">Use scan button above to confirm</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Completed deliveries */}
      {completedTrucks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-success" />
            <h2 className="text-xl font-bold">Completed Deliveries</h2>
            <span className="bg-success/10 text-success px-2.5 py-0.5 rounded-full text-xs font-bold">
              {completedTrucks.length}
            </span>
          </div>
          <div className="space-y-3">
            {completedTrucks.map((truck, i) => (
              <motion.div key={truck.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                <Card className="bg-success/5 border-success/20 shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-bold">{truck.numberPlate}</p>
                        <p className="text-xs text-muted-foreground">{truck.meterCount} meters — all scanned & delivered</p>
                      </div>
                    </div>
                    {deliveryStatusBadge("delivered")}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* QR Scanner Dialog */}
      <Dialog open={!!scanTarget} onOpenChange={(open) => !open && closeScanner()}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-primary" />
              Scan Meter QR — {scanTarget?.truckPlate}
            </DialogTitle>
          </DialogHeader>

          {scanResult ? (
            <div className="space-y-4 py-2">
              {scanResult.success ? (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-9 h-9 text-success" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-success">Meter Verified</p>
                    {scanResult.meterId && (
                      <p className="font-mono text-sm text-muted-foreground mt-1">Meter ID: {scanResult.meterId}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">Status: Delivered</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-9 h-9 text-destructive" />
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-destructive">Scan Failed</p>
                    {scanResult.meterId && (
                      <p className="font-mono text-sm text-muted-foreground mt-1">Meter ID: {scanResult.meterId}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">{scanResult.message}</p>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button className="flex-1" onClick={scanAnother}>
                  <QrCode className="w-4 h-4 mr-2" /> Scan Another
                </Button>
                <Button variant="outline" onClick={closeScanner}>Done</Button>
              </div>
            </div>
          ) : (
            <QRScanner
              onScan={handleScan}
              onClose={closeScanner}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
