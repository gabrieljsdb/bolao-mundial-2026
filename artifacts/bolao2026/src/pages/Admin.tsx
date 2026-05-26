import { useState, useEffect, useCallback } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { GROUPS, GROUP_MATCHES, TEAMS } from "@/lib/worldCupData";
import { SECOND_ROUND_MATCHUPS, R16_MATCHUPS, QF_MATCHUPS, SF_MATCHUPS } from "@/lib/knockoutData";
import { ScoreInput } from "@/components/ScoreInput";
import {
  Loader2, Shield, Users, Trophy, Settings, Save,
  CheckCircle2, AlertCircle, History, Send, Mail,
  Wifi, WifiOff, Eye, EyeOff, RefreshCw, DollarSign,
  TrendingUp, UserCheck, UserX, Download, Edit2, X,
  ClipboardCheck, ArrowRight, ChevronDown, ChevronUp
} from "lucide-react";
import { useLocation } from "wouter";

const ACTION_LABELS: Record<string, string> = {
  create_predictions:       "Criou previsões",
  update_predictions:       "Atualizou previsões",
  set_result:               "Lançou resultado oficial",
  update_config:            "Atualizou configurações",
  update_payment:           "Atualizou pagamento",
  send_reports:             "Enviou comprovantes por email",
  update_smtp:              "Atualizou configuração SMTP",
  test_email:               "Testou envio de email",
  admin_edit_predictions:   "Admin editou palpites",
};
const ACTION_COLOR: Record<string, string> = {
  create_predictions:       "text-green-400 bg-green-900/30 border-green-700/40",
  update_predictions:       "text-blue-400 bg-blue-900/30 border-blue-700/40",
  set_result:               "text-yellow-400 bg-yellow-900/30 border-yellow-700/40",
  update_config:            "text-purple-400 bg-purple-900/30 border-purple-700/40",
  update_payment:           "text-orange-400 bg-orange-900/30 border-orange-700/40",
  send_reports:             "text-pink-400 bg-pink-900/30 border-pink-700/40",
  update_smtp:              "text-cyan-400 bg-cyan-900/30 border-cyan-700/40",
  test_email:               "text-teal-400 bg-teal-900/30 border-teal-700/40",
  admin_edit_predictions:   "text-amber-400 bg-amber-900/30 border-amber-700/40",
};

type Tab = "dashboard" | "results" | "knockout" | "users" | "config" | "logs" | "audit";

