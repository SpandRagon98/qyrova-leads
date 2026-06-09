import "dotenv/config";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.port, env.host, () => {
  console.log(`Qyrova Leads server listening on ${env.host}:${env.port}`);
});
