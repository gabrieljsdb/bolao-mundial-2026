import { Router } from "express";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import { db, users, userPredictions, officialResults, systemConfig, activityLogs } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

// ── Team names ──────────────────────────────────────────────────────────────
const TEAM_NAMES: Record<string, string> = {
  MEX:"México",BRA:"Brasil",ARG:"Argentina",FRA:"França",ENG:"Inglaterra",GER:"Alemanha",
  ESP:"Espanha",POR:"Portugal",NED:"Holanda",BEL:"Bélgica",URY:"Uruguai",
  USA:"EUA",CAN:"Canadá",AUS:"Austrália",JPN:"Japão",KOR:"Coreia do Sul",MAR:"Marrocos",
  SEN:"Senegal",NOR:"Noruega",CRO:"Croácia",SUI:"Suíça",COL:"Colômbia",EGY:"Egito",
  QAT:"Catar",TUR:"Turquia",PAR:"Paraguai",AUT:"Áustria",SCO:"Escócia",HAI:"Haiti",
  CZE:"Rep. Tcheca",RSA:"África do Sul",BIH:"Bósnia",CPV:"Cabo Verde",KSA:"Arábia Saudita",
  CIV:"Costa do Marfim",ECU:"Equador",CUW:"Curaçao",TUN:"Tunísia",SWE:"Suécia",
  NZL:"Nova Zelândia",IRN:"Irã",IRQ:"Iraque",JOR:"Jordânia",ALG:"Argélia",
  COD:"RD Congo",UZB:"Uzbequistão",GHA:"Gana",PAN:"Panamá",
};
export function teamName(id: string | null | undefined) { return id ? (TEAM_NAMES[id] ?? id) : "—"; }

const GROUP_MATCHES_DATA: Record<string, { home: string, away: string }> = {
  g_1:{home:'MEX',away:'RSA'},g_2:{home:'KOR',away:'CZE'},g_3:{home:'CAN',away:'BIH'},g_4:{home:'USA',away:'PAR'},g_5:{home:'QAT',away:'SUI'},g_6:{home:'BRA',away:'MAR'},g_7:{home:'HAI',away:'SCO'},g_8:{home:'AUS',away:'TUR'},g_9:{home:'GER',away:'CUW'},g_10:{home:'CIV',away:'ECU'},g_11:{home:'NED',away:'JPN'},g_12:{home:'SWE',away:'TUN'},g_13:{home:'BEL',away:'EGY'},g_14:{home:'IRN',away:'NZL'},g_15:{home:'ESP',away:'CPV'},g_16:{home:'KSA',away:'URY'},g_17:{home:'FRA',away:'SEN'},g_18:{home:'IRQ',away:'NOR'},g_19:{home:'ARG',away:'ALG'},g_20:{home:'AUT',away:'JOR'},g_21:{home:'POR',away:'COD'},g_22:{home:'UZB',away:'COL'},g_23:{home:'ENG',away:'CRO'},g_24:{home:'GHA',away:'PAN'},
  g_25:{home:'MEX',away:'KOR'},g_26:{home:'CZE',away:'RSA'},g_27:{home:'CAN',away:'QAT'},g_28:{home:'SUI',away:'BIH'},g_29:{home:'BRA',away:'HAI'},g_30:{home:'SCO',away:'MAR'},g_31:{home:'USA',away:'AUS'},g_32:{home:'TUR',away:'PAR'},g_33:{home:'GER',away:'CIV'},g_34:{home:'ECU',away:'CUW'},g_35:{home:'NED',away:'SWE'},g_36:{home:'TUN',away:'JPN'},g_37:{home:'BEL',away:'IRN'},g_38:{home:'NZL',away:'EGY'},g_39:{home:'ESP',away:'KSA'},g_40:{home:'URY',away:'CPV'},g_41:{home:'FRA',away:'IRQ'},g_42:{home:'NOR',away:'SEN'},g_43:{home:'ARG',away:'AUT'},g_44:{home:'JOR',away:'ALG'},g_45:{home:'POR',away:'UZB'},g_46:{home:'COL',away:'COD'},g_47:{home:'ENG',away:'GHA'},g_48:{home:'PAN',away:'CRO'},
  g_49:{home:'CZE',away:'MEX'},g_50:{home:'RSA',away:'KOR'},g_51:{home:'SUI',away:'CAN'},g_52:{home:'BIH',away:'QAT'},g_53:{home:'SCO',away:'BRA'},g_54:{home:'MAR',away:'HAI'},g_55:{home:'TUR',away:'USA'},g_56:{home:'PAR',away:'AUS'},g_57:{home:'ECU',away:'GER'},g_58:{home:'CUW',away:'CIV'},g_59:{home:'TUN',away:'NED'},g_60:{home:'JPN',away:'SWE'},g_61:{home:'NZL',away:'BEL'},g_62:{home:'EGY',away:'IRN'},g_63:{home:'URY',away:'ESP'},g_64:{home:'CPV',away:'KSA'},g_65:{home:'FRA',away:'NOR'},g_66:{home:'SEN',away:'IRQ'},g_67:{home:'JOR',away:'ARG'},g_68:{home:'ALG',away:'AUT'},g_69:{home:'COL',away:'POR'},g_70:{home:'COD',away:'UZB'},g_71:{home:'PAN',away:'ENG'},g_72:{home:'CRO',away:'GHA'}
};

