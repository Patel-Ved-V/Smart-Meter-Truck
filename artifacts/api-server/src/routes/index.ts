import { Router, type IRouter } from "express";
import healthRouter from "./health";
import trucksRouter from "./trucks";
import metersRouter from "./meters";
import deliveriesRouter from "./deliveries";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/trucks", trucksRouter);
router.use("/meters", metersRouter);
router.use("/deliveries", deliveriesRouter);
router.use("/stats", statsRouter);

export default router;
