import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { trucksTable } from "./trucks";

export const metersTable = pgTable("meters", {
  id: serial("id").primaryKey(),
  meterId: text("meter_id").notNull().unique(),
  status: text("status").notNull().default("active"),
  meterDeliveryStatus: text("meter_delivery_status").notNull().default("pending"),
  truckId: integer("truck_id").notNull().references(() => trucksTable.id, { onDelete: "cascade" }),
  lastSeenAt: timestamp("last_seen_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMeterSchema = createInsertSchema(metersTable).omit({ id: true, createdAt: true });
export type InsertMeter = z.infer<typeof insertMeterSchema>;
export type Meter = typeof metersTable.$inferSelect;
