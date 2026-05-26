import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import predictionsRouter from "./predictions";
import rankingRouter from "./ranking";
import configRouter from "./config";
import adminRouter from "./admin";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(predictionsRouter);
router.use(rankingRouter);
router.use(configRouter);
router.use(adminRouter);
router.use(reportsRouter);

export default router;
