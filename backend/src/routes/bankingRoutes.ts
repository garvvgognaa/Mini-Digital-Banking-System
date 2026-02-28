import { Router } from "express";
import type { BankingController } from "../controllers/BankingController";

export function createBankingRouter(controller: BankingController): Router {
  const router = Router();

  router.post("/deposits", controller.deposit);
  router.post("/withdrawals", controller.withdraw);
  router.post("/transfers", controller.transfer);

  return router;
}
