import { pgTable, text, serial, integer, timestamp, json, boolean, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  department: varchar("department", { length: 255 }),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  hasPaid: boolean("has_paid").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userPredictions = pgTable("user_predictions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  groupPredictions: json("group_predictions").$type<Record<string, any>>(),
  secondRoundPredictions: json("second_round_predictions").$type<Record<string, string>>(),
  r16Predictions: json("r16_predictions").$type<Record<string, string>>(),
  qfPredictions: json("qf_predictions").$type<Record<string, string>>(),
  sfPredictions: json("sf_predictions").$type<Record<string, string>>(),
  finalistPrediction: json("finalist_prediction").$type<[string | null, string | null]>(),
  finalPrediction: varchar("final_prediction", { length: 64 }),
  confirmedGroups: boolean("confirmed_groups").default(false),
  confirmedKnockout: boolean("confirmed_knockout").default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const officialResults = pgTable("official_results", {
  id: serial("id").primaryKey(),
  matchId: varchar("match_id", { length: 64 }).notNull().unique(),
  homeScore: integer("home_score").notNull(),
  awayScore: integer("away_score").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  predictionDeadline: timestamp("prediction_deadline"),
  isLocked: boolean("is_locked").default(false),
  officialKnockoutResults: json("official_knockout_results").$type<any>(),
  smtpConfig: json("smtp_config").$type<{
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  }>(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  userEmail: varchar("user_email", { length: 320 }).notNull(),
  userName: text("user_name"),
  action: varchar("action", { length: 100 }).notNull(),
  details: json("details").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserPrediction = typeof userPredictions.$inferSelect;
export type OfficialResult = typeof officialResults.$inferSelect;
export type SystemConfig = typeof systemConfig.$inferSelect;
