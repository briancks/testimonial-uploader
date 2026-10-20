import { GoogleGenAI, FileState } from "@google/genai";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  return new GoogleGenAI({ apiKey });
}

async function waitForFileActive(
  ai: GoogleGenAI,
  fileName: string,
  maxWaitMs = 120_000
) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const file = await ai.files.get({ name: fileName });
    if (file.state === FileState.ACTIVE) return file;
    if (file.state === FileState.FAILED) {
      throw new Error(`File processing failed: ${fileName}`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`File processing timed out: ${fileName}`);
}

export async function transcribeVideo(
  videoBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const ai = getClient();

  // Upload video to Gemini File API
  const uploaded = await ai.files.upload({
    file: new Blob([new Uint8Array(videoBuffer)], { type: mimeType }),
    config: { mimeType },
  });

  if (!uploaded.name) throw new Error("Upload returned no file name");

  // Wait for processing
  const activeFile = await waitForFileActive(ai, uploaded.name);

  // Generate transcription
  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              fileUri: activeFile.uri!,
              mimeType: activeFile.mimeType!,
            },
          },
          {
            text: "Please transcribe everything said in this video. Return only the transcription text, no timestamps or speaker labels. If no speech is detected, return 'No speech detected.'",
          },
        ],
      },
    ],
  });

  const text = response.text?.trim();
  if (!text) throw new Error("No transcription returned");

  // Clean up the uploaded file
  try {
    await ai.files.delete({ name: uploaded.name });
  } catch {
    // Non-critical, ignore cleanup errors
  }

  return text;
}
