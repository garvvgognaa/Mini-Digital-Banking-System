import express from "express";
import cors from "cors";
import { JwtService } from "../auth/JwtService";
import { AccountController } from "../controllers/AccountController";
import { AuthController } from "../controllers/AuthController";
import { BeneficiaryController } from "../controllers/BeneficiaryController";
import { BankingController } from "../controllers/BankingController";
import { TransactionRunner } from "../db/TransactionRunner";
import { getPool } from "../db/pool";
import { errorMiddleware } from "../common/errors/errorMiddleware";
import { createRequireAuth } from "../middleware/requireAuth";
import { AccountRepository } from "../repositories/AccountRepository";
import { BeneficiaryRepository } from "../repositories/BeneficiaryRepository";
import { TransactionRepository } from "../repositories/TransactionRepository";
import { UserRepository } from "../repositories/UserRepository";
import { createAccountRouter } from "../routes/accountRoutes";
import { createAuthRouter } from "../routes/authRoutes";
import { createBankingRouter } from "../routes/bankingRoutes";
import { createBeneficiaryRouter } from "../routes/beneficiaryRoutes";
import { AccountService } from "../services/AccountService";
import { AuthService } from "../services/AuthService";
import { BeneficiaryService } from "../services/BeneficiaryService";
import { BankingApiService } from "../services/BankingApiService";
import { CoreBankingService } from "../services/CoreBankingService";

/**
 * Composition root: wires layers without introducing circular imports between domain types.
 */
export function createHttpApp(): express.Express {
  const pool = getPool();
  const accountRepository = new AccountRepository();
  const transactionRepository = new TransactionRepository();
  const userRepository = new UserRepository();
  const beneficiaryRepository = new BeneficiaryRepository();

  const runner = new TransactionRunner(pool);
  const coreBankingService = new CoreBankingService(runner, accountRepository, transactionRepository);
  const bankingApiService = new BankingApiService(coreBankingService, accountRepository);

  const jwtService = new JwtService();
  const requireAuth = createRequireAuth(jwtService);

  const authService = new AuthService(userRepository, jwtService);
  const accountService = new AccountService(accountRepository);
  const beneficiaryService = new BeneficiaryService(
    beneficiaryRepository,
    accountRepository,
    userRepository
  );

  const authController = new AuthController(authService);
  const accountController = new AccountController(accountService, transactionRepository);
  const beneficiaryController = new BeneficiaryController(beneficiaryService);
  const bankingController = new BankingController(bankingApiService);

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "64kb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/v1/auth", createAuthRouter(authController));
  app.use("/v1/accounts", requireAuth, createAccountRouter(accountController));
  app.use("/v1/beneficiaries", requireAuth, createBeneficiaryRouter(beneficiaryController));
  app.use("/v1/banking", requireAuth, createBankingRouter(bankingController));

  app.use(errorMiddleware);
  return app;
}
