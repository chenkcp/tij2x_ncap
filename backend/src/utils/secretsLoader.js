const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

// AWS_REGION and OAUTH_CLIENT_ID are injected by the ECS task definition as environment variables.
// The following secrets are stored in AWS Secrets Manager and loaded at startup:
//   - OAUTH_CLIENT_SECRET
//   - JWT_SECRET
//   - All *_DB_CONNECTION strings (e.g. CJA1_PRODUCT_DB_CONNECTION, etc.)
const SECRET_ID = process.env.SECRETS_MANAGER_SECRET_ID || "nextcap/web_secret";

async function loadSecrets() {
  const region = process.env.AWS_REGION;
  if (!region) {
    throw new Error("AWS_REGION environment variable is not set. It must be provided by the ECS task definition.");
  }

  const client = new SecretsManagerClient({ region });
  const command = new GetSecretValueCommand({ SecretId: SECRET_ID });
  const response = await client.send(command);
  const secrets = JSON.parse(response.SecretString);

  // Selectively inject only the expected sensitive keys into process.env.
  // Non-sensitive config (AWS_REGION, OAUTH_CLIENT_ID) must already be set via ECS task definition.
  const sensitiveKeys = [
    "OAUTH_CLIENT_SECRET",
    "JWT_SECRET",
    ...Object.keys(secrets).filter((k) => k.endsWith("_DB_CONNECTION")),
  ];

  for (const key of sensitiveKeys) {
    if (secrets[key] !== undefined) {
      process.env[key] = secrets[key];
    } else {
      console.warn(`[secretsLoader] Expected secret key "${key}" not found in AWS Secrets Manager secret "${SECRET_ID}".`);
    }
  }

  console.log(`[secretsLoader] Loaded ${sensitiveKeys.length} secret(s) from AWS Secrets Manager (secret: ${SECRET_ID}).`);
}

module.exports = { loadSecrets };