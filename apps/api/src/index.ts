import express from "express";
import cors from "cors";
import { env } from "./lib/env";
import { setupRouter } from "./routes/setup";
import { authRouter } from "./routes/auth";
import { publicRouter } from "./routes/public";
import { adminRouter } from "./routes/admin";
import { contentRouter } from "./routes/content";
import { studentsRouter } from "./routes/students";
import { feesRouter } from "./routes/fees";
import { pickupRouter } from "./routes/pickup";
import { voiceRouter } from "./routes/voice";
import { staffRouter } from "./routes/staff";
import { reportsRouter } from "./routes/reports";
import { notificationsRouter } from "./routes/notifications";
import { eventsRouter } from "./routes/events";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/setup", setupRouter);
app.use("/auth", authRouter);
app.use("/public", publicRouter);
app.use("/admin", adminRouter);
app.use("/content", contentRouter);
app.use("/students", studentsRouter);
app.use("/fees", feesRouter);
app.use("/pickup", pickupRouter);
app.use("/voice", voiceRouter);
app.use("/staff", staffRouter);
app.use("/reports", reportsRouter);
app.use("/notifications", notificationsRouter);
app.use("/events", eventsRouter);

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our side. Please try again." });
});

app.listen(env.port, () => {
  console.log(`kampus api listening on :${env.port}`);
});
