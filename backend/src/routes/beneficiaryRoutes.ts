import { Router } from "express";
import type { BeneficiaryController } from "../controllers/BeneficiaryController";

export function createBeneficiaryRouter(controller: BeneficiaryController): Router {
  const router = Router();
  router.get("/", controller.list);
  router.post("/", controller.create);
  router.delete("/:beneficiaryId", controller.remove);
  return router;
}
