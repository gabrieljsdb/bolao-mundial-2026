import { Router } from "express";
import { db } from "@workspace/db";
import { users, officialResults, activityLogs, systemConfig, userPredictions } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "./auth";
import nodemailer from "nodemailer";
import { computeScore } from "../lib/scoring";

const router = Router();

router.get("/admin/results", async (req: any, res) => {
  try {
    const results = await db.query.officialResults.findMany();
    res.json(results);
  } catch (err) {
    req.log?.error?.(err, "admin get results error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/results", requireAdmin, async (req: any, res) => {
  const { matchId, homeScore, awayScore } = req.body;
  if (!matchId || homeScore === undefined || awayScore === undefined) {
    return res.status(400).json({ error: "Dados incompletos" });
  }
  try {
    const existing = await db.query.officialResults.findFirst({ where: eq(officialResults.matchId, matchId) });
    if (existing) {
      await db.update(officialResults).set({ homeScore, awayScore, updatedAt: new Date() }).where(eq(officialResults.matchId, matchId));
    } else {
      await db.insert(officialResults).values({ matchId, homeScore, awayScore });
    }
    await db.insert(activityLogs).values({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "set_result",
      details: {
        matchId,
        homeScore,
        awayScore,
        isUpdate: !!existing,
        ...(existing ? { previousHomeScore: existing.homeScore, previousAwayScore: existing.awayScore } : {}),
      },
    });
    res.json({ success: true });
  } catch (err) {
    req.log.error(err, "admin set result error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/users", requireAdmin, async (req: any, res) => {
  try {
    const allUsers = await db.query.users.findMany();
    const allPredictions = await db.query.userPredictions.findMany();
    const allResults = await db.query.officialResults.findMany();
    const cfg = await db.query.systemConfig.findFirst();
    const knockoutResults = (cfg?.officialKnockoutResults as any) ?? null;
    const predMap: Record<number, any> = {};
    for (const p of allPredictions) predMap[p.userId] = p;

    const list = allUsers.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      department: u.department,
      role: u.role,
      hasPaid: u.hasPaid,
      createdAt: u.createdAt,
      score: computeScore(predMap[u.id], allResults, knockoutResults),
    }));
    res.json(list);
  } catch (err) {
    req.log.error(err, "admin list users error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/users/:id/payment", requireAdmin, async (req: any, res) => {
  const userId = parseInt(req.params.id);
  const { hasPaid } = req.body;
  try {
    await db.update(users).set({ hasPaid: !!hasPaid, updatedAt: new Date() }).where(eq(users.id, userId));
    await db.insert(activityLogs).values({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "update_payment",
      details: { targetUserId: userId, hasPaid: !!hasPaid },
    });
    res.json({ success: true });
  } catch (err) {
    req.log.error(err, "admin update payment error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/activity-logs", requireAdmin, async (req: any, res) => {
  try {
    const logs = await db.query.activityLogs.findMany({ orderBy: (t, { desc }) => [desc(t.createdAt)], limit: 500 });
    res.json(logs);
  } catch (err) {
    req.log.error(err, "admin logs error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// Auditoria de palpites — acessível ao admin sempre, e a qualquer autenticado quando o bolão estiver travado
router.get("/audit/predictions", async (req: any, res) => {
  try {
    const cfg = await db.query.systemConfig.findFirst();
    const isLocked = cfg?.isLocked ?? false;
    const isAdmin = req.user?.role === "admin";
    if (!isLocked && !isAdmin) {
      return res.status(403).json({ error: "Palpites visíveis apenas após o fechamento do bolão" });
    }
    const allUsers = await db.query.users.findMany({ orderBy: (t, { asc }) => [asc(t.name)] });
    const allPredictions = await db.query.userPredictions.findMany();
    const predMap: Record<number, any> = {};
    for (const p of allPredictions) predMap[p.userId] = p;
    const result = allUsers
      .filter(u => u.role !== "admin")
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        department: u.department,
        confirmedGroups: predMap[u.id]?.confirmedGroups ?? false,
        confirmedKnockout: predMap[u.id]?.confirmedKnockout ?? false,
        groupPredictions: predMap[u.id]?.groupPredictions ?? null,
        finalPrediction: predMap[u.id]?.finalPrediction ?? null,
        finalistPrediction: predMap[u.id]?.finalistPrediction ?? null,
        r16Predictions: predMap[u.id]?.r16Predictions ?? null,
        qfPredictions: predMap[u.id]?.qfPredictions ?? null,
        sfPredictions: predMap[u.id]?.sfPredictions ?? null,
        updatedAt: predMap[u.id]?.updatedAt ?? null,
      }));
    res.json({ isLocked, participants: result });
  } catch (err: any) {
    req.log?.error?.(err, "audit predictions error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/admin/smtp-config", requireAdmin, async (req: any, res) => {
  try {
    const cfg = await db.query.systemConfig.findFirst();
    const smtp = cfg?.smtpConfig || {};
    res.json({ ...smtp, configured: !!(smtp as any).host });
  } catch (err) {
    req.log.error(err, "get smtp error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/smtp-config", requireAdmin, async (req: any, res) => {
  try {
    let cfg = await db.query.systemConfig.findFirst();
    const smtpData = { host: req.body.host, port: Number(req.body.port), user: req.body.user, pass: req.body.pass, from: req.body.from };
    if (cfg) {
      await db.update(systemConfig).set({ smtpConfig: smtpData, updatedAt: new Date() }).where(eq(systemConfig.id, cfg.id));
    } else {
      await db.insert(systemConfig).values({ smtpConfig: smtpData });
    }
    await db.insert(activityLogs).values({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "update_smtp",
      details: { host: req.body.host },
    });
    res.json({ success: true });
  } catch (err) {
    req.log.error(err, "save smtp error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/test-email", requireAdmin, async (req: any, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: "Destinatário obrigatório" });
  try {
    const cfg = await db.query.systemConfig.findFirst();
    const smtp = cfg?.smtpConfig as any;
    if (!smtp?.host) return res.status(400).json({ error: "SMTP não configurado" });
    const transporter = nodemailer.createTransport({ host: smtp.host, port: smtp.port, auth: { user: smtp.user, pass: smtp.pass } });
    await transporter.sendMail({ from: smtp.from, to, subject: "Teste - Bolão Copa 2026", text: "Email de teste do sistema Bolão Copa 2026." });
    await db.insert(activityLogs).values({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "test_email",
      details: { to },
    });
    res.json({ success: true, message: "Email enviado com sucesso!" });
  } catch (err: any) {
    req.log.error(err, "test email error");
    res.status(500).json({ error: "Erro ao enviar email", details: err.message });
  }
});

router.put("/admin/users/:id/predictions", requireAdmin, async (req: any, res) => {
  const targetUserId = parseInt(req.params.id);
  if (isNaN(targetUserId)) return res.status(400).json({ error: "ID inválido" });
  try {
    const existing = await db.query.userPredictions.findFirst({ where: eq(userPredictions.userId, targetUserId) });
    const data = {
      userId: targetUserId,
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
      await db.update(userPredictions).set(data).where(eq(userPredictions.userId, targetUserId));
    } else {
      await db.insert(userPredictions).values(data);
    }
    const targetUser = await db.query.users.findFirst({ where: eq(users.id, targetUserId) });
    await db.insert(activityLogs).values({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "admin_edit_predictions",
      details: { targetUserId, targetEmail: targetUser?.email },
    });
    res.json({ success: true });
  } catch (err) {
    req.log.error(err, "admin edit predictions error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/admin/send-reports", requireAdmin, async (req: any, res) => {
  try {
    const cfg = await db.query.systemConfig.findFirst();
    const smtp = cfg?.smtpConfig as any;
    if (!smtp?.host) return res.status(400).json({ error: "SMTP não configurado" });
    const allUsers = await db.query.users.findMany();
    const allResults = await db.query.officialResults.findMany();
    const allPredictions = await db.query.userPredictions.findMany();
    const predMap: Record<number, any> = {};
    for (const p of allPredictions) predMap[p.userId] = p;
    const resultsMap: Record<string, { home: number; away: number }> = {};
    for (const r of allResults) resultsMap[r.matchId] = { home: r.homeScore, away: r.awayScore };
    const transporter = nodemailer.createTransport({ host: smtp.host, port: smtp.port, auth: { user: smtp.user, pass: smtp.pass } });
    let sent = 0;
    const errors: string[] = [];
    for (const u of allUsers.filter(u => u.role !== "admin" && u.hasPaid)) {
      try {
        await transporter.sendMail({
          from: smtp.from,
          to: u.email,
          subject: "Seu comprovante - Bolão Copa 2026",
          html: `<p>Olá ${u.name || u.email}!</p><p>Seu status de pagamento: <strong>${u.hasPaid ? "CONFIRMADO" : "PENDENTE"}</strong></p>`,
        });
        sent++;
      } catch (e: any) {
        errors.push(`${u.email}: ${e.message}`);
      }
    }
    await db.insert(activityLogs).values({
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
      action: "send_reports",
      details: { sent, errors: errors.length },
    });
    res.json({ success: true, sent, failed: errors.length, total: allUsers.filter(u => u.role !== "admin" && u.hasPaid).length, errors });
  } catch (err: any) {
    req.log.error(err, "send reports error");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
