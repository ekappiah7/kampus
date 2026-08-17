import express from "express";
import cors from "cors";
import { env } from "./lib/env";
import { authRouter } from "./routes/auth";
import { studentsRouter } from "./routes/students";
import { feesRouter } from "./routes/fees";
import { pickupRouter } from "./routes/pickup";
import { voiceRouter } from "./routes/voice";
import { staffRouter } from "./routes/staff";
import { notificationsRouter } from "./routes/notifications";
import { eventsRouter } from "./routes/events";
import { schoolRouter, cafeteriaRouter } from "./routes/school";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/students", studentsRouter);
app.use("/fees", feesRouter);
app.use("/pickup", pickupRouter);
app.use("/voice", voiceRouter);
app.use("/staff", staffRouter);
app.use("/notifications", notificationsRouter);
app.use("/events", eventsRouter);
app.use("/schools", schoolRouter);
app.use("/cafeteria", cafeteriaRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(env.port, () => {
  console.log(`kampus api listening on :${env.port}`);
});
