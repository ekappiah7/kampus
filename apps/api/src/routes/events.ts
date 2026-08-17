import { Router } from "express";
import { prisma } from "@kampus/db";
import { requireAuth } from "../middleware/auth";

export const eventsRouter = Router();
eventsRouter.use(requireAuth);

eventsRouter.get("/", async (req, res) => {
  const events = await prisma.event.findMany({
    where: { schoolId: req.auth!.schoolId, date: { gte: new Date(new Date().setMonth(new Date().getMonth() - 1)) } },
    orderBy: { date: "asc" },
  });
  res.json(events);
});
