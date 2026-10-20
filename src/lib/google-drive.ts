import { google } from "googleapis";
import { Readable } from "stream";

function getAuth() {
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not set");

  let credentials: { client_email: string; private_key: string };
  try {
    credentials = JSON.parse(key);
  } catch {
    // If not JSON, treat as file path
    const fs = require("fs");
    credentials = JSON.parse(fs.readFileSync(key, "utf-8"));
  }

  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

function getDrive() {
  return google.drive({ version: "v3", auth: getAuth() });
}

export async function createSubfolder(name: string): Promise<string> {
  const drive = getDrive();
  const parentId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!parentId) throw new Error("GOOGLE_DRIVE_FOLDER_ID is not set");

  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    supportsAllDrives: true,
    fields: "id",
  });

  return res.data.id!;
}

export async function uploadFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
  folderId: string
): Promise<{ id: string; url: string }> {
  const drive = getDrive();

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [folderId],
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    supportsAllDrives: true,
    fields: "id, webViewLink",
  });

  const fileId = res.data.id!;

  // Try to make file publicly readable (may fail on Shared Drives)
  try {
    await drive.permissions.create({
      fileId,
      supportsAllDrives: true,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });
  } catch {
    // Shared Drives may restrict per-file permissions — not fatal
  }

  const url = `https://drive.google.com/file/d/${fileId}/view`;

  return { id: fileId, url };
}

export async function downloadFile(
  fileId: string
): Promise<{ buffer: Buffer; mimeType: string | null }> {
  const drive = getDrive();

  const [meta, media] = await Promise.all([
    drive.files.get({ fileId, supportsAllDrives: true, fields: "mimeType" }),
    drive.files.get(
      { fileId, supportsAllDrives: true, alt: "media" },
      { responseType: "arraybuffer" }
    ),
  ]);

  return {
    buffer: Buffer.from(media.data as ArrayBuffer),
    mimeType: meta.data.mimeType ?? null,
  };
}
