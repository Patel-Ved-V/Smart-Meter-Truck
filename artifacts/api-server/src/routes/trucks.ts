import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { trucksTable, metersTable, deliveriesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

const truckBasePositions: Record<number, { lat: number; lng: number }> = {};
const truckOffsets: Record<number, { lat: number; lng: number }> = {};

function getSimulatedLocation(truckId: number) {
  if (!truckBasePositions[truckId]) {
    const basePositions = [
      { lat: 23.0225, lng: 72.5714 },
      { lat: 23.0395, lng: 72.5550 },
      { lat: 23.0050, lng: 72.5900 },
      { lat: 22.9964, lng: 72.6080 },
    ];
    const idx = (truckId - 1) % basePositions.length;
    truckBasePositions[truckId] = basePositions[idx];
    truckOffsets[truckId] = { lat: 0, lng: 0 };
  }
  truckOffsets[truckId].lat += (Math.random() - 0.5) * 0.001;
  truckOffsets[truckId].lng += (Math.random() - 0.5) * 0.001;
  truckOffsets[truckId].lat = Math.max(-0.05, Math.min(0.05, truckOffsets[truckId].lat));
  truckOffsets[truckId].lng = Math.max(-0.05, Math.min(0.05, truckOffsets[truckId].lng));
  return {
    lat: truckBasePositions[truckId].lat + truckOffsets[truckId].lat,
    lng: truckBasePositions[truckId].lng + truckOffsets[truckId].lng,
  };
}

function computeDeliveryStatus(meters: { meterDeliveryStatus: string }[]): "pending" | "partially_delivered" | "delivered" {
  if (meters.length === 0) return "pending";
  const deliveredCount = meters.filter((m) => m.meterDeliveryStatus === "delivered").length;
  if (deliveredCount === 0) return "pending";
  if (deliveredCount === meters.length) return "delivered";
  return "partially_delivered";
}

async function buildTruckResponse(truck: typeof trucksTable.$inferSelect) {
  const meters = await db.select().from(metersTable).where(eq(metersTable.truckId, truck.id));
  const activeMeterCount = meters.filter((m) => m.status === "active").length;
  const status = meters.length === 0 || activeMeterCount < meters.length ? "WARNING" : "READY";
  const deliveryStatus = computeDeliveryStatus(meters);

  return {
    ...truck,
    status,
    deliveryStatus,
    meterCount: meters.length,
    activeMeterCount,
    deliveredMeterCount: meters.filter((m) => m.meterDeliveryStatus === "delivered").length,
  };
}

// GET /api/trucks
router.get("/", async (_req, res) => {
  const trucks = await db.select().from(trucksTable).orderBy(trucksTable.createdAt);
  const trucksWithStats = await Promise.all(trucks.map(buildTruckResponse));
  res.json(trucksWithStats);
});

// POST /api/trucks
router.post("/", async (req, res) => {
  const { numberPlate } = req.body;
  if (!numberPlate) {
    res.status(400).json({ message: "numberPlate is required" });
    return;
  }
  const [truck] = await db.insert(trucksTable).values({ numberPlate }).returning();
  res.status(201).json({
    ...truck,
    status: "WARNING",
    deliveryStatus: "pending",
    meterCount: 0,
    activeMeterCount: 0,
    deliveredMeterCount: 0,
  });
});

// GET /api/trucks/locations/all — must be before /:truckId
router.get("/locations/all", async (_req, res) => {
  const trucks = await db.select().from(trucksTable);
  const locations = trucks.map((truck) => {
    const loc = getSimulatedLocation(truck.id);
    return {
      truckId: truck.id,
      numberPlate: truck.numberPlate,
      lat: loc.lat,
      lng: loc.lng,
      timestamp: new Date().toISOString(),
    };
  });
  res.json(locations);
});

// GET /api/trucks/:truckId
router.get("/:truckId", async (req, res) => {
  const truckId = parseInt(req.params.truckId);
  if (isNaN(truckId)) { res.status(400).json({ message: "Invalid truck ID" }); return; }

  const [truck] = await db.select().from(trucksTable).where(eq(trucksTable.id, truckId));
  if (!truck) { res.status(404).json({ message: "Truck not found" }); return; }

  const meters = await db.select().from(metersTable).where(eq(metersTable.truckId, truckId));
  const activeMeterCount = meters.filter((m) => m.status === "active").length;
  const status = meters.length === 0 || activeMeterCount < meters.length ? "WARNING" : "READY";
  const deliveryStatus = computeDeliveryStatus(meters);

  res.json({ ...truck, status, deliveryStatus, meters });
});

// DELETE /api/trucks/:truckId
router.delete("/:truckId", async (req, res) => {
  const truckId = parseInt(req.params.truckId);
  if (isNaN(truckId)) { res.status(400).json({ message: "Invalid truck ID" }); return; }
  await db.delete(trucksTable).where(eq(trucksTable.id, truckId));
  res.json({ message: "Truck deleted successfully" });
});

// GET /api/trucks/:truckId/location
router.get("/:truckId/location", async (req, res) => {
  const truckId = parseInt(req.params.truckId);
  if (isNaN(truckId)) { res.status(400).json({ message: "Invalid truck ID" }); return; }

  const [truck] = await db.select().from(trucksTable).where(eq(trucksTable.id, truckId));
  if (!truck) { res.status(404).json({ message: "Truck not found" }); return; }

  const loc = getSimulatedLocation(truckId);
  res.json({ truckId, numberPlate: truck.numberPlate, lat: loc.lat, lng: loc.lng, timestamp: new Date().toISOString() });
});

export default router;
