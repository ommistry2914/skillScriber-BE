const dotenv = require("dotenv");
const path = require("path");
const { z } = require("zod");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const envVarsSchema = z.object({
  NODE_ENV: z.enum(["production", "development", "test"]),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
});

const parsedEnv = envVarsSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Config validation error:", parsedEnv.error.format());
  throw new Error("Invalid environment variables");
}

const envVars = parsedEnv.data;

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  databaseUrl: envVars.DATABASE_URL,

};