export default function Admin() {
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  const [, setLocation] = useLocation();
  const token = () => localStorage.getItem("worldcup_auth_token") ?? "";
  const authH = () => ({ Authorization: `Bearer ${token()}` });
  const jsonH = () => ({ "Content-Type": "application/json", ...authH() });

  const [activeTab, setActiveTab]       = useState<Tab>("dashboard");
  const [officialResults, setOfficialResults] = useState<any[]>([]);
  const [usersList, setUsersList]       = useState<any[]>([]);
  const [config, setConfig]             = useState<any>({ predictionDeadline: null, isLocked: false });
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [smtp, setSmtp]                 = useState({ host: "", port: 587, user: "", pass: "", from: "", configured: false });
  const [smtpDirty, setSmtpDirty]       = useState(false);
  const [showPass, setShowPass]         = useState(false);
  const [testEmailTo, setTestEmailTo]   = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "pending">("all");
  const [sectorFilter, setSectorFilter] = useState("");

  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [savingSmtp, setSavingSmtp]     = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [sending, setSending]           = useState(false);
  const [sendResult, setSendResult]     = useState<any>(null);
  const [message, setMessage]           = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [logFilter, setLogFilter]       = useState("");
  const [auditPredictions, setAuditPredictions] = useState<{ isLocked: boolean; participants: any[] } | null>(null);
  const [auditExpanded, setAuditExpanded]       = useState<number | null>(null);

  // Modal de edição de palpites
  const [editingUser, setEditingUser]   = useState<any | null>(null);
  const [editPredictions, setEditPredictions] = useState<any>({});
  const [editLoading, setEditLoading]   = useState(false);
  const [editSaving, setEditSaving]     = useState(false);
  const [editTab, setEditTab]           = useState<"groups" | "knockout">("groups");

  const showMsg = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [r1, r2, r3, r4, r5, r6] = await Promise.all([
        fetch("/api/admin/results",       { headers: authH() }),
        fetch("/api/admin/users",         { headers: authH() }),
        fetch("/api/config",              { headers: authH() }),
        fetch("/api/admin/activity-logs", { headers: authH() }),
        fetch("/api/admin/smtp-config",   { headers: authH() }),
        fetch("/api/audit/predictions",   { headers: authH() }),
      ]);
      if (r1.ok) setOfficialResults(await r1.json());
      if (r2.ok) setUsersList(await r2.json());
      if (r3.ok) setConfig(await r3.json());
      if (r4.ok) setActivityLogs(await r4.json());
      if (r5.ok) { setSmtp(await r5.json()); setSmtpDirty(false); }
      if (r6.ok) setAuditPredictions(await r6.json());
    } catch { /* silent */ }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) setLocation("/");
  }, [isAuthenticated, user, authLoading]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") fetchData();
  }, [isAuthenticated, user]);

  const handleSaveResult = async (matchId: string, home: number | null, away: number | null) => {
    if (home === null || away === null) return;
    setSaving(true);
    try {
      const r = await fetch("/api/admin/results", { method: "POST", headers: jsonH(), body: JSON.stringify({ matchId, homeScore: home, awayScore: away }) });
      r.ok ? showMsg("success", "Resultado atualizado!") : showMsg("error", "Erro ao salvar resultado");
      if (r.ok) fetchData(true);
    } catch { showMsg("error", "Erro de conexão"); }
    finally { setSaving(false); }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/config", { method: "POST", headers: jsonH(), body: JSON.stringify(config) });
      r.ok ? showMsg("success", "Configurações salvas!") : showMsg("error", "Erro ao salvar configurações");
      if (r.ok) fetchData(true);
    } catch { showMsg("error", "Erro de conexão"); }
    finally { setSaving(false); }
  };

  const handleTogglePayment = async (userId: number, current: boolean) => {
    try {
      const r = await fetch(`/api/admin/users/${userId}/payment`, { method: "POST", headers: jsonH(), body: JSON.stringify({ hasPaid: !current }) });
      r.ok ? showMsg("success", "Pagamento atualizado!") : showMsg("error", "Erro ao atualizar pagamento");
      if (r.ok) fetchData(true);
    } catch { showMsg("error", "Erro de conexão"); }
  };

  const handleSaveSmtp = async () => {
    setSavingSmtp(true);
    try {
      const r = await fetch("/api/admin/smtp-config", { method: "POST", headers: jsonH(), body: JSON.stringify(smtp) });
      const data = await r.json();
      r.ok ? showMsg("success", "SMTP salvo com sucesso!") : showMsg("error", data.error || "Erro ao salvar SMTP");
      if (r.ok) { setSmtpDirty(false); fetchData(true); }
    } catch { showMsg("error", "Erro de conexão"); }
    finally { setSavingSmtp(false); }
  };

  const handleTestEmail = async () => {
    if (!testEmailTo) return showMsg("error", "Digite o email de destino");
    setTestingEmail(true);
    try {
      const r = await fetch("/api/admin/test-email", { method: "POST", headers: jsonH(), body: JSON.stringify({ to: testEmailTo }) });
      const data = await r.json();
      r.ok ? showMsg("success", data.message) : showMsg("error", data.error + (data.details ? ` — ${data.details}` : ""));
      if (r.ok) fetchData(true);
    } catch { showMsg("error", "Erro de conexão"); }
    finally { setTestingEmail(false); }
  };

  const handleSendReports = async () => {
    setSending(true); setSendResult(null);
    try {
      const r = await fetch("/api/admin/send-reports", { method: "POST", headers: jsonH() });
      const data = await r.json();
      setSendResult(data);
      r.ok && data.success
        ? showMsg("success", `${data.sent} comprovante(s) enviado(s)!`)
        : showMsg("error", data.error || "Erro ao enviar");
      if (r.ok) fetchData(true);
    } catch { showMsg("error", "Erro de conexão"); }
    finally { setSending(false); }
  };

  const handleOpenEdit = async (u: any) => {
    setEditingUser(u);
    setEditLoading(true);
    try {
      const r = await fetch(`/api/predictions/${u.id}`, { headers: authH() });
      const data = r.ok ? await r.json() : {};
      setEditPredictions({
        groupPredictions: data.groupPredictions || {},
        secondRoundPredictions: data.secondRoundPredictions || {},
        r16Predictions: data.r16Predictions || {},
        qfPredictions: data.qfPredictions || {},
        sfPredictions: data.sfPredictions || {},
        finalistPrediction: data.finalistPrediction || [null, null],
        finalPrediction: data.finalPrediction || null,
        confirmedGroups: data.confirmedGroups ?? false,
        confirmedKnockout: data.confirmedKnockout ?? false,
      });
    } catch { setEditPredictions({}); }
    finally { setEditLoading(false); }
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setEditSaving(true);
    try {
      const r = await fetch(`/api/admin/users/${editingUser.id}/predictions`, {
        method: "PUT",
        headers: jsonH(),
        body: JSON.stringify(editPredictions),
      });
      if (r.ok) {
        showMsg("success", `Palpites de ${editingUser.name || editingUser.email} atualizados!`);
        setEditingUser(null);
        fetchData(true);
      } else {
        const d = await r.json();
        showMsg("error", d.error || "Erro ao salvar palpites");
      }
    } catch { showMsg("error", "Erro de conexão"); }
    finally { setEditSaving(false); }
  };

  const updateGroupScore = (groupId: string, matchId: string, side: "homeScore" | "awayScore", val: number | null) => {
    setEditPredictions((prev: any) => {
      const group = prev.groupPredictions?.[groupId] || { groupId, qualified: [], matchPredictions: [] };
      const preds = [...(group.matchPredictions || [])];
      const idx = preds.findIndex((p: any) => p.matchId === matchId);
      if (idx >= 0) {
        preds[idx] = { ...preds[idx], [side]: val };
      } else {
        preds.push({ matchId, result: null, homeScore: null, awayScore: null, [side]: val });
      }
      return { ...prev, groupPredictions: { ...prev.groupPredictions, [groupId]: { ...group, matchPredictions: preds } } };
    });
  };

  const getMatchPred = (groupId: string, matchId: string) => {
    const preds = editPredictions.groupPredictions?.[groupId]?.matchPredictions || [];
    return preds.find((p: any) => p.matchId === matchId) || { homeScore: null, awayScore: null };
  };

  const updateKnockoutPred = (field: string, matchId: string, value: string | null) => {
    setEditPredictions((prev: any) => ({
      ...prev,
      [field]: { ...(prev[field] || {}), [matchId]: value || null },
    }));
  };

  const updateFinalist = (idx: 0 | 1, value: string | null) => {
    setEditPredictions((prev: any) => {
      const arr = [...(prev.finalistPrediction || [null, null])];
      arr[idx] = value || null;
      return { ...prev, finalistPrediction: arr };
    });
  };

  const updateChampion = (value: string | null) => {
    setEditPredictions((prev: any) => ({ ...prev, finalPrediction: value || null }));
  };

  const handleExportRankingCSV = () => {
    const rows = [["Posição", "Nome", "Setor", "Pontos", "Pagamento"]];
    [...usersList].sort((a, b) => b.score - a.score).forEach((u, i) => {
      rows.push([String(i + 1), u.name || "—", u.department || "—", String(u.score), u.hasPaid ? "Pago" : "Pendente"]);
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "ranking_bolao2026.csv"; a.click();
    URL.revokeObjectURL(url);
    showMsg("success", "CSV exportado!");
  };

  const filteredLogs = activityLogs.filter(l => {
    if (!logFilter) return true;
    const f = logFilter.toLowerCase();
    return l.userName?.toLowerCase().includes(f) || l.userEmail?.toLowerCase().includes(f)
      || ACTION_LABELS[l.action]?.toLowerCase().includes(f) || l.action?.toLowerCase().includes(f);
  });

  const updateSmtp = (k: keyof typeof smtp, v: any) => { setSmtp(s => ({ ...s, [k]: v })); setSmtpDirty(true); };

  // Dashboard stats
  const paidCount = usersList.filter(u => u.hasPaid).length;
  const pendingCount = usersList.filter(u => !u.hasPaid).length;
  const totalUsers = usersList.length;
  const topUser = [...usersList].sort((a, b) => b.score - a.score)[0];
  const resultsCount = officialResults.length;

  // Sector stats for dashboard
  const sectorStats: Record<string, { paid: number; total: number }> = {};
  usersList.forEach(u => {
    const dept = u.department || "Outros";
    if (!sectorStats[dept]) sectorStats[dept] = { paid: 0, total: 0 };
    sectorStats[dept].total += 1;
    if (u.hasPaid) sectorStats[dept].paid += 1;
  });

  // Filtered users list
  const filteredUsers = usersList.filter(u => {
    const matchPayment = paymentFilter === "all" || (paymentFilter === "paid" && u.hasPaid) || (paymentFilter === "pending" && !u.hasPaid);
    const matchSector = !sectorFilter || (u.department || "").toLowerCase().includes(sectorFilter.toLowerCase());
    return matchPayment && matchSector;
  });

  if (authLoading || loading) return (
    <div className="min-h-screen bg-[#040d04] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 text-green-500 animate-spin" />
      <p className="text-green-700 font-bebas tracking-widest uppercase">Acessando Área Restrita...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#040d04] text-white pb-20">

      {/* Header */}
      <div className="bg-black/60 border-b border-green-900/30 sticky top-0 z-50 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-900/30 rounded-lg border border-green-500/30">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bebas tracking-wider text-green-400">PAINEL ADMIN</h1>
              <p className="text-[10px] font-mono text-green-700 uppercase">Controle Oficial da Copa 2026</p>
            </div>
          </div>
          <button onClick={() => setLocation("/")} className="px-4 py-2 rounded-lg bg-green-900/20 border border-green-900/50 text-xs font-bebas tracking-widest hover:bg-green-900/40 transition-all">
            VOLTAR AO SIMULADOR
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        {/* Tabs */}
        <div className="flex flex-wrap gap-1.5 mb-8 bg-black/40 p-1 rounded-xl border border-green-900/20 w-fit">
          {([
            { key: "dashboard", Icon: TrendingUp,  label: "DASHBOARD" },
            { key: "results",   Icon: Trophy,      label: "RESULTADOS" },
            { key: "knockout",  Icon: Trophy,      label: "ELIMINATÓRIAS" },
            { key: "users",     Icon: Users,       label: "PARTICIPANTES" },
            { key: "config",    Icon: Settings,       label: "CONFIGURAÇÕES" },
            { key: "logs",      Icon: History,        label: "LOGS" },
            { key: "audit",     Icon: ClipboardCheck, label: "AUDITORIA" },
          ] as const).map(({ key, Icon, label }) => (
            <button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bebas tracking-widest transition-all text-sm ${activeTab === key ? "bg-green-600 text-white shadow-lg" : "text-green-700 hover:text-green-400"}`}>
              <Icon className="w-4 h-4" /> {label}
              {key === "logs" && activityLogs.length > 0 && (
                <span className="bg-green-500/30 text-green-300 text-[10px] px-1.5 py-0.5 rounded-full">{activityLogs.length}</span>
              )}
              {key === "users" && pendingCount > 0 && (
                <span className="bg-red-500/30 text-red-300 text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-[#081a08]/80 border border-green-900/30 rounded-2xl p-6 backdrop-blur-sm">

          {/* ── DASHBOARD ──────────────────────────────────────────────────── */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-green-900/20 pb-4">
                <h2 className="text-2xl font-bebas text-green-400 tracking-widest">DASHBOARD DE PAGAMENTOS</h2>
                <div className="flex gap-2">
                  <button onClick={() => fetchData(true)} className="p-2 bg-green-900/30 hover:bg-green-900/50 border border-green-900/50 rounded-lg transition-all" title="Atualizar">
                    <RefreshCw className="w-4 h-4 text-green-500" />
                  </button>
                  <button onClick={handleExportRankingCSV} className="flex items-center gap-2 px-4 py-2 bg-green-800/40 hover:bg-green-800/60 border border-green-700/40 text-green-300 font-bebas tracking-widest rounded-lg transition-all text-sm">
                    <Download className="w-4 h-4" /> EXPORTAR CSV
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-black/40 border border-green-900/20 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-oswald text-green-700 uppercase tracking-widest">Total de Participantes</p>
                    <Users className="w-4 h-4 text-green-700" />
                  </div>
                  <p className="text-4xl font-bebas text-white">{totalUsers}</p>
                </div>
                <div className="bg-black/40 border border-green-500/20 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-oswald text-green-700 uppercase tracking-widest">Pagamentos Confirmados</p>
                    <UserCheck className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-4xl font-bebas text-green-400">{paidCount}</p>
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: totalUsers > 0 ? `${(paidCount / totalUsers) * 100}%` : "0%" }} />
                  </div>
                  <p className="text-[10px] font-mono text-green-700">{totalUsers > 0 ? Math.round((paidCount / totalUsers) * 100) : 0}% confirmado</p>
                </div>
                <div className="bg-black/40 border border-red-900/20 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-oswald text-green-700 uppercase tracking-widest">Pagamentos Pendentes</p>
                    <UserX className="w-4 h-4 text-red-500" />
                  </div>
                  <p className="text-4xl font-bebas text-red-400">{pendingCount}</p>
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: totalUsers > 0 ? `${(pendingCount / totalUsers) * 100}%` : "0%" }} />
                  </div>
                  <p className="text-[10px] font-mono text-green-700">{totalUsers > 0 ? Math.round((pendingCount / totalUsers) * 100) : 0}% pendente</p>
                </div>
                <div className="bg-black/40 border border-yellow-900/20 rounded-xl p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-oswald text-green-700 uppercase tracking-widest">Resultados Lançados</p>
                    <Trophy className="w-4 h-4 text-yellow-500" />
                  </div>
                  <p className="text-4xl font-bebas text-yellow-400">{resultsCount}</p>
                  <p className="text-[10px] font-mono text-green-700">de 72 jogos da fase de grupos</p>
                </div>
              </div>

              {/* Líder atual */}
              {topUser && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center text-yellow-500 font-bebas text-2xl shrink-0">
                    1º
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-oswald text-yellow-700 uppercase tracking-widest">Líder do Ranking</p>
                    <p className="text-xl font-bebas text-white truncate">{topUser.name}</p>
                    <p className="text-[10px] font-mono text-green-700">{topUser.department || "—"}</p>
                  </div>
                  <p className="text-4xl font-bebas text-yellow-400 shrink-0">{topUser.score} <span className="text-sm text-yellow-700">pts</span></p>
                </div>
              )}

              {/* Pagamentos por setor */}
              <div className="space-y-4">
                <h3 className="font-bebas text-lg text-green-400 tracking-widest border-b border-green-900/20 pb-2">PAGAMENTOS POR SETOR</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(sectorStats).sort(([a], [b]) => a.localeCompare(b)).map(([dept, stats]) => {
                    const pct = stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0;
                    return (
                      <div key={dept} className="bg-black/40 border border-green-900/20 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-oswald text-green-200 uppercase truncate">{dept}</p>
                          <span className={`text-[10px] font-mono font-bold ${pct === 100 ? "text-green-400" : pct >= 50 ? "text-yellow-400" : "text-red-400"}`}>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${pct === 100 ? "bg-green-500" : pct >= 50 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] font-mono text-green-700">{stats.paid}/{stats.total} confirmados</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pendentes de pagamento */}
              {pendingCount > 0 && (
                <div className="space-y-3">
                  <h3 className="font-bebas text-lg text-red-400 tracking-widest border-b border-red-900/20 pb-2">PENDENTES DE PAGAMENTO ({pendingCount})</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {usersList.filter(u => !u.hasPaid).map(u => (
                      <div key={u.id} className="flex items-center justify-between bg-black/40 border border-red-900/20 rounded-lg px-4 py-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-oswald text-green-100 uppercase truncate">{u.name}</p>
                          <p className="text-[10px] font-mono text-green-700 lowercase truncate">{u.department || "—"}</p>
                        </div>
                        <button onClick={() => handleTogglePayment(u.id, u.hasPaid)}
                          className="shrink-0 ml-2 px-3 py-1 rounded-full text-[9px] font-bold border bg-red-500/20 text-red-400 border-red-500/30 hover:bg-green-500/20 hover:text-green-400 hover:border-green-500/30 transition-all">
                          CONFIRMAR
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── RESULTADOS ─────────────────────────────────────────────────── */}
          {activeTab === "results" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-green-900/20 pb-4">
                <h2 className="text-2xl font-bebas text-green-400 tracking-widest">LANÇAR RESULTADOS OFICIAIS</h2>
                <p className="text-xs text-green-700 font-mono">Pontos recalculados automaticamente</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {GROUPS.map(group => (
                  <div key={group.id} className="bg-black/40 rounded-xl border border-green-900/20 overflow-hidden">
                    <div className="bg-green-900/20 px-4 py-2 border-b border-green-900/20">
                      <h3 className="font-bebas text-green-500 tracking-widest">GRUPO {group.id}</h3>
                    </div>
                    <div className="p-4 space-y-4">
                      {GROUP_MATCHES.filter(m => group.teams.includes(m.homeTeamId)).map(match => {
                        const result = officialResults.find(r => r.matchId === match.id);
                        return (
                          <div key={match.id} className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-oswald text-green-200 uppercase truncate flex-1 text-right">{TEAMS[match.homeTeamId].name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <ScoreInput value={result?.homeScore ?? null} onChange={v => handleSaveResult(match.id, v, result?.awayScore ?? 0)} />
                              <span className="text-green-900 text-xs">×</span>
                              <ScoreInput value={result?.awayScore ?? null} onChange={v => handleSaveResult(match.id, result?.homeScore ?? 0, v)} />
                            </div>
                            <span className="text-[10px] font-oswald text-green-200 uppercase truncate flex-1">{TEAMS[match.awayTeamId].name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ELIMINATÓRIAS ───────────────────────────────────────────────── */}
          {activeTab === "knockout" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-green-900/20 pb-4">
                <h2 className="text-2xl font-bebas text-green-400 tracking-widest">DEFINIR CLASSIFICADOS REAIS</h2>
                <button onClick={handleSaveConfig} disabled={saving} className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bebas tracking-widest rounded-lg flex items-center gap-2 disabled:opacity-50">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} SALVAR
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4 md:col-span-2">
                  <h3 className="font-bebas text-xl text-green-400 tracking-widest border-b border-green-900/20 pb-2">8 MELHORES TERCEIROS <span className="text-xs text-green-700 ml-2 font-mono normal-case">+2pts por acerto</span></h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Array.from({ length: 8 }, (_, i) => (
                      <div key={i} className="space-y-1">
                        <label className="text-[10px] font-mono text-green-700 uppercase">{i + 1}º</label>
                        <select value={config.officialKnockoutResults?.bestThirds?.[i] || ""}
                          onChange={e => { const c = [...(config.officialKnockoutResults?.bestThirds || Array(8).fill(""))]; c[i] = e.target.value; setConfig({ ...config, officialKnockoutResults: { ...config.officialKnockoutResults, bestThirds: c } }); }}
                          className="w-full bg-black border border-green-900/50 text-green-400 text-[10px] font-oswald uppercase p-1.5 rounded outline-none focus:border-green-500">
                          <option value="">SELECIONE</option>
                          {Object.values(TEAMS).sort((a, b) => a.name.localeCompare(b.name)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
                {([
                  { label: "SEGUNDA RODADA", items: SECOND_ROUND_MATCHUPS, field: "secondRound" },
                  { label: "OITAVAS DE FINAL", items: R16_MATCHUPS, field: "r16" },
                ] as const).map(({ label, items, field }) => (
                  <div key={field} className="space-y-4">
                    <h3 className="font-bebas text-xl text-yellow-500 tracking-widest border-b border-yellow-900/20 pb-2">{label}</h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {(items as any[]).map((m: any) => (
                        <div key={m.id} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-green-900/20">
                          <span className="text-[10px] font-mono text-green-700 truncate mr-2">{m.label}</span>
                          <select value={config.officialKnockoutResults?.[field]?.[m.id] || ""}
                            onChange={e => setConfig({ ...config, officialKnockoutResults: { ...config.officialKnockoutResults, [field]: { ...config.officialKnockoutResults?.[field], [m.id]: e.target.value } } })}
                            className="bg-black border border-green-900/50 text-green-400 text-[10px] font-oswald uppercase p-1 rounded outline-none focus:border-green-500 w-36 shrink-0">
                            <option value="">SELECIONE</option>
                            {Object.values(TEAMS).sort((a, b) => a.name.localeCompare(b.name)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="space-y-8">
                  {([
                    { label: "QUARTAS DE FINAL", items: QF_MATCHUPS, field: "qf" },
                    { label: "SEMIFINAIS", items: SF_MATCHUPS, field: "sf" },
                  ] as const).map(({ label, items, field }) => (
                    <div key={field} className="space-y-4">
                      <h3 className="font-bebas text-xl text-yellow-500 tracking-widest border-b border-yellow-900/20 pb-2">{label}</h3>
                      <div className="space-y-2">
                        {(items as any[]).map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-green-900/20">
                            <span className="text-[10px] font-mono text-green-700 truncate mr-2">{m.label}</span>
                            <select value={config.officialKnockoutResults?.[field]?.[m.id] || ""}
                              onChange={e => setConfig({ ...config, officialKnockoutResults: { ...config.officialKnockoutResults, [field]: { ...config.officialKnockoutResults?.[field], [m.id]: e.target.value } } })}
                              className="bg-black border border-green-900/50 text-green-400 text-[10px] font-oswald uppercase p-1 rounded outline-none focus:border-green-500 w-36 shrink-0">
                              <option value="">SELECIONE</option>
                              {Object.values(TEAMS).sort((a, b) => a.name.localeCompare(b.name)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <h3 className="font-bebas text-xl text-yellow-500 tracking-widest border-b border-yellow-900/20 pb-2">FINALISTAS E CAMPEÃO</h3>
                  <div className="bg-black/40 p-6 rounded-xl border border-yellow-500/20 space-y-6">
                    {[0, 1].map(i => (
                      <div key={i} className="space-y-2">
                        <label className="text-[10px] font-mono text-yellow-600 uppercase">Finalista {i + 1}</label>
                        <select value={config.officialKnockoutResults?.finalists?.[i] || ""}
                          onChange={e => { const f = [...(config.officialKnockoutResults?.finalists || [null, null])]; f[i] = e.target.value; setConfig({ ...config, officialKnockoutResults: { ...config.officialKnockoutResults, finalists: f } }); }}
                          className="w-full bg-black border border-yellow-900/50 text-yellow-500 font-bebas tracking-widest p-3 rounded-lg outline-none focus:border-yellow-500">
                          <option value="">SELECIONE O TIME</option>
                          {Object.values(TEAMS).sort((a, b) => a.name.localeCompare(b.name)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    ))}
                    <div className="pt-4 border-t border-yellow-500/20 space-y-2">
                      <label className="text-[10px] font-mono text-yellow-400 uppercase font-bold">CAMPEÃO MUNDIAL 🏆</label>
                      <select value={config.officialKnockoutResults?.champion || ""}
                        onChange={e => setConfig({ ...config, officialKnockoutResults: { ...config.officialKnockoutResults, champion: e.target.value } })}
                        className="w-full bg-yellow-500/10 border-2 border-yellow-500 text-yellow-500 font-bebas text-2xl tracking-[0.2em] p-4 rounded-xl outline-none shadow-[0_0_20px_rgba(234,179,8,0.2)]">
                        <option value="">SELECIONE O CAMPEÃO</option>
                        {Object.values(TEAMS).sort((a, b) => a.name.localeCompare(b.name)).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PARTICIPANTES ───────────────────────────────────────────────── */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-green-900/20 pb-4">
                <div>
                  <h2 className="text-2xl font-bebas text-green-400 tracking-widest">LISTA DE PARTICIPANTES</h2>
                  <p className="text-[10px] font-mono text-green-700">{filteredUsers.length} de {usersList.length} usuários</p>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <input value={sectorFilter} onChange={e => setSectorFilter(e.target.value)}
                    placeholder="Filtrar por setor..."
                    className="bg-black/60 border border-green-900/50 rounded-lg px-3 py-2 text-green-300 text-xs font-mono outline-none focus:border-green-500 w-44" />
                  {(["all", "paid", "pending"] as const).map(f => (
                    <button key={f} onClick={() => setPaymentFilter(f)}
                      className={`px-3 py-1.5 rounded-lg font-bebas tracking-widest text-xs transition-all ${paymentFilter === f ? "bg-green-600 text-white" : "bg-black/40 text-green-700 hover:text-green-400 border border-green-900/30"}`}>
                      {f === "all" ? "TODOS" : f === "paid" ? `PAGOS (${paidCount})` : `PENDENTES (${pendingCount})`}
                    </button>
                  ))}
                  <button onClick={handleExportRankingCSV} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-800/40 hover:bg-green-800/60 border border-green-700/40 text-green-300 font-bebas tracking-widest rounded-lg transition-all text-xs">
                    <Download className="w-3 h-3" /> CSV
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-black/40 border-b border-green-900/30">
                      {["Nome","Email","Setor","Pagamento","Role","Pontuação","Ações"].map(h => (
                        <th key={h} className={`p-4 font-bebas text-green-600 tracking-widest uppercase ${h === "Pontuação" ? "text-right" : ""}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="font-oswald uppercase tracking-wider text-xs">
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-green-900/10 hover:bg-white/5 transition-colors">
                        <td className="p-4 text-green-100">{u.name}</td>
                        <td className="p-4 text-green-700 lowercase">{u.email}</td>
                        <td className="p-4 text-green-700">{u.department || "—"}</td>
                        <td className="p-4">
                          <button onClick={() => handleTogglePayment(u.id, u.hasPaid)}
                            className={`px-3 py-1 rounded-full text-[9px] font-bold border transition-all ${u.hasPaid ? "bg-green-500/20 text-green-500 border-green-500/30 hover:bg-green-500/30" : "bg-red-500/20 text-red-500 border-red-500/30 hover:bg-red-500/30"}`}>
                            {u.hasPaid ? "PAGOU" : "PENDENTE"}
                          </button>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${u.role === "admin" ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" : "bg-green-900/20 text-green-500 border border-green-900/30"}`}>{u.role}</span>
                        </td>
                        <td className="p-4 text-right text-green-400 font-bebas text-lg">{u.score} PTS</td>
                        <td className="p-4">
                          <button onClick={() => handleOpenEdit(u)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700/40 text-amber-400 font-bebas tracking-widest rounded-lg transition-all text-xs whitespace-nowrap">
                            <Edit2 className="w-3 h-3" /> PALPITES
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── HISTÓRICO DE ATIVIDADES ─────────────────────────────────────── */}
          {activeTab === "logs" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-green-900/20 pb-4">
                <div>
                  <h2 className="text-2xl font-bebas text-green-400 tracking-widest">HISTÓRICO DE ATIVIDADES</h2>
                  <p className="text-[10px] font-mono text-green-700 uppercase mt-0.5">{filteredLogs.length} evento(s) registrado(s)</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => fetchData(true)} className="p-2 bg-green-900/30 hover:bg-green-900/50 border border-green-900/50 rounded-lg transition-all" title="Atualizar">
                    <RefreshCw className="w-4 h-4 text-green-500" />
                  </button>
                  <input
                    value={logFilter}
                    onChange={e => setLogFilter(e.target.value)}
                    placeholder="Filtrar por nome, email ou ação..."
                    className="bg-black/60 border border-green-900/50 rounded-lg px-3 py-2 text-green-300 text-xs font-mono outline-none focus:border-green-500 w-64 placeholder:text-green-900"
                  />
                  {logFilter && (
                    <button onClick={() => setLogFilter("")} className="p-2 text-green-700 hover:text-green-400 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Resumo por tipo de ação */}
              {!logFilter && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {Object.entries(ACTION_LABELS).map(([action, label]) => {
                    const count = activityLogs.filter(l => l.action === action).length;
                    if (count === 0) return null;
                    return (
                      <button key={action} onClick={() => setLogFilter(label)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-all hover:opacity-80 ${ACTION_COLOR[action] || "text-green-400 bg-green-900/20 border-green-700/30"}`}>
                        <span className="text-[10px] font-oswald uppercase tracking-wider truncate">{label}</span>
                        <span className="text-sm font-bebas ml-2 shrink-0">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Timeline */}
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-green-900">
                  <History className="w-12 h-12" />
                  <p className="font-bebas tracking-widest text-lg">{logFilter ? "NENHUM RESULTADO" : "NENHUMA ATIVIDADE REGISTRADA"}</p>
                </div>
              ) : (
                <div className="relative">
                  {/* linha vertical */}
                  <div className="absolute left-[19px] top-0 bottom-0 w-px bg-green-900/30" />
                  <div className="space-y-1">
                    {filteredLogs.map((log, idx) => {
                      const colorClass = ACTION_COLOR[log.action] || "text-green-400 bg-green-900/20 border-green-700/30";
                      const label = ACTION_LABELS[log.action] || log.action;
                      const date = new Date(log.createdAt);
                      const isToday = new Date().toDateString() === date.toDateString();
                      const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
                      const dateStr = isToday ? "Hoje" : date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

                      // Separator when date changes
                      const prevLog = filteredLogs[idx - 1];
                      const prevDate = prevLog ? new Date(prevLog.createdAt).toDateString() : null;
                      const showDateSep = prevDate !== date.toDateString();

                      return (
                        <div key={log.id}>
                          {showDateSep && (
                            <div className="flex items-center gap-3 py-3 pl-10">
                              <span className="text-[10px] font-mono text-green-800 uppercase tracking-widest">{isToday ? "HOJE" : date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).toUpperCase()}</span>
                            </div>
                          )}
                          <div className="flex items-start gap-4 group py-1.5">
                            {/* dot */}
                            <div className={`w-10 h-10 shrink-0 rounded-full border flex items-center justify-center z-10 ${colorClass}`}>
                              <History className="w-4 h-4" />
                            </div>
                            {/* card */}
                            <div className="flex-1 min-w-0 bg-black/40 border border-green-900/20 rounded-xl px-4 py-3 group-hover:border-green-900/40 transition-all">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold border tracking-widest uppercase ${colorClass}`}>{label}</span>
                                    {log.details?.confirmedGroups && <span className="text-[9px] font-bold text-green-400 bg-green-900/30 border border-green-700/30 px-1.5 py-0.5 rounded uppercase">grupos confirmados</span>}
                                    {log.details?.confirmedKnockout && <span className="text-[9px] font-bold text-blue-400 bg-blue-900/30 border border-blue-700/30 px-1.5 py-0.5 rounded uppercase">eliminatórias confirmadas</span>}
                                  </div>
                                  <p className="text-sm font-oswald text-green-100 uppercase mt-1 truncate">{log.userName || "—"}</p>
                                  <p className="text-[10px] font-mono text-green-700 lowercase truncate">{log.userEmail}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-[10px] font-mono text-green-600">{dateStr}</p>
                                  <p className="text-[10px] font-mono text-green-800">{timeStr}</p>
                                </div>
                              </div>
                              {log.details && Object.keys(log.details).length > 0 && (
                                <div className="mt-2 pt-2 border-t border-green-900/20">
                                  <p className="text-[10px] font-mono text-green-800 truncate">
                                    {Object.entries(log.details)
                                      .filter(([k]) => !["confirmedGroups","confirmedKnockout"].includes(k))
                                      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
                                      .join(" · ")}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── CONFIGURAÇÕES ───────────────────────────────────────────────── */}
          {activeTab === "config" && (
            <div className="max-w-2xl space-y-8">
              <div className="border-b border-green-900/20 pb-4">
                <h2 className="text-2xl font-bebas text-green-400 tracking-widest">CONFIGURAÇÕES DO SISTEMA</h2>
              </div>

              <div className="bg-black/40 p-6 rounded-xl border border-green-900/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bebas text-lg text-green-200 tracking-widest">BLOQUEAR PREVISÕES</h3>
                    <p className="text-[10px] text-green-700 font-mono uppercase">Impedir que usuários alterem seus palpites</p>
                  </div>
                  <button onClick={() => setConfig({ ...config, isLocked: !config.isLocked })}
                    className={`w-14 h-7 rounded-full transition-all relative ${config.isLocked ? "bg-red-600" : "bg-green-600"}`}>
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${config.isLocked ? "left-8" : "left-1"}`} />
                  </button>
                </div>
                {config.isLocked && (
                  <p className="text-xs text-red-400 font-mono bg-red-900/20 border border-red-900/30 rounded-lg px-3 py-2">
                    ⚠ Previsões bloqueadas — usuários não podem mais alterar seus palpites.
                  </p>
                )}
              </div>

              <div className="bg-black/40 p-6 rounded-xl border border-green-900/20 space-y-4">
                <h3 className="font-bebas text-lg text-green-200 tracking-widest">DATA LIMITE (DEADLINE)</h3>
                <input type="datetime-local" value={config.predictionDeadline ? config.predictionDeadline.slice(0, 16) : ""}
                  onChange={e => setConfig({ ...config, predictionDeadline: e.target.value })}
                  className="w-full bg-black/60 border border-green-900/50 rounded-lg p-3 text-green-400 font-mono outline-none focus:border-green-500" />
              </div>

              <button onClick={handleSaveConfig} disabled={saving}
                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bebas tracking-[0.3em] rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                SALVAR CONFIGURAÇÕES
              </button>

              <div className="bg-black/40 p-6 rounded-xl border border-cyan-900/30 space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-900/30 rounded-lg border border-cyan-800/30">
                      <Mail className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-bebas text-lg text-cyan-300 tracking-widest">CONFIGURAÇÃO SMTP</h3>
                      <p className="text-[10px] text-green-700 font-mono uppercase">Servidor de email para envio de comprovantes</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border ${smtp.configured ? "bg-green-900/30 text-green-400 border-green-700/40" : "bg-red-900/30 text-red-400 border-red-700/40"}`}>
                    {smtp.configured ? <><Wifi className="w-3 h-3" /> CONFIGURADO</> : <><WifiOff className="w-3 h-3" /> NÃO CONFIGURADO</>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-green-700 uppercase">Servidor SMTP (host) *</label>
                    <input value={smtp.host} onChange={e => updateSmtp("host", e.target.value)} placeholder="smtp.gmail.com"
                      className="w-full bg-black/60 border border-green-900/50 rounded-lg px-3 py-2.5 text-green-300 text-sm font-mono outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-green-700 uppercase">Porta</label>
                    <input type="number" value={smtp.port} onChange={e => updateSmtp("port", parseInt(e.target.value) || 587)} placeholder="587"
                      className="w-full bg-black/60 border border-green-900/50 rounded-lg px-3 py-2.5 text-green-300 text-sm font-mono outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-green-700 uppercase">Usuário / Email remetente *</label>
                    <input value={smtp.user} onChange={e => updateSmtp("user", e.target.value)} placeholder="seuemail@gmail.com"
                      className="w-full bg-black/60 border border-green-900/50 rounded-lg px-3 py-2.5 text-green-300 text-sm font-mono outline-none focus:border-cyan-500" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-green-700 uppercase">Senha / App Password *</label>
                    <div className="relative">
                      <input type={showPass ? "text" : "password"} value={smtp.pass} onChange={e => updateSmtp("pass", e.target.value)} placeholder="••••••••"
                        className="w-full bg-black/60 border border-green-900/50 rounded-lg px-3 py-2.5 pr-10 text-green-300 text-sm font-mono outline-none focus:border-cyan-500" />
                      <button onClick={() => setShowPass(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-700 hover:text-green-400">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] font-mono text-green-700 uppercase">Nome do remetente (from)</label>
                    <input value={smtp.from} onChange={e => updateSmtp("from", e.target.value)} placeholder='Bolão Copa 2026 <seuemail@gmail.com>'
                      className="w-full bg-black/60 border border-green-900/50 rounded-lg px-3 py-2.5 text-green-300 text-sm font-mono outline-none focus:border-cyan-500" />
                  </div>
                </div>

                <div className="bg-cyan-900/10 border border-cyan-900/20 rounded-lg p-3 text-[10px] font-mono text-green-800 space-y-1">
                  <p className="text-cyan-700 font-bold">💡 Dica para Gmail:</p>
                  <p>Host: <span className="text-green-600">smtp.gmail.com</span> | Porta: <span className="text-green-600">587</span></p>
                  <p>Use uma <strong className="text-green-600">App Password</strong> (não a senha normal).</p>
                </div>

                <button onClick={handleSaveSmtp} disabled={savingSmtp || !smtpDirty}
                  className="w-full py-3 bg-cyan-700 hover:bg-cyan-600 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bebas tracking-[0.3em] rounded-xl transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed">
                  {savingSmtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {smtpDirty ? "SALVAR SMTP" : "SMTP SALVO"}
                </button>

                <div className="border-t border-green-900/20 pt-5 space-y-3">
                  <h4 className="font-bebas text-green-300 tracking-widest">TESTAR ENVIO DE EMAIL</h4>
                  <div className="flex gap-2">
                    <input value={testEmailTo} onChange={e => setTestEmailTo(e.target.value)} placeholder="destinatario@email.com"
                      className="flex-1 bg-black/60 border border-green-900/50 rounded-lg px-3 py-2.5 text-green-300 text-sm font-mono outline-none focus:border-green-500" />
                    <button onClick={handleTestEmail} disabled={testingEmail || !smtp.configured}
                      className="px-5 py-2.5 bg-green-700 hover:bg-green-600 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bebas tracking-widest rounded-lg transition-all flex items-center gap-2 disabled:cursor-not-allowed shrink-0">
                      {testingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      TESTAR
                    </button>
                  </div>
                </div>
              </div>

              <div className={`bg-black/40 p-6 rounded-xl border space-y-4 ${config.isLocked && smtp.configured ? "border-yellow-500/40" : "border-green-900/20 opacity-60"}`}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20 shrink-0">
                    <Mail className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <h3 className="font-bebas text-lg text-yellow-400 tracking-widest">ENVIAR COMPROVANTES POR EMAIL</h3>
                    <p className="text-[10px] text-green-700 font-mono uppercase mt-1">
                      Gera PDF com as previsões de cada participante e envia ao respectivo email.
                    </p>
                    {!config.isLocked && <p className="text-[10px] text-red-400 font-mono mt-1">⚠ Bloqueie as previsões antes de enviar.</p>}
                    {!smtp.configured && <p className="text-[10px] text-red-400 font-mono mt-1">⚠ Configure o SMTP primeiro.</p>}
                  </div>
                </div>

                {sendResult && (
                  <div className={`rounded-lg p-4 text-xs font-mono space-y-1 ${sendResult.success ? "bg-green-900/30 border border-green-700/40 text-green-300" : "bg-red-900/30 border border-red-700/40 text-red-300"}`}>
                    {sendResult.success ? (
                      <>
                        <p>✓ {sendResult.sent}/{sendResult.total} comprovante(s) enviado(s)</p>
                        {sendResult.failed > 0 && <p className="text-yellow-400">⚠ {sendResult.failed} falha(s)</p>}
                      </>
                    ) : (
                      <p>✗ {sendResult.error}</p>
                    )}
                  </div>
                )}

                <button onClick={handleSendReports} disabled={sending || !config.isLocked || !smtp.configured}
                  className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-800 disabled:text-gray-600 text-white font-bebas tracking-[0.3em] rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed">
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {sending ? "GERANDO E ENVIANDO PDFs..." : `ENVIAR COMPROVANTES (${usersList.length} PARTICIPANTES)`}
                </button>
              </div>
            </div>
          )}

          {/* ── LOGS ────────────────────────────────────────────────────────── */}
          {activeTab === "logs" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-green-900/20 pb-4">
                <div>
                  <h2 className="text-2xl font-bebas text-green-400 tracking-widest">HISTÓRICO DE ALTERAÇÕES</h2>
                  <p className="text-[10px] text-green-700 font-mono uppercase">{activityLogs.length} eventos registrados</p>
                </div>
                <div className="flex gap-2 items-center">
                  <input value={logFilter} onChange={e => setLogFilter(e.target.value)}
                    placeholder="Filtrar por usuário ou ação..."
                    className="bg-black/60 border border-green-900/50 rounded-lg px-3 py-2 text-green-300 text-xs font-mono outline-none focus:border-green-500 w-56" />
                  <button onClick={() => fetchData(true)} className="p-2 bg-green-900/30 hover:bg-green-900/50 border border-green-900/50 rounded-lg transition-all" title="Atualizar">
                    <RefreshCw className="w-4 h-4 text-green-500" />
                  </button>
                </div>
              </div>

              {filteredLogs.length === 0 ? (
                <div className="text-center py-16 text-green-800 font-oswald uppercase tracking-widest">Nenhum log encontrado</div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.map(log => (
                    <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-black/30 border border-green-900/20 rounded-xl px-4 py-3 hover:border-green-800/40 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold border ${ACTION_COLOR[log.action] || "text-green-400 bg-green-900/30 border-green-700/40"}`}>
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                        <div className="min-w-0">
                          <p className="text-green-200 text-xs font-oswald uppercase truncate">{log.userName || "—"}</p>
                          <p className="text-green-700 text-[10px] font-mono lowercase truncate">{log.userEmail}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="hidden sm:flex gap-1.5 flex-wrap justify-end max-w-xs">
                            {Object.entries(log.details as any).slice(0, 3).map(([k, v]) => (
                              <span key={k} className="text-[9px] font-mono text-green-800 bg-black/40 px-1.5 py-0.5 rounded border border-green-900/20">
                                {k}: <span className="text-green-600">{String(v)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="text-[10px] font-mono text-green-800 whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── AUDITORIA ────────────────────────────────────────────────────── */}
          {activeTab === "audit" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-green-900/20 pb-4">
                <div>
                  <h2 className="text-2xl font-bebas text-green-400 tracking-widest">AUDITORIA DO BOLÃO</h2>
                  <p className="text-[10px] font-mono text-green-700 uppercase mt-0.5">Transparência total — histórico de resultados e palpites de todos os participantes</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/admin/reports/all-predictions-pdf", {
                          headers: { Authorization: `Bearer ${token()}` },
                        });
                        if (!res.ok) throw new Error(`Erro ${res.status}`);
                        const blob = await res.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `palpites-bolao2026-${new Date().toISOString().slice(0,10)}.pdf`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (e: any) {
                        alert("Erro ao gerar PDF: " + e.message);
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-yellow-700/30 hover:bg-yellow-700/50 border border-yellow-700/50 rounded-lg transition-all text-yellow-300 text-xs font-bebas tracking-widest"
                    title="Baixar PDF com todos os palpites"
                  >
                    <Download className="w-4 h-4" /> PDF COMPLETO
                  </button>
                  <button onClick={() => fetchData(true)} className="p-2 bg-green-900/30 hover:bg-green-900/50 border border-green-900/50 rounded-lg transition-all" title="Atualizar">
                    <RefreshCw className="w-4 h-4 text-green-500" />
                  </button>
                </div>
              </div>

              {/* ── SEÇÃO 1: Histórico de Alterações de Resultados ── */}
              <div className="space-y-4">
                <h3 className="text-lg font-bebas text-yellow-400 tracking-widest flex items-center gap-2">
                  <History className="w-5 h-5" /> HISTÓRICO DE ALTERAÇÕES DE RESULTADOS
                </h3>
                {(() => {
                  const resultLogs = activityLogs.filter(l => l.action === "set_result");
                  if (resultLogs.length === 0) return (
                    <div className="text-center py-10 text-green-800 font-oswald uppercase tracking-widest text-sm">Nenhum resultado registrado ainda</div>
                  );
                  return (
                    <div className="space-y-2">
                      {resultLogs.map(log => {
                        const d = log.details || {};
                        const match = GROUP_MATCHES.find(m => m.id === d.matchId);
                        const homeTeam = match ? TEAMS[match.homeTeamId] : null;
                        const awayTeam = match ? TEAMS[match.awayTeamId] : null;
                        const matchLabel = homeTeam && awayTeam
                          ? `${homeTeam.flag} ${homeTeam.shortName} x ${awayTeam.shortName} ${awayTeam.flag}`
                          : d.matchId;
                        const dt = new Date(log.createdAt);
                        return (
                          <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/30 border border-yellow-900/20 rounded-xl px-4 py-3 hover:border-yellow-800/30 transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 shrink-0 rounded-full bg-yellow-900/30 border border-yellow-700/40 flex items-center justify-center">
                                <Trophy className="w-4 h-4 text-yellow-400" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-green-100 text-sm font-oswald uppercase truncate">{matchLabel}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {d.isUpdate && d.previousHomeScore !== undefined ? (
                                    <span className="text-[10px] font-mono text-green-800 flex items-center gap-1">
                                      <span className="text-red-500/70">{d.previousHomeScore}–{d.previousAwayScore}</span>
                                      <ArrowRight className="w-3 h-3 text-green-900" />
                                      <span className="text-green-400 font-bold">{d.homeScore}–{d.awayScore}</span>
                                      <span className="text-yellow-700 ml-1">(corrigido)</span>
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-mono text-green-400 font-bold">{d.homeScore}–{d.awayScore} <span className="text-green-800">(novo)</span></span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0 pl-11 sm:pl-0">
                              <div className="text-right">
                                <p className="text-[10px] font-oswald text-green-300 uppercase">{log.userName || "—"}</p>
                                <p className="text-[10px] font-mono text-green-800">{dt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* ── SEÇÃO 2: Palpites de Todos os Participantes ── */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bebas text-blue-400 tracking-widest flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5" /> PALPITES DE TODOS OS PARTICIPANTES
                  </h3>
                  {auditPredictions && !auditPredictions.isLocked && (
                    <span className="text-[10px] font-mono text-yellow-600 bg-yellow-900/20 border border-yellow-700/30 px-2 py-1 rounded">
                      BOLÃO ABERTO — visível apenas para admins
                    </span>
                  )}
                  {auditPredictions?.isLocked && (
                    <span className="text-[10px] font-mono text-green-400 bg-green-900/20 border border-green-700/30 px-2 py-1 rounded">
                      BOLÃO FECHADO — visível a todos
                    </span>
                  )}
                </div>

                {!auditPredictions ? (
                  <div className="text-center py-10 text-green-800 font-oswald uppercase tracking-widest text-sm">Carregando palpites...</div>
                ) : auditPredictions.participants.length === 0 ? (
                  <div className="text-center py-10 text-green-800 font-oswald uppercase tracking-widest text-sm">Nenhum participante cadastrado</div>
                ) : (
                  <div className="space-y-2">
                    {auditPredictions.participants.map((p, idx) => {
                      const isOpen = auditExpanded === p.id;
                      const champion = p.finalPrediction ? TEAMS[p.finalPrediction] : null;
                      const finalist0 = p.finalistPrediction?.[0] ? TEAMS[p.finalistPrediction[0]] : null;
                      const finalist1 = p.finalistPrediction?.[1] ? TEAMS[p.finalistPrediction[1]] : null;
                      // Count group predictions entered
                      let predCount = 0;
                      const gp = p.groupPredictions || {};
                      for (const g of Object.values(gp)) {
                        for (const m of ((g as any).matchPredictions || [])) {
                          if (m.homeScore !== null && m.awayScore !== null) predCount++;
                        }
                      }
                      return (
                        <div key={p.id} className="bg-black/30 border border-blue-900/20 rounded-xl overflow-hidden hover:border-blue-800/30 transition-colors">
                          <button
                            onClick={() => setAuditExpanded(isOpen ? null : p.id)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-7 h-7 shrink-0 rounded-full bg-blue-900/30 border border-blue-700/40 flex items-center justify-center">
                                <span className="text-[10px] font-bebas text-blue-400">{idx + 1}</span>
                              </div>
                              <div className="min-w-0">
                                <p className="text-green-100 text-sm font-oswald uppercase truncate">{p.name || "—"}</p>
                                <p className="text-[10px] font-mono text-green-800 truncate">{p.department || "—"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <div className="flex items-center gap-2">
                                {champion && (
                                  <span className="text-[10px] font-mono text-yellow-400 bg-yellow-900/20 border border-yellow-700/30 px-2 py-0.5 rounded flex items-center gap-1">
                                    🏆 {champion.flag} {champion.shortName}
                                  </span>
                                )}
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${p.confirmedGroups ? "text-green-400 bg-green-900/30 border-green-700/30" : "text-green-900 bg-black/30 border-green-900/20"}`}>
                                  {predCount} jogos
                                </span>
                              </div>
                              {isOpen ? <ChevronUp className="w-4 h-4 text-green-700" /> : <ChevronDown className="w-4 h-4 text-green-700" />}
                            </div>
                          </button>

                          {isOpen && (
                            <div className="border-t border-blue-900/20 px-4 py-4 space-y-4">
                              {/* Campeão e finalistas */}
                              <div className="flex flex-wrap gap-3">
                                <div className="bg-yellow-900/10 border border-yellow-700/20 rounded-lg px-3 py-2">
                                  <p className="text-[9px] font-mono text-yellow-700 uppercase tracking-wider mb-1">Campeão</p>
                                  <p className="text-sm font-bebas text-yellow-300">{champion ? `${champion.flag} ${champion.name}` : "—"}</p>
                                </div>
                                <div className="bg-blue-900/10 border border-blue-700/20 rounded-lg px-3 py-2">
                                  <p className="text-[9px] font-mono text-blue-700 uppercase tracking-wider mb-1">Finalistas</p>
                                  <p className="text-sm font-bebas text-blue-300">
                                    {finalist0 ? `${finalist0.flag} ${finalist0.shortName}` : "?"} × {finalist1 ? `${finalist1.flag} ${finalist1.shortName}` : "?"}
                                  </p>
                                </div>
                                <div className="bg-black/40 border border-green-900/20 rounded-lg px-3 py-2">
                                  <p className="text-[9px] font-mono text-green-700 uppercase tracking-wider mb-1">Confirmações</p>
                                  <div className="flex gap-2">
                                    <span className={`text-[9px] font-bold ${p.confirmedGroups ? "text-green-400" : "text-green-900"}`}>
                                      {p.confirmedGroups ? "✓" : "✗"} Grupos
                                    </span>
                                    <span className={`text-[9px] font-bold ${p.confirmedKnockout ? "text-blue-400" : "text-blue-900"}`}>
                                      {p.confirmedKnockout ? "✓" : "✗"} Eliminatórias
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Palpites de grupos vs resultados oficiais */}
                              {GROUPS.map(group => {
                                const groupMatches = GROUP_MATCHES.filter(m => {
                                  const meta = group.teams;
                                  return meta.includes(m.homeTeamId) && meta.includes(m.awayTeamId);
                                });
                                const userGroupPred = (p.groupPredictions || {})[group.id];
                                if (!userGroupPred?.matchPredictions?.length) return null;
                                return (
                                  <div key={group.id}>
                                    <p className="text-[10px] font-mono text-green-700 uppercase tracking-widest mb-2">{group.name}</p>
                                    <div className="space-y-1">
                                      {groupMatches.map(match => {
                                        const pred = userGroupPred.matchPredictions?.find((m: any) => m.matchId === match.id);
                                        if (!pred || pred.homeScore === null) return null;
                                        const official = officialResults.find(r => r.matchId === match.id);
                                        const homeT = TEAMS[match.homeTeamId];
                                        const awayT = TEAMS[match.awayTeamId];
                                        let statusColor = "text-green-800";
                                        let statusIcon = "";
                                        if (official) {
                                          if (pred.homeScore === official.homeScore && pred.awayScore === official.awayScore) {
                                            statusColor = "text-yellow-400"; statusIcon = "⭐";
                                          } else {
                                            const predRes = pred.homeScore > pred.awayScore ? "1" : pred.homeScore < pred.awayScore ? "2" : "X";
                                            const offRes = official.homeScore > official.awayScore ? "1" : official.homeScore < official.awayScore ? "2" : "X";
                                            if (predRes === offRes) { statusColor = "text-green-400"; statusIcon = "✓"; }
                                            else { statusColor = "text-red-500/70"; statusIcon = "✗"; }
                                          }
                                        }
                                        return (
                                          <div key={match.id} className="flex items-center gap-2 text-[10px] font-mono">
                                            <span className="w-32 truncate text-green-700">{homeT?.flag} {homeT?.shortName} × {awayT?.shortName} {awayT?.flag}</span>
                                            <span className="text-green-300 font-bold">{pred.homeScore}–{pred.awayScore}</span>
                                            {official && (
                                              <>
                                                <span className="text-green-900">vs oficial</span>
                                                <span className="text-green-600">{official.homeScore}–{official.awayScore}</span>
                                                <span className={statusColor}>{statusIcon}</span>
                                              </>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                              {p.updatedAt && (
                                <p className="text-[9px] font-mono text-green-900 pt-2 border-t border-green-900/10">
                                  Última atualização: {new Date(p.updatedAt).toLocaleString("pt-BR")}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl border backdrop-blur-md shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-bottom-4 ${message.type === "success" ? "bg-green-900/80 border-green-500 text-green-100" : "bg-red-900/80 border-red-500 text-red-100"}`}>
          {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bebas tracking-widest uppercase">{message.text}</span>
        </div>
      )}

      {/* ── MODAL: EDITAR PALPITES ─────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-sm overflow-y-auto py-8 px-4">
          <div className="w-full max-w-4xl bg-[#081a08] border border-amber-700/40 rounded-2xl shadow-2xl">

            {/* Header */}
            <div className="sticky top-0 bg-[#081a08] z-10 flex items-center justify-between px-6 py-4 border-b border-amber-700/30 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-900/30 rounded-lg border border-amber-700/30">
                  <Edit2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="font-bebas text-xl text-amber-400 tracking-widest">EDITAR PALPITES</h2>
                  <p className="text-[11px] font-mono text-green-700 lowercase">{editingUser.name} — {editingUser.email}</p>
                </div>
              </div>
              <button onClick={() => setEditingUser(null)}
                className="p-2 rounded-lg hover:bg-white/10 text-green-600 hover:text-green-300 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {editLoading ? (
                <div className="flex items-center justify-center py-20 gap-3 text-green-600">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <span className="font-bebas tracking-widest uppercase">Carregando palpites...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Alerta */}
                  <div className="bg-amber-900/10 border border-amber-700/30 rounded-xl px-4 py-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="text-[11px] font-mono text-amber-300">
                      Editando palpites de <strong>{editingUser.name || editingUser.email}</strong>. Esta ação será registrada nos logs.
                    </p>
                  </div>

                  {/* Abas */}
                  <div className="flex gap-2">
                    {(["groups", "knockout"] as const).map(tab => (
                      <button key={tab} onClick={() => setEditTab(tab)}
                        className={`px-4 py-2 rounded-lg font-bebas tracking-widest text-sm transition-all ${
                          editTab === tab
                            ? "bg-amber-700/30 text-amber-300 border border-amber-700/50"
                            : "text-green-700 border border-green-900/30 hover:bg-white/5"
                        }`}>
                        {tab === "groups" ? "⚽ FASE DE GRUPOS" : "🏆 ELIMINATÓRIAS"}
                      </button>
                    ))}
                  </div>

                  {/* ── FASE DE GRUPOS ── */}
                  {editTab === "groups" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {GROUPS.map(group => {
                        const matches = GROUP_MATCHES.filter(m =>
                          group.teams.includes(m.homeTeamId) && group.teams.includes(m.awayTeamId)
                        );
                        return (
                          <div key={group.id} className="bg-black/40 rounded-xl border border-green-900/20 overflow-hidden">
                            <div className="bg-green-900/20 px-4 py-2 border-b border-green-900/20">
                              <h3 className="font-bebas text-green-400 tracking-widest">GRUPO {group.id}</h3>
                            </div>
                            <div className="p-3 space-y-2">
                              {matches.map(match => {
                                const pred = getMatchPred(group.id, match.id);
                                const home = TEAMS[match.homeTeamId];
                                const away = TEAMS[match.awayTeamId];
                                return (
                                  <div key={match.id} className="bg-black/30 rounded-lg border border-green-900/20 p-2">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[9px] font-mono text-amber-700 uppercase tracking-wider">{match.round}ª Rodada · {match.date}</span>
                                      <span className="text-[9px] font-mono text-green-900">{match.venue}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 flex items-center justify-end gap-1 min-w-0">
                                        <span className="text-[11px] font-oswald text-green-200 truncate leading-tight text-right">{home?.name}</span>
                                        <span className="text-base shrink-0">{home?.flag}</span>
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <ScoreInput value={pred.homeScore ?? null} onChange={v => updateGroupScore(group.id, match.id, "homeScore", v)} />
                                        <span className="text-green-800 text-xs font-mono">×</span>
                                        <ScoreInput value={pred.awayScore ?? null} onChange={v => updateGroupScore(group.id, match.id, "awayScore", v)} />
                                      </div>
                                      <div className="flex-1 flex items-center gap-1 min-w-0">
                                        <span className="text-base shrink-0">{away?.flag}</span>
                                        <span className="text-[11px] font-oswald text-green-200 truncate leading-tight">{away?.name}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* ── ELIMINATÓRIAS ── */}
                  {editTab === "knockout" && (() => {
                    const allTeams = Object.values(TEAMS).sort((a, b) => a.name.localeCompare(b.name));
                    const selectCls = "w-full bg-black/50 border border-green-900/30 text-green-200 text-[11px] font-oswald rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-600/50";
                    const KOSelect = ({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) => (
                      <select value={value || ""} onChange={e => onChange(e.target.value || null)} className={selectCls}>
                        <option value="">— sem palpite —</option>
                        {allTeams.map(t => (
                          <option key={t.id} value={t.id}>{t.flag} {t.name}</option>
                        ))}
                      </select>
                    );
                    const SectionTitle = ({ label }: { label: string }) => (
                      <div className="flex items-center gap-3 mt-2">
                        <div className="h-px flex-1 bg-green-900/30" />
                        <span className="font-bebas text-amber-500 tracking-widest text-sm">{label}</span>
                        <div className="h-px flex-1 bg-green-900/30" />
                      </div>
                    );
                    return (
                      <div className="space-y-4">
                        {/* Fase de 32 */}
                        <SectionTitle label="FASE DE 32" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {SECOND_ROUND_MATCHUPS.map(m => (
                            <div key={m.id} className="bg-black/40 border border-green-900/20 rounded-lg p-2.5">
                              <span className="block text-[9px] font-mono text-amber-700 uppercase tracking-wider mb-1.5">{m.label}</span>
                              <KOSelect
                                value={editPredictions.secondRoundPredictions?.[m.id] ?? null}
                                onChange={v => updateKnockoutPred("secondRoundPredictions", m.id, v)}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Oitavas */}
                        <SectionTitle label="OITAVAS DE FINAL" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {R16_MATCHUPS.map(m => (
                            <div key={m.id} className="bg-black/40 border border-green-900/20 rounded-lg p-2.5">
                              <span className="block text-[9px] font-mono text-amber-700 uppercase tracking-wider mb-1.5">{m.label}</span>
                              <KOSelect
                                value={editPredictions.r16Predictions?.[m.id] ?? null}
                                onChange={v => updateKnockoutPred("r16Predictions", m.id, v)}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Quartas */}
                        <SectionTitle label="QUARTAS DE FINAL" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {QF_MATCHUPS.map(m => (
                            <div key={m.id} className="bg-black/40 border border-green-900/20 rounded-lg p-2.5">
                              <span className="block text-[9px] font-mono text-amber-700 uppercase tracking-wider mb-1.5">{m.label}</span>
                              <KOSelect
                                value={editPredictions.qfPredictions?.[m.id] ?? null}
                                onChange={v => updateKnockoutPred("qfPredictions", m.id, v)}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Semifinal */}
                        <SectionTitle label="SEMIFINAL" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {SF_MATCHUPS.map(m => (
                            <div key={m.id} className="bg-black/40 border border-green-900/20 rounded-lg p-2.5">
                              <span className="block text-[9px] font-mono text-amber-700 uppercase tracking-wider mb-1.5">{m.label}</span>
                              <KOSelect
                                value={editPredictions.sfPredictions?.[m.id] ?? null}
                                onChange={v => updateKnockoutPred("sfPredictions", m.id, v)}
                              />
                            </div>
                          ))}
                        </div>

                        {/* Finalistas e Campeão */}
                        <SectionTitle label="FINAL" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div className="bg-black/40 border border-green-900/20 rounded-lg p-2.5">
                            <span className="block text-[9px] font-mono text-amber-700 uppercase tracking-wider mb-1.5">🏅 Finalista 1</span>
                            <KOSelect
                              value={editPredictions.finalistPrediction?.[0] ?? null}
                              onChange={v => updateFinalist(0, v)}
                            />
                          </div>
                          <div className="bg-black/40 border border-green-900/20 rounded-lg p-2.5">
                            <span className="block text-[9px] font-mono text-amber-700 uppercase tracking-wider mb-1.5">🏅 Finalista 2</span>
                            <KOSelect
                              value={editPredictions.finalistPrediction?.[1] ?? null}
                              onChange={v => updateFinalist(1, v)}
                            />
                          </div>
                          <div className="bg-amber-900/10 border border-amber-700/40 rounded-lg p-2.5">
                            <span className="block text-[9px] font-mono text-amber-500 uppercase tracking-wider mb-1.5">🏆 Campeão</span>
                            <KOSelect
                              value={editPredictions.finalPrediction ?? null}
                              onChange={v => updateChampion(v)}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-green-900/20 flex items-center justify-end gap-3">
              <button onClick={() => setEditingUser(null)}
                className="px-5 py-2.5 rounded-lg border border-green-900/40 text-green-600 font-bebas tracking-widest hover:bg-white/5 transition-all text-sm">
                CANCELAR
              </button>
              <button onClick={handleSaveEdit} disabled={editSaving || editLoading}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bebas tracking-widest rounded-lg flex items-center gap-2 transition-all disabled:opacity-50 text-sm shadow-lg">
                {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                SALVAR PALPITES
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
