import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { trucksTable } from "./trucks";

export const deliveriesTable = pgTable("deliveries", {
  id: serial("id").primaryKey(),
  truckId: integer("truck_id").notNull().references(() => trucksTable.id, { onDelete: "cascade" }),
  photoUrl: text("photo_url"),
  notes: text("notes"),
  confirmedAt: timestamp("confirmed_at").notNull().defaultNow(),
});

export const insertDeliverySchema = createInsertSchema(deliveriesTable).omit({ id: true, confirmedAt: true });
export type InsertDelivery = z.infer<typeof insertDeliverySchema>;
export type Delivery = typeof deliveriesTable.$inferSelect;
