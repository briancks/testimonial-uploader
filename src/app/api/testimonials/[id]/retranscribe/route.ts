import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifySession } from "@/lib/auth";
import { downloadFile } from "@/lib/google-drive";
import { transcribeVideo } from "@/lib/gemini";
import { trackEvent } from "@/lib/nexus";
import { TRANSCRIPTION_FAILED } from "@/types";

// Re-runs Gemini transcription on the video already in Drive. Only allowed for
// rows whose transcript is the failure placeholder, so a good transcript is
// never overwritten. middleware.ts only covers /admin pages, so check the
// session here.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifySession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const testimonial = await prisma.testimonial.findUnique({ where: { id } });

  if (!testimonial) {
    return NextResponse.json(
      { error: "Testimonial not found" },
      { status: 404 }
    );
  }

  if (testimonial.transcript !== TRANSCRIPTION_FAILED) {
    return NextResponse.json(
      { error: "This testimonial already has a transcript" },
      { status: 409 }
    );
  }

  if (!testimonial.videoDriveId) {
    return NextResponse.json(
      { error: "No video in Drive for this testimonial" },
      { status: 400 }
    );
  }

  let transcript: string;
  try {
    const video = await downloadFile(testimonial.videoDriveId);
    transcript = await transcribeVideo(
      video.buffer,
      video.mimeType || "video/mp4"
    );
  } catch (err) {
    console.error("Retranscription failed:", err);
    await trackEvent("testimonial_retranscribed", { transcript_ok: false });
    return NextResponse.json(
      { error: "Transcription failed again. Check the server logs." },
      { status: 502 }
    );
  }

  const updated = await prisma.testimonial.update({
    where: { id },
    data: { transcript },
  });

  await trackEvent("testimonial_retranscribed", {
    transcript_ok: true,
    transcript_length: transcript.length,
  });

  return NextResponse.json(updated);
}
