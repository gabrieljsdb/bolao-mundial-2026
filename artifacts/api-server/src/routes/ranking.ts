import { Router } from "express";
import { db } from "@workspace/db";
import { users, userPredictions, officialResults, systemConfig } from "@workspace/db";
import { computeScore, computeExactCount } from "../lib/scoring";

const router = Router();

router.get("/ranking", async (req, res) => {
  try {
    const [allUsers, allPredictions, allResults, cfg] = await Promise.all([
      db.query.users.findMany(),
      db.query.userPredictions.findMany(),
      db.query.officialResults.findMany(),
      db.query.systemConfig.findFirst(),
    ]);
    const knockoutResults = (cfg?.officialKnockoutResults as any) ?? null;
    const predMap: Record<number, any> = {};
    for (const p of allPredictions) predMap[p.userId] = p;
    const ranking = allUsers
      .map(u => ({
        id: u.id,
        name: u.name,
        department: u.department,
        hasPaid: u.hasPaid,
        hasPredictions: !!predMap[u.id],
        score: computeScore(predMap[u.id], allResults, knockoutResults),
        exactCount: computeExactCount(predMap[u.id], allResults),
      }))
      .sort((a, b) =>
        b.score - a.score ||
        b.exactCount - a.exactCount ||
        a.name.localeCompare(b.name)
      );
    res.json(ranking);
  } catch (err: any) {
    req.log?.error?.(err, "ranking error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.get("/ranking/by-sector", async (req, res) => {
  try {
    const [allUsers, allPredictions, allResults, cfg] = await Promise.all([
      db.query.users.findMany(),
      db.query.userPredictions.findMany(),
      db.query.officialResults.findMany(),
      db.query.systemConfig.findFirst(),
    ]);
    const knockoutResults = (cfg?.officialKnockoutResults as any) ?? null;

    const predMap: Record<number, any> = {};
    for (const p of allPredictions) predMap[p.userId] = p;

    const sectorMap: Record<string, { totalScore: number; count: number; topScore: number; members: any[] }> = {};
    
    for (const u of allUsers) {
      const dept = u.department || "Outros";
      const score = computeScore(predMap[u.id], allResults, knockoutResults);
      
      if (!sectorMap[dept]) {
        sectorMap[dept] = { totalScore: 0, count: 0, topScore: 0, members: [] };
      }
      
      const s = sectorMap[dept];
      s.totalScore += score;
      s.count += 1;
      if (score > s.topScore) s.topScore = score;
      const exactCount = computeExactCount(predMap[u.id], allResults);
      s.members.push({
        id: u.id,
        name: u.name,
        score,
        exactCount,
      });
    }

    const result = Object.entries(sectorMap).map(([department, stats]) => ({
      department,
      avgScore: stats.count > 0 ? Math.round((stats.totalScore / stats.count) * 10) / 10 : 0,
      totalScore: stats.totalScore,
      count: stats.count,
      topScore: stats.topScore,
      members: stats.members.sort((a, b) =>
        b.score - a.score ||
        b.exactCount - a.exactCount ||
        a.name.localeCompare(b.name)
      )
    })).sort((a, b) => b.avgScore - a.avgScore);

    res.json(result);
  } catch (err: any) {
    req.log?.error?.(err, "ranking by sector error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// Static lookup: matchId → { groupId, homeTeamId, awayTeamId }
const MATCH_META: Record<string, { groupId: string; homeTeamId: string; awayTeamId: string }> = {
  g_1:  { groupId:'A', homeTeamId:'MEX', awayTeamId:'RSA' },
  g_2:  { groupId:'A', homeTeamId:'KOR', awayTeamId:'CZE' },
  g_3:  { groupId:'B', homeTeamId:'CAN', awayTeamId:'BIH' },
  g_4:  { groupId:'D', homeTeamId:'USA', awayTeamId:'PAR' },
  g_5:  { groupId:'B', homeTeamId:'QAT', awayTeamId:'SUI' },
  g_6:  { groupId:'C', homeTeamId:'BRA', awayTeamId:'MAR' },
  g_7:  { groupId:'C', homeTeamId:'HAI', awayTeamId:'SCO' },
  g_8:  { groupId:'D', homeTeamId:'AUS', awayTeamId:'TUR' },
  g_9:  { groupId:'E', homeTeamId:'GER', awayTeamId:'CUW' },
  g_10: { groupId:'E', homeTeamId:'CIV', awayTeamId:'ECU' },
  g_11: { groupId:'F', homeTeamId:'NED', awayTeamId:'JPN' },
  g_12: { groupId:'F', homeTeamId:'SWE', awayTeamId:'TUN' },
  g_13: { groupId:'G', homeTeamId:'BEL', awayTeamId:'EGY' },
  g_14: { groupId:'G', homeTeamId:'IRN', awayTeamId:'NZL' },
  g_15: { groupId:'H', homeTeamId:'ESP', awayTeamId:'CPV' },
  g_16: { groupId:'H', homeTeamId:'KSA', awayTeamId:'URY' },
  g_17: { groupId:'I', homeTeamId:'FRA', awayTeamId:'SEN' },
  g_18: { groupId:'I', homeTeamId:'IRQ', awayTeamId:'NOR' },
  g_19: { groupId:'J', homeTeamId:'ARG', awayTeamId:'ALG' },
  g_20: { groupId:'J', homeTeamId:'AUT', awayTeamId:'JOR' },
  g_21: { groupId:'K', homeTeamId:'POR', awayTeamId:'COD' },
  g_22: { groupId:'K', homeTeamId:'UZB', awayTeamId:'COL' },
  g_23: { groupId:'L', homeTeamId:'ENG', awayTeamId:'CRO' },
  g_24: { groupId:'L', homeTeamId:'GHA', awayTeamId:'PAN' },
  g_25: { groupId:'A', homeTeamId:'MEX', awayTeamId:'KOR' },
  g_26: { groupId:'A', homeTeamId:'CZE', awayTeamId:'RSA' },
  g_27: { groupId:'B', homeTeamId:'CAN', awayTeamId:'QAT' },
  g_28: { groupId:'B', homeTeamId:'SUI', awayTeamId:'BIH' },
  g_29: { groupId:'C', homeTeamId:'BRA', awayTeamId:'HAI' },
  g_30: { groupId:'C', homeTeamId:'SCO', awayTeamId:'MAR' },
  g_31: { groupId:'D', homeTeamId:'USA', awayTeamId:'AUS' },
  g_32: { groupId:'D', homeTeamId:'TUR', awayTeamId:'PAR' },
  g_33: { groupId:'E', homeTeamId:'GER', awayTeamId:'CIV' },
  g_34: { groupId:'E', homeTeamId:'ECU', awayTeamId:'CUW' },
  g_35: { groupId:'F', homeTeamId:'NED', awayTeamId:'SWE' },
  g_36: { groupId:'F', homeTeamId:'TUN', awayTeamId:'JPN' },
  g_37: { groupId:'G', homeTeamId:'BEL', awayTeamId:'IRN' },
  g_38: { groupId:'G', homeTeamId:'NZL', awayTeamId:'EGY' },
  g_39: { groupId:'H', homeTeamId:'ESP', awayTeamId:'KSA' },
  g_40: { groupId:'H', homeTeamId:'URY', awayTeamId:'CPV' },
  g_41: { groupId:'I', homeTeamId:'FRA', awayTeamId:'IRQ' },
  g_42: { groupId:'I', homeTeamId:'NOR', awayTeamId:'SEN' },
  g_43: { groupId:'J', homeTeamId:'ARG', awayTeamId:'AUT' },
  g_44: { groupId:'J', homeTeamId:'JOR', awayTeamId:'ALG' },
  g_45: { groupId:'K', homeTeamId:'POR', awayTeamId:'UZB' },
  g_46: { groupId:'K', homeTeamId:'COL', awayTeamId:'COD' },
  g_47: { groupId:'L', homeTeamId:'ENG', awayTeamId:'GHA' },
  g_48: { groupId:'L', homeTeamId:'PAN', awayTeamId:'CRO' },
  g_49: { groupId:'A', homeTeamId:'CZE', awayTeamId:'MEX' },
  g_50: { groupId:'A', homeTeamId:'RSA', awayTeamId:'KOR' },
  g_51: { groupId:'B', homeTeamId:'SUI', awayTeamId:'CAN' },
  g_52: { groupId:'B', homeTeamId:'BIH', awayTeamId:'QAT' },
  g_53: { groupId:'C', homeTeamId:'SCO', awayTeamId:'BRA' },
  g_54: { groupId:'C', homeTeamId:'MAR', awayTeamId:'HAI' },
  g_55: { groupId:'D', homeTeamId:'TUR', awayTeamId:'USA' },
  g_56: { groupId:'D', homeTeamId:'PAR', awayTeamId:'AUS' },
  g_57: { groupId:'E', homeTeamId:'ECU', awayTeamId:'GER' },
  g_58: { groupId:'E', homeTeamId:'CUW', awayTeamId:'CIV' },
  g_59: { groupId:'F', homeTeamId:'TUN', awayTeamId:'NED' },
  g_60: { groupId:'F', homeTeamId:'JPN', awayTeamId:'SWE' },
  g_61: { groupId:'G', homeTeamId:'NZL', awayTeamId:'BEL' },
  g_62: { groupId:'G', homeTeamId:'EGY', awayTeamId:'IRN' },
  g_63: { groupId:'H', homeTeamId:'URY', awayTeamId:'ESP' },
  g_64: { groupId:'H', homeTeamId:'CPV', awayTeamId:'KSA' },
  g_65: { groupId:'I', homeTeamId:'FRA', awayTeamId:'NOR' },
  g_66: { groupId:'I', homeTeamId:'SEN', awayTeamId:'IRQ' },
  g_67: { groupId:'J', homeTeamId:'JOR', awayTeamId:'ARG' },
  g_68: { groupId:'J', homeTeamId:'ALG', awayTeamId:'AUT' },
  g_69: { groupId:'K', homeTeamId:'COL', awayTeamId:'POR' },
  g_70: { groupId:'K', homeTeamId:'COD', awayTeamId:'UZB' },
  g_71: { groupId:'L', homeTeamId:'PAN', awayTeamId:'ENG' },
  g_72: { groupId:'L', homeTeamId:'CRO', awayTeamId:'GHA' },
};

router.get("/match-stats", async (req, res) => {
  try {
    const [officialRows, allPredictions] = await Promise.all([
      db.query.officialResults.findMany(),
      db.query.userPredictions.findMany(),
    ]);

    const result: any[] = [];

    for (const official of officialRows) {
      const meta = MATCH_META[official.matchId];
      if (!meta) continue;

      let total = 0, resultHits = 0, exactHits = 0;
      const scoreCounts: Record<string, number> = {};

      for (const p of allPredictions) {
        const groupPred = (p.groupPredictions as any)?.[meta.groupId];
        if (!groupPred) continue;
        const matchPred = (groupPred.matchPredictions || []).find((m: any) => m.matchId === official.matchId);
        if (!matchPred || matchPred.homeScore === null || matchPred.awayScore === null) continue;

        total++;
        const ph = Number(matchPred.homeScore), pa = Number(matchPred.awayScore);
        const oh = official.homeScore, oa = official.awayScore;

        const predResult = ph > pa ? "home" : ph < pa ? "away" : "draw";
        const realResult = oh > oa ? "home" : oh < oa ? "away" : "draw";
        if (predResult === realResult) resultHits++;
        if (ph === oh && pa === oa) exactHits++;

        const key = `${ph}-${pa}`;
        scoreCounts[key] = (scoreCounts[key] || 0) + 1;
      }

      const topPredictions = Object.entries(scoreCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([score, count]) => ({ score, count }));

      result.push({
        matchId: official.matchId,
        groupId: meta.groupId,
        homeTeamId: meta.homeTeamId,
        awayTeamId: meta.awayTeamId,
        officialHome: official.homeScore,
        officialAway: official.awayScore,
        total,
        resultHits,
        exactHits,
        topPredictions,
      });
    }

    result.sort((a, b) => {
      const n = (id: string) => parseInt(id.replace("g_", ""), 10);
      return n(a.matchId) - n(b.matchId);
    });

    res.json(result);
  } catch (err: any) {
    req.log?.error?.(err, "match stats error");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
