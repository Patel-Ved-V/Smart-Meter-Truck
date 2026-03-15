import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { metersTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

const router: IRouter = Router();

function randomStatus(): "active" | "inactive" {
  return Math.random() > 0.3 ? "active" : "inactive";
}

// GET /api/meters
router.get("/", async (req, res) => {
  const truckId = req.query.truckId ? parseInt(req.query.truckId as string) : undefined;
  const meters = truckId
    ? await db.select().from(metersTable).where(eq(metersTable.truckId, truckId))
    : await db.select().from(metersTable);
  res.json(meters);
});

// POST /api/meters/deliver — QR scan delivery confirmation (MUST be before /:meterId)
router.post("/deliver", async (req, res) => {
  const { meterIdText, truckId } = req.body;

  if (!meterIdText || !truckId) {
    res.status(400).json({ success: false, message: "meterIdText and truckId are required" });
    return;
  }

  const [meter] = await db
    .select()
    .from(metersTable)
    .where(and(eq(metersTable.meterId, meterIdText), eq(metersTable.truckId, parseInt(truckId))));

  if (!meter) {
    res.json({ success: false, message: "Meter not assigned to this truck" });
    return;
  }

  if (meter.meterDeliveryStatus === "delivered") {
    res.json({ success: true, message: "Meter already marked as delivered", meter });
    return;
  }

  const [updated] = await db
    .update(metersTable)
    .set({ meterDeliveryStatus: "delivered" })
    .where(eq(metersTable.id, meter.id))
    .returning();

  res.json({ success: true, message: "Meter delivered successfully", meter: updated });
});

// POST /api/meters — status auto-assigned by cloud simulation
router.post("/", async (req, res) => {
  const { meterId, truckId } = req.body;

  if (!meterId || !truckId) {
    res.status(400).json({ message: "meterId and truckId are required" });
    return;
  }

  const status = randomStatus();
  // lastSeenAt always equals createdAt on creation — never a random past date
  const now = new Date();

  const [meter] = await db
    .insert(metersTable)
    .values({ meterId, status, truckId: parseInt(truckId), lastSeenAt: now })
    .returning();

  res.status(201).json(meter);
});

// GET /api/meters/:meterId
router.get("/:meterId", async (req, res) => {
  const meterId = parseInt(req.params.meterId);
  if (isNaN(meterId)) { res.status(400).json({ message: "Invalid meter ID" }); return; }

  const [meter] = await db.select().from(metersTable).where(eq(metersTable.id, meterId));
  if (!meter) { res.status(404).json({ message: "Meter not found" }); return; }

  res.json(meter);
});

// PUT /api/meters/:meterId
router.put("/:meterId", async (req, res) => {
  const meterId = parseInt(req.params.meterId);
  if (isNaN(meterId)) { res.status(400).json({ message: "Invalid meter ID" }); return; }

  const updates: Record<string, unknown> = {};
  if (req.body.truckId !== undefined) updates.truckId = parseInt(req.body.truckId);
  if (req.body.meterId !== undefined) updates.meterId = req.body.meterId;

  const [meter] = await db
    .update(metersTable)
    .set(updates)
    .where(eq(metersTable.id, meterId))
    .returning();

  if (!meter) { res.status(404).json({ message: "Meter not found" }); return; }
  res.json(meter);
});

// DELETE /api/meters/:meterId
router.delete("/:meterId", async (req, res) => {
  const meterId = parseInt(req.params.meterId);
  if (isNaN(meterId)) { res.status(400).json({ message: "Invalid meter ID" }); return; }
  await db.delete(metersTable).where(eq(metersTable.id, meterId));
  res.json({ message: "Meter deleted successfully" });
});

export default router;
