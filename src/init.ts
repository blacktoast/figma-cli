import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import * as readline from "node:readline";
import { getMe } from "./api.js";

const CONFIG_DIR = path.join(os.homedir(), ".figma-cli");
const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

export function loadToken(): string {
  const envToken = process.env["FIGMA_TOKEN"];
  if (envToken) return envToken;

  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
    const config = JSON.parse(raw) as { token?: string };
    if (config.token) return config.token;
  } catch {
    // no config file
  }

  throw new Error(
    "No Figma token found. Set FIGMA_TOKEN env variable or run: figma-cli init"
  );
}

function readToken(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question("Enter your Figma personal access token: ", (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export async function initToken(): Promise<void> {
  const token = await readToken();

  if (!token.trim()) {
    throw new Error("Token cannot be empty.");
  }

  // Verify token
  process.stdout.write("Verifying token... ");
  let user;
  try {
    user = await getMe(token.trim());
  } catch (err) {
    console.error("\nToken verification failed:");
    console.error(err instanceof Error ? err.message : err);
    throw new Error("Invalid token. Could not authenticate with Figma API.");
  }

  // Save config
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(
    CONFIG_PATH,
    JSON.stringify({ token: token.trim() }, null, 2),
    { mode: 0o600 }
  );

  console.log(`Authenticated as ${user.handle} (${user.email})`);
  console.log(`Token saved to ${CONFIG_PATH}`);
}
