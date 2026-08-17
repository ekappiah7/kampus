import { Router } from "express";
import { prisma } from "@kampus/db";
import type { NotificationView } from "@kampus/shared-types";
import { requireAuth, requireRole } from "../middleware/auth";

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth, requireRole("parent"));

notificationsRouter.get("/", async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { parentId: req.auth!.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const view: NotificationView[] = notifications.map((n) => ({
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));
  res.json(view);
});

notificationsRouter.post("/:id/read", async (req, res) => {
  const notification = await prisma.notification.update({ where: { id: req.params.id }, data: { read: true } });
  res.json(notification);
});
