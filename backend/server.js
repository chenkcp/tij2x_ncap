// backend in three layers of responsibility:
// When a request comes in: Browser → server.js → app.js → routes/index.js → response
// server.js → starts the app (entry point)
// app.js → configures the app (middleware + routes)
// routes/index.js → defines endpoints (business entry point

//server only starts the server. It should NOT contain business logic.
const dotenv = require("dotenv");

if (process.env.NODE_ENV !== "production") {
  // In development, load secrets from the local .env file.
  dotenv.config({ path: ".env" });
}
// In production (ECS), AWS_REGION and OAUTH_CLIENT_ID are provided by the ECS task definition.
// All other sensitive secrets (OAUTH_CLIENT_SECRET, JWT_SECRET, *_DB_CONNECTION) are
// loaded from AWS Secrets Manager via loadSecrets() below.

async function start() {
  if (process.env.NODE_ENV === "production") {
    const { loadSecrets } = require("./src/utils/secretsLoader");
    await loadSecrets();
  }

  const app = require("./src/app");
  const PORT = process.env.PORT || 5000;

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("[server] Failed to start:", err);
  process.exit(1);
});