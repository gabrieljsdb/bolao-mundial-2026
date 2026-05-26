import { Router } from "express";
import { db } from "@workspace/db";
import { systemConfig } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

async function getConfig() {
  let cfg = await db.query.systemConfig.findFirst();
  if (!cfg) {
    [cfg] = await db.insert(systemConfig).values({ isLocked: false }).returning();
  }
  return cfg;
}

router.get("/config", async (req, res) => {
  try {
    const cfg = await getConfig();
    res.json({
      predictionDeadline: cfg.predictionDeadline,
      isLocked: cfg.isLocked,
      officialKnockoutResults: cfg.officialKnockoutResults,
    });
  } catch (err) {
    req.log.error(err, "get config error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/config", requireAdmin, async (req: any, res) => {
  try {
    const cfg = await getConfig();
    await db.update(systemConfig)
      .set({
        predictionDeadline: req.body.predictionDeadline ? new Date(req.body.predictionDeadline) : null,
        isLocked: req.body.isLocked ?? cfg.isLocked,
        officialKnockoutResults: req.body.officialKnockoutResults ?? cfg.officialKnockoutResults,
        updatedAt: new Date(),
      })
      .where(eq(systemConfig.id, cfg.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err, "save config error");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
