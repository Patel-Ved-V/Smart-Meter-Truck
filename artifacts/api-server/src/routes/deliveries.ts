import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { deliveriesTable, trucksTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// GET /api/deliveries
router.get("/", async (_req, res) => {
  const deliveries = await db
    .select({
      id: deliveriesTable.id,
      truckId: deliveriesTable.truckId,
      numberPlate: trucksTable.numberPlate,
      photoUrl: deliveriesTable.photoUrl,
      notes: deliveriesTable.notes,
      confirmedAt: deliveriesTable.confirmedAt,
    })
    .from(deliveriesTable)
    .leftJoin(trucksTable, eq(deliveriesTable.truckId, trucksTable.id))
    .orderBy(deliveriesTable.confirmedAt);

  res.json(deliveries);
});

// POST /api/deliveries
router.post("/", async (req, res) => {
  const { truckId, photoUrl, notes } = req.body;

  if (!truckId) {
    res.status(400).json({ message: "truckId is required" });
    return;
  }

  const [truck] = await db.select().from(trucksTable).where(eq(trucksTable.id, parseInt(truckId)));
  if (!truck) {
    res.status(404).json({ message: "Truck not found" });
    return;
  }

  const [delivery] = await db
    .insert(deliveriesTable)
    .values({
      truckId: parseInt(truckId),
      photoUrl: photoUrl || null,
      notes: notes || null,
    })
    .returning();

  res.status(201).json({
    ...delivery,
    numberPlate: truck.numberPlate,
  });
});

// GET /api/deliveries/:deliveryId
router.get("/:deliveryId", async (req, res) => {
  const deliveryId = parseInt(req.params.deliveryId);
  if (isNaN(deliveryId)) {
    res.status(400).json({ message: "Invalid delivery ID" });
    return;
  }

  const [delivery] = await db
    .select({
      id: deliveriesTable.id,
      truckId: deliveriesTable.truckId,
      numberPlate: trucksTable.numberPlate,
      photoUrl: deliveriesTable.photoUrl,
      notes: deliveriesTable.notes,
      confirmedAt: deliveriesTable.confirmedAt,
    })
    .from(deliveriesTable)
    .leftJoin(trucksTable, eq(deliveriesTable.truckId, trucksTable.id))
    .where(eq(deliveriesTable.id, deliveryId));

  if (!delivery) {
    res.status(404).json({ message: "Delivery not found" });
    return;
  }

  res.json(delivery);
});

export default router;
