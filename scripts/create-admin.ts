import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const db = new PrismaClient();

const ENTER_KEYS = ["\n", "\r", ""]; //  = Ctrl-D
const INTERRUPT_KEY = ""; // Ctrl-C
const BACKSPACE_KEYS = ["", "\b"]; // DEL / backspace

/**
 * Reads a line from stdin without echoing it back to the terminal.
 *
 * Node's readline has no built-in mask, so this drives stdin in raw mode
 * and prints one asterisk per character instead. Falls back to a plain
 * (visible) prompt when stdin isn't a TTY — raw mode has nothing to attach
 * to when input is piped in, e.g. from a script.
 */
async function readPassword(promptText: string): Promise<string> {
  if (!stdin.isTTY) {
    const rl = createInterface({ input: stdin, output: stdout });
    const value = await rl.question(promptText);
    rl.close();
    return value;
  }

  return new Promise((resolve, reject) => {
    stdout.write(promptText);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let input = "";
    const onData = (char: string) => {
      if (ENTER_KEYS.includes(char)) {
        cleanup();
        stdout.write("\n");
        resolve(input);
        return;
      }
      if (char === INTERRUPT_KEY) {
        cleanup();
        stdout.write("\n");
        reject(new Error("Cancelled."));
        return;
      }
      if (BACKSPACE_KEYS.includes(char)) {
        if (input.length > 0) {
          input = input.slice(0, -1);
          stdout.write("\b \b");
        }
        return;
      }
      input += char;
      stdout.write("*");
    };

    function cleanup() {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    }

    stdin.on("data", onData);
  });
}

/**
 * Creates or updates an admin user.
 *
 *   npm run admin:create
 *
 * There is no public sign-up route, by design — the only way an account
 * exists is if someone with database access runs this.
 */
async function main() {
  const rl = createInterface({ input: stdin, output: stdout });

  const email = (await rl.question("Email: ")).trim().toLowerCase();
  const name = (await rl.question("Name (optional): ")).trim();
  rl.close();

  const password = (await readPassword("Password: ")).trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error("That is not a valid email address.");
    process.exit(1);
  }

  if (password.length < 12) {
    console.error("Use at least 12 characters. This is the only door in.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, name: name || undefined },
    create: { email, name: name || undefined, passwordHash, role: "ADMIN" },
  });

  // Any existing sessions belong to the old password.
  const removed = await db.session.deleteMany({ where: { userId: user.id } });

  console.log(`\nAdmin ready: ${user.email}`);
  if (removed.count > 0) {
    console.log(`Signed out ${removed.count} existing session(s).`);
  }
  console.log("Sign in at /admin/login\n");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
