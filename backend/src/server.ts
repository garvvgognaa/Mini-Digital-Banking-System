import { app } from "./app";
import { loadEnv } from "./config/env";

const env = loadEnv();

const server = app.listen(env.PORT, () => {
  console.log(`Core banking API listening on port ${env.PORT}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\n[mdbs] Port ${env.PORT} is already in use (another process is listening).\n\n` +
      `Fix one of:\n` +
      `  1) Stop the old server:  lsof -ti :${env.PORT} | xargs kill -9\n` +
      `  2) Or use a free port: set PORT=3001 (or another) in backend/.env\n` +
      `     If you use Vite, set frontend/.env.local → VITE_API_PROXY_TARGET=http://127.0.0.1:<same PORT>\n`
    );
    process.exit(1);
    return;
  }
  console.error(err);
  process.exit(1);
});
