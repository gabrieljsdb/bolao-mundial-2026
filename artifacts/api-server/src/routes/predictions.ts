import { Router } from "express";
import { db } from "@workspace/db";
import { userPredictions, activityLogs } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "./auth";

const router = Router();

router.get("/predictions", requireAuth, async (req: any, res) => {
  try {
    const prediction = await db.query.userPredictions.findFirst({ where: eq(userPredictions.userId, req.user.id) });
    res.json(prediction || {});
  } catch (err) {
    req.log.error(err, "get predictions error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/predictions/:userId", requireAuth, async (req: any, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const prediction = await db.query.userPredictions.findFirst({ where: eq(userPredictions.userId, userId) });
    res.json(prediction || {});
  } catch (err) {
    req.log.error(err, "get user predictions error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/predictions", requireAuth, async (req: any, res) => {
  try {
    const existing = await db.query.userPredictions.findFirst({ where: eq(userPredictions.userId, req.user.id) });
    const data = {
      userId: req.user.id,
      groupPredictions: req.body.groupPredictions ?? null,
      secondRoundPredictions: req.body.secondRoundPredictions ?? null,
      r16Predictions: req.body.r16Predictions ?? null,
      qfPredictions: req.body.qfPredictions ?? null,
      sfPredictions: req.body.sfPredictions ?? null,
      finalistPrediction: req.body.finalistPrediction ?? null,
      finalPrediction: req.body.finalPrediction ?? null,
      confirmedGroups: req.body.confirmedGroups ?? false,
      confirmedKnockout: req.body.confirmedKnockout ?? false,
      updatedAt: new Date(),
    };
    if (existing) {
      await db.update(userPredictions).set(data).where(eq(userPredictions.userId, req.user.id));
    } else {
      await db.insert(userPredictions).values(data);
    }

    await db.insert(activityLogs).values({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: existing ? "update_predictions" : "create_predictions",
      details: {},
    });

    res.json({ success: true });
  } catch (err) {
    req.log.error(err, "save predictions error");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
