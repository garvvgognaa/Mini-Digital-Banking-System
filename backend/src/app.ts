import "dotenv/config";
import { loadEnv } from "./config/env";
import { createHttpApp } from "./composition/container";

loadEnv();

export const app = createHttpApp();