function getMatchDisplay(matchId: string) {
  const m = GROUP_MATCHES_DATA[matchId];
  if (!m) return matchId;
  return `${teamName(m.home)} × ${teamName(m.away)}`;
}

// ── SMTP helper ──────────────────────────────────────────────────────────────
export async function getTransporter() {
  const cfg = await db.query.systemConfig.findFirst();
  const smtp = cfg?.smtpConfig;

  const host  = smtp?.host  || process.env.SMTP_HOST  || "";
  const port  = smtp?.port  || parseInt(process.env.SMTP_PORT || "587");
  const user  = smtp?.user  || process.env.SMTP_USER  || "";
  const pass  = smtp?.pass  || process.env.SMTP_PASS  || "";
  const from  = smtp?.from  || smtp?.user || process.env.SMTP_FROM  || user;

  if (!host || !user || !pass) return null;

  return { transporter: nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } }), from };
}

// ── PDF builder ──────────────────────────────────────────────────────────────
export function buildPdf(user: any, preds: any, results: any[], score: number, generatedAt: Date): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 45, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const GREEN  = "#14531a";
    const GREEN2 = "#1e6b23";
    const GOLD   = "#c8960c";
    const LIGHT  = "#f0f8f0";
    const GRAY   = "#666666";
    const LGRAY  = "#eeeeee";

    const dateStr = generatedAt.toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const docId = `BLO2026-${user.id.toString().padStart(4, "0")}-${generatedAt.getTime().toString(36).toUpperCase()}`;

    // ── HEADER ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, 90).fill(GREEN);

    // Left: title
    doc.fillColor("white").font("Helvetica-Bold").fontSize(20)
      .text("⚽  BOLÃO COPA DO MUNDO 2026", 45, 18);
    doc.font("Helvetica").fontSize(10).fillColor("#a8d5a2")
      .text("COMPROVANTE OFICIAL DE PREVISÕES", 45, 44);
    doc.fontSize(8).fillColor("#6aaa64")
      .text(`Documento: ${docId}`, 45, 60)
      .text(`Emitido em: ${dateStr}`, 45, 72);

    // Right: score badge
    doc.rect(W - 130, 15, 85, 60).fill(GOLD);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(9).text("PONTUAÇÃO", W - 115, 22, { width: 55, align: "center" });
    doc.fontSize(22).text(`${score}`, W - 115, 33, { width: 55, align: "center" });
    doc.fontSize(9).text("PTS", W - 115, 58, { width: 55, align: "center" });

    let y = 105;

    // ── PARTICIPANT BOX ──────────────────────────────────────────────────────
    doc.rect(45, y, W - 90, 52).fill(LIGHT).stroke("#c8d8c8");
    doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(9).text("DADOS DO PARTICIPANTE", 55, y + 7);
    doc.fillColor("#222").font("Helvetica").fontSize(10)
      .text(`Nome:`, 55, y + 22).font("Helvetica-Bold").text(user.name || "—", 90, y + 22)
      .font("Helvetica").text(`Email:`, 55, y + 36).font("Helvetica-Bold").text(user.email, 90, y + 36);
    doc.font("Helvetica").text(`Setor:`, W / 2, y + 22).font("Helvetica-Bold").text(user.department || "—", W / 2 + 36, y + 22);

    // Confirmation status
    const confirmedGroups   = !!preds?.confirmedGroups;
    const confirmedKnockout = !!preds?.confirmedKnockout;
    doc.font("Helvetica").fontSize(8)
      .fillColor(confirmedGroups   ? GREEN2 : "#c0392b")
      .text(confirmedGroups   ? "✓ Fase de Grupos confirmada" : "✗ Grupos não confirmados",   W / 2, y + 36)
      .fillColor(confirmedKnockout ? GREEN2 : "#c0392b")
      .text(confirmedKnockout ? "✓ Eliminatórias confirmadas"  : "✗ Eliminatórias não confirmadas", W / 2 + 150, y + 36);
    y += 68;

    // ── GRUPO MATCHES ────────────────────────────────────────────────────────
    const gp = preds?.groupPredictions;
    if (gp && typeof gp === "object" && Object.keys(gp).length > 0) {
      doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(12).text("FASE DE GRUPOS", 45, y);
      y += 16;

      // Table header
      const COL = { match: 45, pred: 190, official: 300, result: 420 };
      doc.rect(45, y, W - 90, 16).fill(GREEN).stroke();
      doc.fillColor("white").font("Helvetica-Bold").fontSize(8)
        .text("PARTIDA",     COL.match   + 2, y + 4)
        .text("SUA PREVISÃO",COL.pred    - 2, y + 4)
        .text("RESULTADO OFICIAL", COL.official - 2, y + 4)
        .text("ACERTO",      COL.result  + 2, y + 4);
      y += 18;

      let rowBg = false;
      Object.entries(gp).forEach(([groupId, groupData]: [string, any]) => {
        if (y > 730) { doc.addPage(); y = 45; }

        // Group label row
        doc.rect(45, y, W - 90, 14).fill("#ddeedd");
        doc.fillColor(GREEN2).font("Helvetica-Bold").fontSize(8)
          .text(`GRUPO ${groupId}`, 50, y + 3);
        y += 15;

        const matches = (groupData?.matchPredictions ?? []) as any[];
        matches.forEach((m: any) => {
          if (y > 740) { doc.addPage(); y = 45; }
          if (rowBg) doc.rect(45, y, W - 90, 13).fill("#f8fcf8");
          rowBg = !rowBg;

          const official = results.find(r => r.matchId === m.matchId);
          let hitLabel = "—";
          let hitColor = GRAY;
          if (official && m.homeScore !== null && m.awayScore !== null) {
            const pHome = Number(m.homeScore); const pAway = Number(m.awayScore);
            const oHome = Number(official.homeScore); const oAway = Number(official.awayScore);
            const exactMatch  = pHome === oHome && pAway === oAway;
            const winnerMatch = (pHome > pAway) === (oHome > oAway) && (pHome === pAway) === (oHome === oAway);
            if (exactMatch)        { hitLabel = "✓ PLACAR EXATO";  hitColor = "#0a6e1a"; }
            else if (winnerMatch)  { hitLabel = "✓ VENCEDOR";      hitColor = GREEN2;   }
            else                   { hitLabel = "✗ ERROU";         hitColor = "#c0392b"; }
          }

          doc.fillColor("#222").font("Helvetica").fontSize(8)
            .text(getMatchDisplay(m.matchId), COL.match + 2, y + 3);
          doc.text(
            m.homeScore !== null ? `${m.homeScore} × ${m.awayScore}` : "—",
            COL.pred - 2, y + 3
          );
          doc.fillColor(official ? "#222" : GRAY)
            .text(official ? `${official.homeScore} × ${official.awayScore}` : "aguardando", COL.official - 2, y + 3);
          doc.fillColor(hitColor).font("Helvetica-Bold")
            .text(hitLabel, COL.result + 2, y + 3);
          y += 14;
        });
        y += 3;
      });
    }

    // ── KNOCKOUT SECTIONS ─────────────────────────────────────────────────────
    const koSections = [
      { label: "MELHORES TERCEIROS",  data: null, special: "bestThirds" },
      { label: "SEGUNDA RODADA",      data: preds?.secondRoundPredictions },
      { label: "OITAVAS DE FINAL",    data: preds?.r16Predictions },
      { label: "QUARTAS DE FINAL",    data: preds?.qfPredictions },
      { label: "SEMIFINAIS",          data: preds?.sfPredictions },
    ];

    koSections.forEach(({ label, data }) => {
      if (!data || typeof data !== "object" || !Object.keys(data).length) return;
      if (y > 700) { doc.addPage(); y = 45; }

      doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(11).text(label, 45, y);
      y += 14;

      doc.rect(45, y, W - 90, 14).fill(GREEN).stroke();
      doc.fillColor("white").font("Helvetica-Bold").fontSize(8)
        .text("CONFRONTO / CHAVE", 50, y + 3)
        .text("TIME ESCOLHIDO", 330, y + 3);
      y += 15;

      let rowBg = false;
      Object.entries(data).forEach(([matchId, winner]: [string, any]) => {
        if (y > 740) { doc.addPage(); y = 45; }
        if (rowBg) doc.rect(45, y, W - 90, 13).fill("#f8fcf8");
        rowBg = !rowBg;
        doc.fillColor("#222").font("Helvetica").fontSize(8)
          .text(matchId, 50, y + 3)
          .font("Helvetica-Bold").fillColor(GREEN2).text(teamName(winner), 330, y + 3);
        y += 14;
      });
      y += 6;
    });

    // ── FINALISTS ─────────────────────────────────────────────────────────────
    if (preds?.finalistPrediction) {
      if (y > 700) { doc.addPage(); y = 45; }
      const [f1, f2] = Array.isArray(preds.finalistPrediction) ? preds.finalistPrediction : [null, null];
      doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(11).text("FINALISTAS", 45, y); y += 14;
      doc.rect(45, y, W - 90, 28).fill(LIGHT).stroke("#c8d8c8");
      doc.fillColor("#222").font("Helvetica-Bold").fontSize(11)
        .text(`${teamName(f1)}  ×  ${teamName(f2)}`, 0, y + 8, { align: "center", width: W });
      y += 38;
    }

    // ── CHAMPION ─────────────────────────────────────────────────────────────
    if (preds?.finalPrediction) {
      if (y > 700) { doc.addPage(); y = 45; }
      doc.rect(45, y, W - 90, 40).fill(GOLD);
      doc.fillColor("white").font("Helvetica-Bold").fontSize(14)
        .text(`🏆  CAMPEÃO ESCOLHIDO: ${teamName(preds.finalPrediction)}`, 0, y + 12, { align: "center", width: W });
      y += 50;
    }

    // ── AUDIT FOOTER ──────────────────────────────────────────────────────────
    const footerY = Math.max(y + 20, doc.page.height - 100);
    if (footerY + 80 > doc.page.height) { doc.addPage(); }
    const fy = footerY > doc.page.height - 100 ? 45 : footerY;

    doc.rect(45, fy, W - 90, 1).fill("#cccccc");
    doc.rect(45, fy + 8, W - 90, 64).fill(LGRAY).stroke("#dddddd");

    doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(9)
      .text("DECLARAÇÃO DE AUTENTICIDADE", 55, fy + 14);
    doc.fillColor(GRAY).font("Helvetica").fontSize(7.5)
      .text(
        "Este documento comprova as previsões registradas no sistema Bolão Copa do Mundo 2026 pelo participante identificado acima. " +
        "As previsões foram aceitas e registradas no banco de dados do sistema e este PDF serve como comprovante e meio de auditoria. " +
        "Qualquer alteração neste documento invalida seu valor como comprovante.",
        55, fy + 27, { width: W - 120, lineGap: 2 }
      );

    doc.fillColor(GREEN2).font("Helvetica-Bold").fontSize(7.5)
      .text(`ID do Documento: ${docId}`, 55, fy + 55)
      .text(`Data/Hora de Emissão: ${dateStr}`, 280, fy + 55);

    doc.end();
  });
}

