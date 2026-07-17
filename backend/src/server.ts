import express     from "express";
import cors        from "cors";
import helmet      from "helmet";
import http        from "http";
import { Server }  from "socket.io";
import { ENV }              from "./config/env";
import { logger }           from "./config/logger";
import { initFirebase }     from "./config/firebase";
import routes               from "./routes/index";
import { errorHandler }     from "./middleware/errorHandler";
import { requestLogger }    from "./middleware/requestLogger";
import { runRetentionCleanup } from "./jobs/backup.job";
import cron from "node-cron";

const app    = express();
const server = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

app.set("io", io);

io.on("connection", (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ───────────────────────────────────────────────────────────────
// BUGFIX: helmet() default config sets X-Content-Type-Options + other headers
// that can interfere with Socket.IO's WebSocket upgrade handshake.
// crossOriginEmbedderPolicy disabled — it blocks resources needed by the
// frontend dashboard. upgradeInsecureRequests disabled — only matters for
// HTTPS, not needed in development.
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy:     false,
  })
);

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ─── Routes ───────────────────────────────────────────────────────────────────
// BUGFIX: pehle app.get("/") `server.listen()` ke BAAD register hota tha.
// Express routes synchronously register hote hain — listen() ke baad
// register karna technically safe hai, lekin confusing aur error-prone hai
// (test environments ya fast clients miss kar sakte the).
// Ab sab routes listen() se PEHLE hain.

app.get("/", (_req, res) => {
  res.json({ success: true, message: "BackupOS Backend Running" });
});

app.use("/api", routes);
app.use(errorHandler);

// ─── Init Firebase ────────────────────────────────────────────────────────────
initFirebase();

// ─── Retention cleanup — daily at 2AM ─────────────────────────────────────────
cron.schedule("0 2 * * *", async () => {
  logger.info("Running daily retention cleanup...");
  await runRetentionCleanup();
});

// ─── Start server ─────────────────────────────────────────────────────────────
server.listen(ENV.PORT, () => {
  logger.info(`
  ╔══════════════════════════════════════╗
  ║         BackupOS Backend             ║
  ║  Server   : http://localhost:${ENV.PORT}   ║
  ║  Env      : ${ENV.NODE_ENV.padEnd(26)}║
  ║  WebSocket: ws://localhost:${ENV.PORT}     ║
  ╚══════════════════════════════════════╝
  `);
});

export { app, server };