import express        from "express";
import cors           from "cors";
import helmet         from "helmet";
import http           from "http";
import { Server }     from "socket.io";
import { ENV }        from "./config/env";
import { logger }     from "./config/logger";
import { initFirebase } from "./config/firebase";
import routes         from "./routes/index";
import { errorHandler }   from "./middleware/errorHandler";
import { requestLogger }  from "./middleware/requestLogger";
import { runRetentionCleanup } from "./jobs/backup.job";
import cron from "node-cron";

// ─── App setup ───────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ─── Socket.io ───────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ───────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// ─── Routes ───────────────────────────────────────────────────
app.use("/api", routes);

// ─── Error handler ────────────────────────────────────────────
app.use(errorHandler);

// ─── Init Firebase ────────────────────────────────────────────
initFirebase();

// ─── Retention cleanup — runs daily at 2AM ────────────────────
cron.schedule("0 2 * * *", async () => {
  logger.info("Running daily retention cleanup...");
  await runRetentionCleanup();
});

// ─── Start server ─────────────────────────────────────────────
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

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "BackupOS Backend Running"
  });
});
export { app, server };