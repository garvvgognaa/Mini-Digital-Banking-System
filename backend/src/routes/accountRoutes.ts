import { Router } from "express";
import type { AccountController } from "../controllers/AccountController";

export function createAccountRouter(controller: AccountController): Router {
  const router = Router();
  router.post("/", controller.create);
  router.get("/", controller.list);
  router.get("/:accountId/transactions", controller.transactions);
  router.get("/:accountId", controller.getById);
  return router;
}
