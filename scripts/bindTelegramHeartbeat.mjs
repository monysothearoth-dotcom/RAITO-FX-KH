import mysql from "mysql2/promise";

const taskUid = process.argv[2];
if (!taskUid) throw new Error("Usage: node scripts/bindTelegramHeartbeat.mjs <taskUid>");
if (!process.env.DATABASE_URL || !process.env.OWNER_OPEN_ID) throw new Error("Database or owner configuration is unavailable");

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [owners] = await connection.execute("SELECT id FROM users WHERE openId = ? LIMIT 1", [process.env.OWNER_OPEN_ID]);
const owner = owners[0];
if (!owner) throw new Error("Project owner has not signed in to the dashboard yet");

await connection.execute("INSERT INTO telegram_news_settings (userId, isEnabled, scheduleCronTaskUid, lastError) VALUES (?, 1, ?, NULL) ON DUPLICATE KEY UPDATE isEnabled = 1, scheduleCronTaskUid = VALUES(scheduleCronTaskUid), lastError = NULL", [owner.id, taskUid]);
await connection.end();
console.log(JSON.stringify({ activated: true, ownerUserId: owner.id, taskUid }));