// ── PDF consolidado — todos os palpites ─────────────────────────────────────
export function buildAllPredictionsPdf(
  participants: { user: any; preds: any }[],
  results: any[],
  generatedAt: Date
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", c => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W       = doc.page.width;
    const GREEN   = "#14531a";
    const GREEN2  = "#1e6b23";
    const GOLD    = "#c8960c";
    const LGRAY   = "#eeeeee";
    const GRAY    = "#666666";

    const dateStr = generatedAt.toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

    // ── CAPA ──────────────────────────────────────────────────────────────────
    doc.rect(0, 0, W, doc.page.height).fill("#0b3d11");
    doc.rect(0, 0, W, 200).fill(GREEN);

    doc.fillColor("white").font("Helvetica-Bold").fontSize(26)
      .text("⚽  BOLÃO COPA DO MUNDO 2026", 40, 60, { align: "center", width: W - 80 });
    doc.font("Helvetica").fontSize(14).fillColor("#a8d5a2")
      .text("RELATÓRIO DE PALPITES — TODOS OS PARTICIPANTES", 40, 100, { align: "center", width: W - 80 });
    doc.fontSize(10).fillColor("#6aaa64")
      .text(`Gerado em: ${dateStr}`, 40, 130, { align: "center", width: W - 80 })
      .text(`Total de participantes: ${participants.length}`, 40, 146, { align: "center", width: W - 80 });

    // índice resumido — campeões
    let idxY = 230;
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(12)
      .text("RESUMO — CAMPEÃO ESCOLHIDO POR PARTICIPANTE", 40, idxY);
    idxY += 18;

    const COL_N = 40;
    const COL_DEPT = 230;
    const COL_CHAMP = 370;
    doc.rect(40, idxY, W - 80, 16).fill(GREEN);
    doc.fillColor("white").font("Helvetica-Bold").fontSize(8)
      .text("PARTICIPANTE", COL_N + 2, idxY + 4)
      .text("SETOR", COL_DEPT + 2, idxY + 4)
      .text("CAMPEÃO ESCOLHIDO", COL_CHAMP + 2, idxY + 4);
    idxY += 17;

    let rowBg = false;
    participants.forEach(({ user, preds }) => {
      if (idxY > 740) { doc.addPage(); doc.rect(0,0,W,doc.page.height).fill("#0b3d11"); idxY = 40; }
      if (rowBg) doc.rect(40, idxY, W - 80, 13).fill("#1a5c22");
      rowBg = !rowBg;
      doc.fillColor("#d0efd0").font("Helvetica").fontSize(8)
        .text(user.name || user.email, COL_N + 2, idxY + 3, { width: 185, ellipsis: true })
        .fillColor("#a8d5a2").text(user.department || "—", COL_DEPT + 2, idxY + 3, { width: 135, ellipsis: true })
        .fillColor(GOLD).font("Helvetica-Bold")
        .text(preds?.finalPrediction ? teamName(preds.finalPrediction) : "—", COL_CHAMP + 2, idxY + 3, { width: W - COL_CHAMP - 50 });
      idxY += 14;
    });

    // ── DETALHES POR PARTICIPANTE ─────────────────────────────────────────────
    participants.forEach(({ user, preds }, i) => {
      doc.addPage();
      doc.rect(0, 0, W, doc.page.height).fill("#0a1f0d");

      // cabeçalho da página do participante
      doc.rect(0, 0, W, 54).fill(GREEN);
      doc.fillColor("white").font("Helvetica-Bold").fontSize(11)
        .text(`${i + 1}. ${user.name || user.email}`, 40, 10, { width: W - 180 });
      doc.font("Helvetica").fontSize(9).fillColor("#a8d5a2")
        .text(`Setor: ${user.department || "—"}  |  Email: ${user.email}`, 40, 27);
      doc.fontSize(8).fillColor("#6aaa64")
        .text(`Bolão Copa 2026 — ${dateStr}`, 40, 41);

      // badges de campeão e finalistas
      const champion = preds?.finalPrediction ? teamName(preds.finalPrediction) : "—";
      const f1 = Array.isArray(preds?.finalistPrediction) ? preds.finalistPrediction[0] : null;
      const f2 = Array.isArray(preds?.finalistPrediction) ? preds.finalistPrediction[1] : null;

      doc.rect(W - 160, 6, 120, 42).fill(GOLD);
      doc.fillColor("white").font("Helvetica-Bold").fontSize(8)
        .text("🏆 CAMPEÃO", W - 155, 11, { width: 110, align: "center" });
      doc.fontSize(11).text(champion, W - 155, 23, { width: 110, align: "center" });
      if (f1 || f2) {
        doc.fontSize(7).fillColor("#ffe090")
          .text(`Final: ${teamName(f1)} × ${teamName(f2)}`, W - 155, 38, { width: 110, align: "center" });
      }

      let y = 68;

      // confirmação
      const cG = !!preds?.confirmedGroups;
      const cK = !!preds?.confirmedKnockout;
      doc.rect(40, y, W - 80, 18).fill("#0f2e14").stroke("#1e6b23");
      doc.font("Helvetica").fontSize(8)
        .fillColor(cG ? "#4ade80" : "#f87171")
        .text(cG ? "✓ Grupos confirmado" : "✗ Grupos não confirmado", 48, y + 5)
        .fillColor(cK ? "#4ade80" : "#f87171")
        .text(cK ? "✓ Eliminatórias confirmadas" : "✗ Eliminatórias não confirmadas", 220, y + 5);
      y += 26;

      // tabela de palpites de grupo
      const gp = preds?.groupPredictions;
      if (gp && Object.keys(gp).length > 0) {
        doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(10).text("FASE DE GRUPOS", 40, y);
        y += 13;

        const C = { match: 40, pred: 200, off: 295, hit: 400 };
        doc.rect(40, y, W - 80, 14).fill(GREEN);
        doc.fillColor("white").font("Helvetica-Bold").fontSize(7.5)
          .text("PARTIDA", C.match + 2, y + 3)
          .text("PALPITE", C.pred + 2, y + 3)
          .text("OFICIAL", C.off + 2, y + 3)
          .text("ACERTO", C.hit + 2, y + 3);
        y += 15;

        let rb = false;
        Object.entries(gp).forEach(([groupId, groupData]: [string, any]) => {
          if (y > 740) { doc.addPage(); doc.rect(0,0,W,doc.page.height).fill("#0a1f0d"); y = 40; }
          doc.rect(40, y, W - 80, 12).fill("#1a5c22");
          doc.fillColor("#a8d5a2").font("Helvetica-Bold").fontSize(7.5)
            .text(`GRUPO ${groupId.toUpperCase()}`, 44, y + 2);
          y += 13;

          const matches = (groupData?.matchPredictions ?? []) as any[];
          matches.forEach((m: any) => {
            if (y > 745) { doc.addPage(); doc.rect(0,0,W,doc.page.height).fill("#0a1f0d"); y = 40; }
            if (rb) doc.rect(40, y, W - 80, 12).fill("#0f2e14");
            rb = !rb;

            const official = results.find(r => r.matchId === m.matchId);
            let hitLabel = "—", hitColor = GRAY;
            if (official && m.homeScore !== null && m.awayScore !== null) {
              const pH = Number(m.homeScore), pA = Number(m.awayScore);
              const oH = Number(official.homeScore), oA = Number(official.awayScore);
              if (pH === oH && pA === oA)  { hitLabel = "PLACAR EXATO"; hitColor = GOLD; }
              else if ((pH > pA) === (oH > oA) && (pH === pA) === (oH === oA)) { hitLabel = "VENCEDOR"; hitColor = "#4ade80"; }
              else { hitLabel = "ERROU"; hitColor = "#f87171"; }
            }

            doc.fillColor("#c8e6c8").font("Helvetica").fontSize(7.5)
              .text(getMatchDisplay(m.matchId), C.match + 2, y + 2, { width: 155 });
            doc.text(
              m.homeScore !== null ? `${m.homeScore} × ${m.awayScore}` : "—",
              C.pred + 2, y + 2
            );
            doc.fillColor(official ? "#c8e6c8" : "#4a6b4a")
              .text(official ? `${official.homeScore} × ${official.awayScore}` : "aguard.", C.off + 2, y + 2);
            doc.fillColor(hitColor).font("Helvetica-Bold")
              .text(hitLabel, C.hit + 2, y + 2);
            y += 13;
          });
          y += 2;
        });
      }

      // ── ELIMINATÓRIAS ────────────────────────────────────────────────────────
      const koSections = [
        { label: "SEGUNDA RODADA",   data: preds?.secondRoundPredictions },
        { label: "OITAVAS DE FINAL", data: preds?.r16Predictions },
        { label: "QUARTAS DE FINAL", data: preds?.qfPredictions },
        { label: "SEMIFINAIS",       data: preds?.sfPredictions },
      ];

      const hasKo = koSections.some(s => s.data && typeof s.data === "object" && Object.keys(s.data).length > 0);
      if (hasKo) {
        y += 6;
        doc.rect(40, y, W - 80, 1).fill("#1e6b23");
        y += 8;
        doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(10).text("ELIMINATÓRIAS", 40, y);
        y += 13;

        koSections.forEach(({ label, data }) => {
          if (!data || typeof data !== "object" || !Object.keys(data).length) return;
          if (y > 720) { doc.addPage(); doc.rect(0, 0, W, doc.page.height).fill("#0a1f0d"); y = 40; }

          doc.rect(40, y, W - 80, 14).fill(GREEN);
          doc.fillColor("white").font("Helvetica-Bold").fontSize(7.5)
            .text(label, 44, y + 3)
            .text("TIME ESCOLHIDO", 340, y + 3);
          y += 15;

          let rb = false;
          Object.entries(data).forEach(([matchKey, winner]: [string, any]) => {
            if (y > 745) { doc.addPage(); doc.rect(0, 0, W, doc.page.height).fill("#0a1f0d"); y = 40; }
            if (rb) doc.rect(40, y, W - 80, 12).fill("#0f2e14");
            rb = !rb;
            doc.fillColor("#c8e6c8").font("Helvetica").fontSize(7.5)
              .text(matchKey, 44, y + 2, { width: 290 })
              .font("Helvetica-Bold").fillColor(GOLD)
              .text(teamName(winner), 340, y + 2);
            y += 13;
          });
          y += 4;
        });

        // Finalistas
        if (f1 || f2) {
          if (y > 720) { doc.addPage(); doc.rect(0, 0, W, doc.page.height).fill("#0a1f0d"); y = 40; }
          doc.rect(40, y, W - 80, 14).fill(GREEN);
          doc.fillColor("white").font("Helvetica-Bold").fontSize(7.5)
            .text("FINALISTAS", 44, y + 3);
          y += 15;
          doc.rect(40, y, W - 80, 13).fill("#0f2e14");
          doc.fillColor("#c8e6c8").font("Helvetica").fontSize(7.5)
            .text("Final", 44, y + 2)
            .font("Helvetica-Bold").fillColor(GOLD)
            .text(`${teamName(f1)}  ×  ${teamName(f2)}`, 340, y + 2);
          y += 17;
        }
      }

      // campeão resumo no rodapé
      if (y < doc.page.height - 40) {
        doc.rect(40, y + 4, W - 80, 1).fill("#1e6b23");
        y += 10;
        doc.rect(40, y, W - 80, 22).fill(GOLD);
        doc.fillColor("white").font("Helvetica-Bold").fontSize(10)
          .text(`🏆  CAMPEÃO: ${champion}`, 40, y + 6, { width: W - 80, align: "center" });
        y += 26;
      }
    });

    // ── RODAPÉ DE AUTENTICIDADE ────────────────────────────────────────────────
    doc.addPage();
    doc.rect(0, 0, W, doc.page.height).fill("#0b3d11");
    doc.rect(40, 60, W - 80, 80).fill(LGRAY).stroke("#cccccc");
    doc.fillColor(GREEN).font("Helvetica-Bold").fontSize(11)
      .text("DECLARAÇÃO DE AUTENTICIDADE", 50, 72);
    doc.fillColor(GRAY).font("Helvetica").fontSize(8)
      .text(
        `Este documento contém os palpites registrados no sistema Bolão Copa do Mundo 2026 ` +
        `por todos os ${participants.length} participantes listados. ` +
        `Gerado em ${dateStr} pelo administrador do sistema.`,
        50, 90, { width: W - 100, lineGap: 3 }
      );
    doc.fillColor(GREEN2).font("Helvetica-Bold").fontSize(8)
      .text(`Emissão: ${dateStr}  |  Total de participantes: ${participants.length}`, 50, 126);

    doc.end();
  });
}

