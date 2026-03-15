import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { trucksTable, metersTable, deliveriesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/", async (_req, res) => {
  const trucks = await db.select().from(trucksTable);
  const meters = await db.select().from(metersTable);
  const deliveries = await db.select().from(deliveriesTable);

  const activeMeters = meters.filter((m) => m.status === "active").length;
  const inactiveMeters = meters.filter((m) => m.status === "inactive").length;

  const deliveredTruckIds = new Set(deliveries.map((d) => d.truckId));
  const deliveredTrucks = deliveredTruckIds.size;

  let readyTrucks = 0;
  let warningTrucks = 0;

  for (const truck of trucks) {
    const truckMeters = meters.filter((m) => m.truckId === truck.id);
    const activeTruckMeters = truckMeters.filter((m) => m.status === "active").length;
    if (truckMeters.length > 0 && activeTruckMeters === truckMeters.length) {
      readyTrucks++;
    } else {
      warningTrucks++;
    }
  }

  res.json({
    totalTrucks: trucks.length,
    totalMeters: meters.length,
    activeMeters,
    inactiveMeters,
    readyTrucks,
    warningTrucks,
    deliveredTrucks,
  });
});

export default router;
