import { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetTruck, 
  useCreateMeter, 
  useUpdateMeter, 
  useDeleteMeter,
  getGetTruckQueryKey,
  getGetStatsQueryKey,
  getGetTrucksQueryKey,
  useGetTrucks
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Truck, Activity, Plus, Trash2, ArrowRightLeft, ShieldCheck, Wifi, WifiOff, Clock, QrCode, CheckCircle2, Package } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TruckDetail() {
  const [, params] = useRoute("/trucks/:id");
  const truckId = parseInt(params?.id || "0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newMeterId, setNewMeterId] = useState("");

  const [moveMeterId, setMoveMeterId] = useState<number | null>(null);
  const [qrMeter, setQrMeter] = useState<{ meterId: string } | null>(null);
  const [targetTruckId, setTargetTruckId] = useState<string>("");

  const { data: truck, isLoading } = useGetTruck(truckId, {
    query: { refetchInterval: 5000 }
  });
  const { data: allTrucks } = useGetTrucks();

  const otherTrucks = allTrucks?.filter(t => t.id !== truckId) || [];

  const createMeter = useCreateMeter({
    mutation: {
      onSuccess: () => {
        invalidateCache();
        setIsAddOpen(false);
        setNewMeterId("");
        toast({ title: "Meter Added", description: "System auto-assigned connection status via cloud simulation." });
      },
      onError: (err: any) => toast({ variant: "destructive", title: "Error", description: err.message })
    }
  });

  const updateMeter = useUpdateMeter({
    mutation: {
      onSuccess: () => {
        invalidateCache();
        setMoveMeterId(null);
        toast({ title: "Meter Moved", description: "Meter transferred to new truck." });
      }
    }
  });

  const deleteMeter = useDeleteMeter({
    mutation: {
      onSuccess: () => {
        invalidateCache();
        toast({ title: "Meter Removed", description: "Meter deleted from system." });
      }
    }
  });

  const invalidateCache = () => {
    queryClient.invalidateQueries({ queryKey: getGetTruckQueryKey(truckId) });
    queryClient.invalidateQueries({ queryKey: getGetTrucksQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
  };

  const handleAddMeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeterId) return;
    createMeter.mutate({ data: { meterId: newMeterId, truckId } });
  };

  const handleMoveMeter = (meterId: number) => {
    if (!targetTruckId) return;
    updateMeter.mutate({
      meterId,
      data: { truckId: parseInt(targetTruckId) }
    });
  };

  if (isLoading) {
    return <div className="p-8 space-y-6"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-[400px] w-full" /></div>;
  }

  if (!truck) {
    return <div className="text-center py-20"><h2 className="text-2xl font-bold">Truck not found</h2><Link href="/" className="text-primary mt-4 inline-block hover:underline">Back to Dashboard</Link></div>;
  }

  return (
    <>
    <div className="space-y-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl hover-elevate">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            {truck.numberPlate}
            <Badge variant={truck.status === 'READY' ? 'default' : 'destructive'} className={truck.status === 'READY' ? 'bg-success hover:bg-success text-success-foreground' : ''}>
              {truck.status}
            </Badge>
            <Badge variant="outline" className={truck.deliveryStatus === 'delivered' ? 'border-success/50 text-success bg-success/10' : 'border-muted-foreground/30 text-muted-foreground'}>
              {truck.deliveryStatus === 'delivered' ? 'Delivered' : 'In Transit'}
            </Badge>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Registered: {new Date(truck.createdAt).toLocaleDateString()} &nbsp;·&nbsp;
            <span className="text-xs bg-muted px-2 py-0.5 rounded font-medium">Connection status auto-detected by cloud system</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Sidebar */}
        <div className="space-y-6">
          <Card className="border-2 shadow-sm bg-card/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Fleet Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-background rounded-lg border">
                <span className="text-muted-foreground font-medium">Total Capacity</span>
                <span className="font-bold text-xl">{truck.meters?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-success/10 border border-success/20 rounded-lg">
                <span className="text-success-foreground font-medium flex items-center gap-1.5">
                  <Wifi className="w-4 h-4" /> Connected
                </span>
                <span className="font-bold text-xl text-success">{truck.meters?.filter(m => m.status === 'active').length || 0}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <span className="text-destructive-foreground font-medium flex items-center gap-1.5">
                  <WifiOff className="w-4 h-4" /> Disconnected
                </span>
                <span className="font-bold text-xl text-destructive">{truck.meters?.filter(m => m.status === 'inactive').length || 0}</span>
              </div>
              <p className="text-xs text-muted-foreground text-center pt-2 border-t">
                Bluetooth mesh status is automatically detected by the cloud simulation
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Meters List */}
        <div className="md:col-span-2">
          <Card className="border-2 shadow-md h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between border-b pb-4 bg-muted/20">
              <div>
                <CardTitle>Assigned Meters</CardTitle>
                <CardDescription>Smart meters in this truck. Connection status is cloud-detected.</CardDescription>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="shadow-md hover-elevate">
                    <Plus className="w-4 h-4 mr-2" /> Add Meter
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddMeter}>
                    <DialogHeader>
                      <DialogTitle>Add Smart Meter</DialogTitle>
                      <DialogDescription>
                        Enter the meter serial number. The cloud system will automatically detect its Bluetooth connection status.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="meterId">Meter ID / Serial Number</Label>
                        <Input id="meterId" value={newMeterId} onChange={(e) => setNewMeterId(e.target.value)} placeholder="e.g. Meter011" required />
                      </div>
                      <div className="rounded-lg bg-muted/50 border p-3 text-sm text-muted-foreground flex items-start gap-2">
                        <Wifi className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                        Connection status will be automatically assigned by the cloud simulation system.
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={createMeter.isPending || !newMeterId}>Add Meter</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              <div className="overflow-x-auto h-[500px] overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Meter ID</th>
                      <th className="px-6 py-4 font-semibold">Connection</th>
                      <th className="px-6 py-4 font-semibold">Delivery</th>
                      <th className="px-6 py-4 font-semibold">Added</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {truck.meters?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-muted-foreground">
                          <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          No meters assigned yet.
                        </td>
                      </tr>
                    ) : (
                      truck.meters?.map((meter) => (
                        <tr key={meter.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 font-medium font-mono">{meter.meterId}</td>
                          <td className="px-6 py-4">
                            {meter.status === 'active' ? (
                              <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success">
                                  <Wifi className="w-3 h-3" /> Active
                                </span>
                                <p className="text-xs text-success/80 mt-1 ml-0.5">Tracking Live</p>
                              </div>
                            ) : (
                              <div>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-destructive/10 text-destructive">
                                  <WifiOff className="w-3 h-3" /> Not Tracking
                                </span>
                                <div className="mt-1.5 ml-0.5 text-xs text-muted-foreground space-y-0.5">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {meter.lastSeenAt ? (
                                        <span>Last Seen: {new Date(meter.lastSeenAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                      ) : (
                                        <span>Last Seen: Just now</span>
                                      )}
                                    </div>
                                    <div className="pl-4">
                                      {meter.lastSeenAt
                                        ? new Date(meter.lastSeenAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                                        : ''}
                                    </div>
                                  </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {meter.meterDeliveryStatus === 'delivered' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/20">
                                <CheckCircle2 className="w-3 h-3" /> Delivered
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground">
                                <Package className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {new Date(meter.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* QR Code */}
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                title="View QR Code"
                                onClick={() => setQrMeter({ meterId: meter.meterId })}
                              >
                                <QrCode className="w-4 h-4" />
                              </Button>
                              {/* Move meter */}
                              <Dialog open={moveMeterId === meter.id} onOpenChange={(open) => !open && setMoveMeterId(null)}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="icon" className="h-8 w-8 hover-elevate text-primary hover:text-primary" onClick={() => setMoveMeterId(meter.id)}>
                                    <ArrowRightLeft className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Move Meter {meter.meterId}</DialogTitle>
                                    <DialogDescription>Transfer this meter to another truck.</DialogDescription>
                                  </DialogHeader>
                                  <div className="py-4">
                                    <Select value={targetTruckId} onValueChange={setTargetTruckId}>
                                      <SelectTrigger><SelectValue placeholder="Select target truck" /></SelectTrigger>
                                      <SelectContent>
                                        {otherTrucks.map(t => (
                                          <SelectItem key={t.id} value={t.id.toString()}>{t.numberPlate} ({t.meterCount} meters)</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <DialogFooter>
                                    <Button variant="ghost" onClick={() => setMoveMeterId(null)}>Cancel</Button>
                                    <Button onClick={() => handleMoveMeter(meter.id)} disabled={!targetTruckId || updateMeter.isPending}>Move</Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              {/* Delete meter */}
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 hover-elevate"
                                onClick={() => {
                                  if (confirm('Remove this meter?')) deleteMeter.mutate({ meterId: meter.id });
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    {/* QR Code Viewer Dialog */}
    
    <Dialog open={!!qrMeter} onOpenChange={(open) => !open && setQrMeter(null)}>
      <DialogContent className="sm:max-w-[320px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary" /> Meter QR Code
          </DialogTitle>
          <DialogDescription>
            Receiver scans this QR code to confirm delivery.
          </DialogDescription>
        </DialogHeader>
        {qrMeter && (
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="p-4 bg-white rounded-xl shadow-inner border">
              <QRCodeSVG value={qrMeter.meterId} size={200} level="H" />
            </div>
            <div className="text-center">
              <p className="font-mono font-bold text-lg">{qrMeter.meterId}</p>
              <p className="text-xs text-muted-foreground mt-1">Print this label and attach to the physical meter</p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setQrMeter(null)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
