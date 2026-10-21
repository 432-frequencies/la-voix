import nodemailer from "nodemailer";
import { mkdir, writeFile, readdir, readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { localMail, production } from "./config.ts";
const directory = process.env.MAIL_DIR || ".local/mail";
export async function sendMail(to: string, subject: string, url: string) {
  if (localMail) {
    await mkdir(directory, { recursive: true, mode: 0o700 });
    await writeFile(
      `${directory}/${Date.now()}-${randomUUID()}.json`,
      JSON.stringify({ to, subject, url, date: new Date().toISOString() }),
      { mode: 0o600 },
    );
    console.log("Courriel disponible dans la boîte locale /dev-mail.");
    return;
  }
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    requireTLS: production && process.env.SMTP_SECURE !== "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });
  await transporter.sendMail({
    from: process.env.MAIL_FROM || "LA VOIX <noreply@localhost>",
    to,
    subject,
    text: `${subject}\n\n${url}\n\nSi vous n’êtes pas à l’origine de cette demande, ignorez ce message.`,
  });
}
export async function readLocalMail() {
  if (!localMail) return [];
  const files = await readdir(directory).catch(() => []);
  return Promise.all(
    files
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse()
      .slice(0, 30)
      .map(async (f) =>
        JSON.parse(await readFile(`${directory}/${f}`, "utf8")),
      ),
  );
}
