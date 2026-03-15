import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetStats, 
  useGetTrucks, 
  useGetAllTruckLocations,
  useCreateTruck,
  useDeleteTruck,
  getGetTrucksQueryKey,
  getGetStatsQueryKey
} from "@workspace/api-client-react";
import { LiveMap } from "@/components/LiveMap";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Truck, CheckCircle2, AlertTriangle, Plus, ArrowRight, ActivitySquare, PackageCheck, Trash2, WifiOff } from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function SenderDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPlate, setNewPlate] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Poll every 5 seconds for real-time delivery status updates
  const { data: stats, isLoading: statsLoading } = useGetStats({
    query: { refetchInterval: 5000 }
  });
  const { data: trucks, isLoading: trucksLoading } = useGetTrucks({
    query: { refetchInterval: 5000 }
  });

  // Poll locations every 3 seconds for simulated live tracking
  const { data: locations = [] } = useGetAllTruckLocations({
    query: { refetchInterval: 3000 }
  });

  const truckStatuses = trucks?.reduce((acc, truck) => {
    acc[truck.id] = truck.status;
    return acc;
  }, {} as Record<number, string>);

  const createTruck = useCreateTruck({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTrucksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        setIsAddOpen(false);
        setNewPlate("");
        toast({ title: "Truck Added", description: "New truck registered to the fleet." });
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create truck" });
      }
    }
  });

  const deleteTruck = useDeleteTruck({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetTrucksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetStatsQueryKey() });
        setDeletingId(null);
        toast({ title: "Truck Removed", description: "Truck deleted from the fleet." });
      },
      onError: (error: any) => {
        toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete truck" });
      }
    }
  });

  const handleAddTruck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlate.trim()) return;
    createTruck.mutate({ data: { numberPlate: newPlate.toUpperCase() } });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Trucks"
          value={stats?.totalTrucks}
          loading={statsLoading}
          icon={<Truck className="w-5 h-5 text-primary" />}
          trend={`${stats?.readyTrucks ?? 0} ready`}
        />
        <StatCard
          title="Total Meters"
          value={stats?.totalMeters}
          loading={statsLoading}
          icon={<ActivitySquare className="w-5 h-5 text-blue-500" />}
          trend="In fleet"
        />
        <StatCard
          title="Active Meters"
          value={stats?.activeMeters}
          loading={statsLoading}
          icon={<CheckCircle2 className="w-5 h-5 text-success" />}
          className="border-success/20 bg-success/5"
        />
        <StatCard
          title="Inactive Meters"
          value={stats?.inactiveMeters}
          loading={statsLoading}
          icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
          className="border-destructive/20 bg-destructive/5"
        />
        <StatCard
          title="Delivered"
          value={stats?.deliveredTrucks}
          loading={statsLoading}
          icon={<PackageCheck className="w-5 h-5 text-success" />}
          className="border-success/20 bg-success/5"
          trend="Trucks delivered"
        />
      </div>

      {/* Not Tracking Alert */}
      {stats && stats.inactiveMeters > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive"
        >
          <div className="p-1.5 bg-destructive/15 rounded-lg">
            <WifiOff className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <span className="font-semibold">
              {stats.inactiveMeters} Meter{stats.inactiveMeters !== 1 ? 's' : ''} Not Tracking
            </span>
            <span className="text-destructive/70 ml-2 text-sm">
              — Bluetooth mesh signal lost. Last tracking timestamps recorded.
            </span>
          </div>
          <span className="text-xs font-bold bg-destructive/15 px-2 py-1 rounded-md">
            {stats.warningTrucks} Truck{stats.warningTrucks !== 1 ? 's' : ''} WARNING
          </span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px]">
        {/* Map Section */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              Live Fleet Tracking
              <span className="relative flex h-3 w-3 ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
            </h2>
          </div>
          <Card className="flex-1 overflow-hidden p-0 border-2 shadow-lg">
            <LiveMap locations={locations} truckStatuses={truckStatuses} />
          </Card>
        </div>

        {/* Trucks List Section */}
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-display font-bold">Active Fleet</h2>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="shadow-md hover-elevate">
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAddTruck}>
                  <DialogHeader>
                    <DialogTitle>Add New Truck</DialogTitle>
                    <DialogDescription>Register a new transport vehicle for smart meter delivery.</DialogDescription>
                  </DialogHeader>
                  <div className="py-6">
                    <Label htmlFor="plate">Number Plate</Label>
                    <Input
                      id="plate"
                      placeholder="e.g. GJ01AB1234"
                      value={newPlate}
                      onChange={(e) => setNewPlate(e.target.value)}
                      className="mt-2"
                      autoFocus
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createTruck.isPending || !newPlate.trim()}>
                      {createTruck.isPending ? "Adding..." : "Add Truck"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="flex-1 overflow-hidden border-2 shadow-md bg-card/50">
            <div className="h-full overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {trucksLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))
              ) : trucks?.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                  <Truck className="w-12 h-12 mb-4 opacity-20" />
                  <p>No trucks in fleet</p>
                </div>
              ) : (
                trucks?.map((truck, i) => (
                  <motion.div
                    key={truck.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className={`group bg-background border rounded-xl p-4 transition-all ${truck.deliveryStatus === 'delivered' ? 'border-success/30 bg-success/5' : truck.deliveryStatus === 'partially_delivered' ? 'border-warning/30 bg-warning/5 hover:shadow-md' : 'hover:border-primary/50 hover:shadow-md'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg">{truck.numberPlate}</h3>
                        <div className="flex gap-1.5 items-center">
                          <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md ${
                            truck.status === 'READY' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                          }`}>
                            {truck.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{truck.meterCount}</span> meters
                          <span className="mx-2">·</span>
                          <span className={truck.activeMeterCount === truck.meterCount && truck.meterCount > 0 ? 'text-success font-medium' : 'text-warning font-medium'}>
                            {truck.activeMeterCount} active
                          </span>
                        </div>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md ${
                          truck.deliveryStatus === 'delivered'
                            ? 'bg-success/15 text-success'
                            : truck.deliveryStatus === 'partially_delivered'
                            ? 'bg-warning/15 text-warning-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {truck.deliveryStatus === 'delivered' ? 'Delivered' : truck.deliveryStatus === 'partially_delivered' ? 'Partial' : 'In Transit'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/trucks/${truck.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full hover-elevate h-8 text-xs">
                            Open Truck <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:border-destructive/30 hover-elevate"
                              onClick={() => setDeletingId(truck.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Truck</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete <strong>{truck.numberPlate}</strong>? This will also remove all associated meters.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="ghost">Cancel</Button>
                              <Button
                                variant="destructive"
                                disabled={deleteTruck.isPending}
                                onClick={() => deleteTruck.mutate({ truckId: truck.id })}
                              >
                                {deleteTruck.isPending ? "Deleting..." : "Delete Truck"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, loading, className = "" }: any) {
  return (
    <Card className={`overflow-hidden border-2 shadow-sm ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="p-2 bg-background rounded-lg shadow-sm border border-border/50">
            {icon}
          </div>
        </div>
        <div className="space-y-1">
          {loading ? (
            <Skeleton className="h-10 w-24" />
          ) : (
            <p className="text-3xl font-display font-bold">{value !== undefined ? value : 0}</p>
          )}
          {trend && (
            <p className="text-xs text-muted-foreground font-medium">{trend}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