// ── Routes ───────────────────────────────────────────────────────────────────

router.get("/admin/reports/all-predictions-pdf", requireAdmin, async (req: any, res) => {
  try {
    const allUsers  = await db.query.users.findMany({ orderBy: (t, { asc }) => [asc(t.name)] });
    const allPreds  = await db.query.userPredictions.findMany();
    const results   = await db.query.officialResults.findMany();

    const participants = allUsers.map(user => ({
      user,
      preds: allPreds.find(p => p.userId === user.id) ?? null,
    }));

    const generatedAt = new Date();
    const pdf = await buildAllPredictionsPdf(participants, results, generatedAt);

    const filename = `palpites-bolao2026-${generatedAt.toISOString().slice(0, 10)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdf.length);
    res.send(pdf);

    try {
      await db.insert(activityLogs).values({
        userId: req.user.id,
        userEmail: req.user.email,
        userName: req.user.name || req.user.email,
        action: "export_all_predictions_pdf",
        details: { total: participants.length, filename },
      });
    } catch (logErr) {
      req.log.warn({ err: logErr }, "activity log failed (non-fatal)");
    }
  } catch (err: any) {
    req.log.error({ err }, "All-predictions PDF error");
    return res.status(500).json({ error: "Erro ao gerar PDF", details: err.message });
  }
});

router.get("/admin/activity-logs", requireAdmin, async (req: any, res) => {
  try {
    const logs = await db.query.activityLogs.findMany({
      orderBy: (t, { desc }) => [desc(t.createdAt)],
      limit: 500,
    });
    return res.json(logs);
  } catch (err) {
    req.log.error({ err }, "Activity logs error");
    return res.json([]);
  }
});

router.get("/admin/smtp-config", requireAdmin, async (req: any, res) => {
  try {
    const cfg = await db.query.systemConfig.findFirst();
    const smtp = cfg?.smtpConfig ?? {};
    // Never return the real password — mask it
    return res.json({
      host: (smtp as any).host || "",
      port: (smtp as any).port || 587,
      user: (smtp as any).user || "",
      pass: (smtp as any).pass ? "••••••••" : "",
      from: (smtp as any).from || "",
      configured: !!((smtp as any).host && (smtp as any).user && (smtp as any).pass),
    });
  } catch (err) {
    return res.json({ host: "", port: 587, user: "", pass: "", from: "", configured: false });
  }
});

router.post("/admin/smtp-config", requireAdmin, async (req: any, res) => {
  try {
    const { host, port, user, pass, from } = req.body;
    if (!host || !user) return res.status(400).json({ error: "host e user são obrigatórios" });

    const cfg = await db.query.systemConfig.findFirst();
    const existingPass = (cfg?.smtpConfig as any)?.pass || "";
    const newPass = (pass && pass !== "••••••••") ? pass : existingPass;

    const smtpData = { host, port: Number(port) || 587, user, pass: newPass, from: from || user };

    if (cfg) {
      await db.update(systemConfig).set({ smtpConfig: smtpData, updatedAt: new Date() }).where(eq(systemConfig.id, cfg.id));
    } else {
      await db.insert(systemConfig).values({ smtpConfig: smtpData });
    }

    await db.insert(activityLogs).values({
      userId: req.user.userId,
      userEmail: req.user.email,
      userName: "Admin",
      action: "update_smtp",
      details: { host, port, user, from },
    });

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: "Erro ao salvar SMTP", details: err.message });
  }
});

router.post("/admin/test-email", requireAdmin, async (req: any, res) => {
  try {
    const { to } = req.body;
    const smtp = await getTransporter();
    if (!smtp) return res.status(400).json({ error: "SMTP não configurado" });

    const { transporter, from } = smtp;
    await transporter.sendMail({
      from: `"Bolão Copa 2026" <${from}>`,
      to,
      subject: "Email de Teste — Bolão 2026",
      html: `
        <div style="font-family:sans-serif;padding:20px;background:#f0f8f0;border-radius:10px">
          <h1 style="color:#14531a">Teste de Conexão SMTP</h1>
          <p>Este é um email de teste para validar as configurações do sistema.</p>
          <div style="font-size:12px;color:#666;margin-top:20px">Enviado em: ${new Date().toLocaleString()}</div>
        </div>
      `,
    });
    await db.insert(activityLogs).values({
      userId: req.user.userId,
      userEmail: req.user.email,
      userName: "Admin",
      action: "test_email",
      details: { to },
    });
    return res.json({ success: true, message: `Email de teste enviado para ${to}` });
  } catch (err: any) {
    return res.status(500).json({ error: "Falha ao enviar email de teste", details: err.message });
  }
});

router.post("/admin/send-reports", requireAdmin, async (req: any, res) => {
  try {
    const smtp = await getTransporter();
    if (!smtp) {
      return res.status(400).json({ error: "SMTP não configurado. Configure e teste o email antes de enviar." });
    }
    const { transporter, from } = smtp;

    const allUsers  = await db.query.users.findMany();
    const allPreds  = await db.query.userPredictions.findMany();
    const results   = await db.query.officialResults.findMany();
    const cfg       = await db.query.systemConfig.findFirst();

    const generatedAt = new Date();
    let sent = 0, failed = 0;
    const errors: string[] = [];

    for (const user of allUsers) {
      const preds = allPreds.find(p => p.userId === user.id);
      const score = 0;
      let pdf: Buffer;
      try {
        pdf = await buildPdf(user, preds, results, score, generatedAt);
      } catch (pdfErr: any) {
        failed++;
        errors.push(`PDF para ${user.email}: ${pdfErr.message}`);
        continue;
      }

      try {
        const confirmedStatus = preds?.confirmedGroups
          ? preds?.confirmedKnockout ? "Grupos + Eliminatórias confirmados" : "Apenas Grupos confirmados"
          : "Previsões não confirmadas";

        await transporter.sendMail({
          from: `"Bolão Copa 2026" <${from}>`,
          to: user.email,
          subject: "🏆 Bolão Copa do Mundo 2026 — Comprovante de Previsões",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
              <div style="background:#14531a;padding:24px;border-radius:8px 8px 0 0">
                <h1 style="color:white;margin:0;font-size:20px">⚽ Bolão Copa do Mundo 2026</h1>
                <p style="color:#a8d5a2;margin:6px 0 0;font-size:13px">Comprovante Oficial de Previsões</p>
              </div>
              <div style="background:#f9f9f9;padding:24px;border:1px solid #ddd;border-top:none">
                <p>Olá, <strong>${user.name || user.email}</strong>!</p>
                <p>Segue em anexo o <strong>comprovante oficial</strong> com todas as suas previsões registradas para a Copa do Mundo 2026.</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0">
                  <tr>
                    <td style="padding:10px 14px;background:#c8960c;color:white;font-weight:bold;border-radius:6px 0 0 6px;width:50%;text-align:center">
                      <div style="font-size:22px">${score} pts</div>
                      <div style="font-size:11px">Pontuação Atual</div>
                    </td>
                    <td style="padding:10px 14px;background:#1e6b23;color:white;border-radius:0 6px 6px 0;width:50%;text-align:center">
                      <div style="font-size:13px">${confirmedStatus}</div>
                      <div style="font-size:11px;margin-top:4px;color:#a8d5a2">Status das previsões</div>
                    </td>
                  </tr>
                </table>
                <p style="color:#555;font-size:13px">
                  O PDF em anexo contém o registro completo das suas previsões e pode ser usado como <strong>comprovante de auditoria</strong> do sistema.
                </p>
                <hr style="border:none;border-top:1px solid #ddd;margin:20px 0">
                <p style="color:#999;font-size:11px">
                  Este é um email automático gerado em ${generatedAt.toLocaleString("pt-BR")}. Não responda a este email.
                </p>
              </div>
            </div>
          `,
          attachments: [{
            filename: `comprovante-bolao2026-${(user.name || String(user.id)).replace(/\s+/g, "_")}.pdf`,
            content: pdf,
            contentType: "application/pdf",
          }],
        });
        sent++;
      } catch (mailErr: any) {
        failed++;
        errors.push(`${user.email}: ${mailErr.message}`);
      }
    }

    await db.insert(activityLogs).values({
      userId: req.user.userId,
      userEmail: req.user.email,
      userName: "Admin",
      action: "send_reports",
      details: { sent, failed, total: allUsers.length, errors: errors.slice(0, 10) },
    });

    return res.json({ success: true, sent, failed, total: allUsers.length, errors: errors.slice(0, 10) });
  } catch (err: any) {
    req.log.error({ err }, "Send reports error");
    return res.status(500).json({ error: "Erro ao enviar relatórios", details: err.message });
  }
});

export default router;
