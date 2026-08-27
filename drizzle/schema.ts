import { double, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  displayName: varchar("displayName", { length: 160 }),
  email: varchar("email", { length: 320 }),
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  defaultView: varchar("defaultView", { length: 32 }).default("all_in_one"),
  theme: mysqlEnum("theme", ["dark", "light", "system"]).default("dark"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const portfolioHoldings = mysqlTable("portfolio_holdings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  symbol: varchar("symbol", { length: 64 }).notNull(),
  quantity: double("quantity").notNull(),
  averagePrice: double("averagePrice").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const tradeJournalEntries = mysqlTable("trade_journal_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  symbol: varchar("symbol", { length: 64 }).notNull(),
  direction: mysqlEnum("direction", ["BUY", "SELL"]).notNull(),
  strategy: varchar("strategy", { length: 128 }).notNull(),
  entryPrice: double("entryPrice").notNull(),
  exitPrice: double("exitPrice"),
  size: double("size").notNull(),
  pnl: double("pnl"),
  status: varchar("status", { length: 32 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const paperTrades = mysqlTable("paper_trades", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  symbol: varchar("symbol", { length: 64 }).notNull(),
  direction: mysqlEnum("direction", ["BUY", "SELL"]).notNull(),
  strategy: varchar("strategy", { length: 128 }).notNull(),
  provider: varchar("provider", { length: 64 }),
  setupScore: double("setupScore"),
  entryPrice: double("entryPrice").notNull(),
  stopLoss: double("stopLoss").notNull(),
  takeProfit: double("takeProfit").notNull(),
  size: double("size").notNull().default(1),
  status: mysqlEnum("status", ["OPEN", "TARGET_HIT", "STOPPED_OUT", "CLOSED", "CANCELLED"]).notNull().default("OPEN"),
  closePrice: double("closePrice"),
  pnlPercent: double("pnlPercent"),
  pnlAmount: double("pnlAmount"),
  rationale: text("rationale"),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  closedAt: timestamp("closedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const priceAlerts = mysqlTable("price_alerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  symbol: varchar("symbol", { length: 64 }).notNull(),
  targetPrice: double("targetPrice").notNull(),
  condition: mysqlEnum("condition", ["ABOVE", "BELOW"]).notNull(),
  isTriggered: int("isTriggered").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const telegramNewsSettings = mysqlTable("telegram_news_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  isEnabled: int("isEnabled").notNull().default(0),
  highImpactAlertsEnabled: int("highImpactAlertsEnabled").notNull().default(1),
  highImpactLeadMinutes: int("highImpactLeadMinutes").notNull().default(15),
  highImpactInstruments: varchar("highImpactInstruments", { length: 512 }).notNull().default("XAUUSD,EURUSD,GBPUSD,USDJPY,AUDUSD,USDCAD,USDCHF,NZDUSD"),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastRunAt: timestamp("lastRunAt"),
  lastSuccessAt: timestamp("lastSuccessAt"),
  lastError: varchar("lastError", { length: 512 }),
  runCount: int("runCount").notNull().default(0),
  successfulRunCount: int("successfulRunCount").notNull().default(0),
  failedRunCount: int("failedRunCount").notNull().default(0),
  consecutiveFailureCount: int("consecutiveFailureCount").notNull().default(0),
  totalSent: int("totalSent").notNull().default(0),
  totalSkipped: int("totalSkipped").notNull().default(0),
  sourceFailures: varchar("sourceFailures", { length: 512 }),
  outageActive: int("outageActive").notNull().default(0),
  pendingNotificationType: varchar("pendingNotificationType", { length: 32 }),
  pendingNotificationContent: varchar("pendingNotificationContent", { length: 1024 }),
  notificationAttemptCount: int("notificationAttemptCount").notNull().default(0),
  lastNotificationError: varchar("lastNotificationError", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("telegram_news_settings_user_unique").on(table.userId),
  index("telegram_news_settings_task_uid_index").on(table.scheduleCronTaskUid),
]);

export const newsEffectTracking = mysqlTable("news_effect_tracking", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fingerprint: varchar("fingerprint", { length: 191 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  url: varchar("url", { length: 1024 }),
  symbol: varchar("symbol", { length: 32 }).notNull(),
  predictedEffect: mysqlEnum("predictedEffect", ["BUY", "SELL", "NORMAL"]).notNull(),
  baselinePrice: double("baselinePrice").notNull(),
  baselineAt: timestamp("baselineAt").defaultNow().notNull(),
  evaluationWindowMinutes: int("evaluationWindowMinutes").notNull().default(60),
  currentPrice: double("currentPrice"),
  movementPercent: double("movementPercent"),
  actualEffect: mysqlEnum("actualEffect", ["BUY", "SELL", "NORMAL"]),
  outcome: mysqlEnum("outcome", ["PENDING", "CORRECT", "INCORRECT", "NEUTRAL", "UNAVAILABLE"]).notNull().default("PENDING"),
  evaluatedAt: timestamp("evaluatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("news_effect_tracking_user_fingerprint_unique").on(table.userId, table.fingerprint),
  index("news_effect_tracking_user_status_index").on(table.userId, table.outcome),
  index("news_effect_tracking_user_created_index").on(table.userId, table.createdAt),
]);

export const telegramNewsDeliveries = mysqlTable("telegram_news_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fingerprint: varchar("fingerprint", { length: 191 }).notNull(),
  title: varchar("title", { length: 512 }).notNull(),
  url: varchar("url", { length: 1024 }),
  category: mysqlEnum("category", ["forex", "crypto"]).notNull(),
  source: varchar("source", { length: 128 }),
  deliveredAt: timestamp("deliveredAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("telegram_news_delivery_user_fingerprint_unique").on(table.userId, table.fingerprint),
  index("telegram_news_delivery_user_delivered_index").on(table.userId, table.deliveredAt),
]);

export const autoSignalSettings = mysqlTable("auto_signal_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  isEnabled: int("isEnabled").notNull().default(0),
  minConfidence: int("minConfidence").notNull().default(78),
  minScore: int("minScore").notNull().default(82),
  minRiskReward: double("minRiskReward").notNull().default(1.8),
  scheduleCronTaskUid: varchar("scheduleCronTaskUid", { length: 65 }),
  lastRunAt: timestamp("lastRunAt"),
  lastError: varchar("lastError", { length: 512 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("auto_signal_settings_user_unique").on(table.userId),
  index("auto_signal_settings_task_uid_index").on(table.scheduleCronTaskUid),
]);

export const autoSignals = mysqlTable("auto_signals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fingerprint: varchar("fingerprint", { length: 191 }).notNull(),
  activeKey: varchar("activeKey", { length: 96 }),
  source: mysqlEnum("source", ["TECHNICAL", "PRE_NEWS"]).notNull(),
  symbol: varchar("symbol", { length: 32 }).notNull(),
  direction: mysqlEnum("direction", ["BUY", "SELL"]).notNull(),
  status: mysqlEnum("status", ["OPEN", "TP_HIT", "SL_HIT", "EXPIRED", "CANCELLED"]).notNull().default("OPEN"),
  entryPrice: double("entryPrice").notNull(),
  stopLoss: double("stopLoss").notNull(),
  takeProfit: double("takeProfit").notNull(),
  confidence: int("confidence").notNull(),
  technicalScore: int("technicalScore").notNull().default(0),
  strategyScore: int("strategyScore").notNull().default(0),
  fundamentalScore: int("fundamentalScore").notNull().default(0),
  intelligenceScore: int("intelligenceScore").notNull().default(0),
  riskReward: double("riskReward").notNull().default(0),
  rationale: text("rationale").notNull(),
  warning: text("warning"),
  newsEvent: varchar("newsEvent", { length: 512 }),
  newsScheduledAt: timestamp("newsScheduledAt"),
  outcomePrice: double("outcomePrice"),
  outcomeDetails: text("outcomeDetails"),
  openedAt: timestamp("openedAt").defaultNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
  lastEvaluatedAt: timestamp("lastEvaluatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("auto_signal_user_fingerprint_unique").on(table.userId, table.fingerprint),
  uniqueIndex("auto_signal_active_key_unique").on(table.activeKey),
  index("auto_signal_user_status_index").on(table.userId, table.status),
  index("auto_signal_user_opened_index").on(table.userId, table.openedAt),
]);

export const autoSignalDeliveries = mysqlTable("auto_signal_deliveries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  signalId: int("signalId").notNull(),
  deliveryType: mysqlEnum("deliveryType", ["SIGNAL", "OUTCOME"]).notNull(),
  status: mysqlEnum("status", ["PENDING", "SENDING", "SENT", "FAILED", "UNKNOWN"]).notNull().default("SENT"),
  attemptCount: int("attemptCount").notNull().default(1),
  attemptedAt: timestamp("attemptedAt"),
  lastError: varchar("lastError", { length: 512 }),
  deliveredAt: timestamp("deliveredAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("auto_signal_delivery_unique").on(table.signalId, table.deliveryType),
  index("auto_signal_delivery_user_index").on(table.userId, table.deliveredAt),
  index("auto_signal_delivery_status_index").on(table.userId, table.status),
]);
