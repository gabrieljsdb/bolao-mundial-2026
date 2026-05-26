import { Router } from "express";
import { db } from "@workspace/db";
import { users, activityLogs } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.SESSION_SECRET || "bolao2026secret";

function makeToken(userId: number) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
}

export async function requireAuth(req: any, res: any, next: any) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return res.status(401).json({ error: "Não autorizado" });
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as { userId: number };
    const user = await db.query.users.findFirst({ where: eq(users.id, payload.userId) });
    if (!user) return res.status(401).json({ error: "Usuário não encontrado" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido" });
  }
}

export async function requireAdmin(req: any, res: any, next: any) {
  await requireAuth(req, res, () => {
    if (req.user?.role !== "admin") return res.status(403).json({ error: "Acesso negado" });
    next();
  });
}

router.post("/auth/register", async (req, res) => {
  const { email, password, name, department } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email e senha obrigatórios" });
  try {
    const existing = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
    if (existing) return res.status(409).json({ error: "Email já cadastrado" });
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      name: name || null,
      department: department || null,
      role: "user",
    }).returning();
    const token = makeToken(user.id);
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, department: user.department, role: user.role, hasPaid: user.hasPaid } });
  } catch (err) {
    req.log.error(err, "register error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email e senha obrigatórios" });
  try {
    const user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });
    if (!user) return res.status(401).json({ error: "Email ou senha incorretos" });
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Email ou senha incorretos" });
    const token = makeToken(user.id);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, department: user.department, role: user.role, hasPaid: user.hasPaid } });
  } catch (err) {
    req.log.error(err, "login error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/auth/me", requireAuth, async (req: any, res) => {
  const u = req.user;
  res.json({ id: u.id, email: u.email, name: u.name, department: u.department, role: u.role, hasPaid: u.hasPaid });
});

router.post("/auth/update-profile", requireAuth, async (req: any, res) => {
  const { name, department } = req.body;
  try {
    await db.update(users).set({ name: name || null, department: department || null, updatedAt: new Date() }).where(eq(users.id, req.user.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err, "update profile error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.post("/auth/change-password", requireAuth, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Senhas obrigatórias" });
  try {
    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!valid) return res.status(400).json({ error: "Senha atual incorreta" });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, req.user.id));
    res.json({ success: true });
  } catch (err) {
    req.log.error(err, "change password error");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
