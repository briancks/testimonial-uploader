import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSubfolder, uploadFile } from "@/lib/google-drive";
import { transcribeVideo } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  let testimonialId: string | null = null;

  try {
    const formData = await request.formData();
    const name = formData.get("name") as string;
    const course = formData.get("course") as string;
    const headshot = formData.get("headshot") as File | null;
    const video = formData.get("video") as File | null;

    if (!name || !course) {
      return NextResponse.json(
        { error: "Name and course are required" },
        { status: 400 }
      );
    }

    if (!headshot || !video) {
      return NextResponse.json(
        { error: "Headshot and video are required" },
        { status: 400 }
      );
    }

    // Create DB record with processing status
    const testimonial = await prisma.testimonial.create({
      data: { name, course, status: "processing" },
    });
    testimonialId = testimonial.id;

    // Create a subfolder in Drive for this submission
    const folderName = `${name} - ${course} - ${testimonial.id}`;
    const folderId = await createSubfolder(folderName);

    // Upload headshot and video in parallel
    const [headshotBuffer, videoBuffer] = await Promise.all([
      headshot.arrayBuffer().then((ab) => Buffer.from(ab)),
      video.arrayBuffer().then((ab) => Buffer.from(ab)),
    ]);

    const [headshotResult, videoResult] = await Promise.all([
      uploadFile(
        headshotBuffer,
        `headshot-${name}.jpg`,
        headshot.type || "image/jpeg",
        folderId
      ),
      uploadFile(
        videoBuffer,
        `testimonial-${name}.${video.type?.includes("mp4") ? "mp4" : "webm"}`,
        video.type || "video/mp4",
        folderId
      ),
    ]);

    // Transcribe video via Gemini
    let transcript = "";
    try {
      transcript = await transcribeVideo(
        videoBuffer,
        video.type || "video/mp4"
      );
    } catch (err) {
      console.error("Transcription failed:", err);
      transcript = "Transcription failed - manual review needed";
    }

    // Update DB with results
    const updated = await prisma.testimonial.update({
      where: { id: testimonial.id },
      data: {
        headshotDriveId: headshotResult.id,
        headshotDriveUrl: headshotResult.url,
        videoDriveId: videoResult.id,
        videoDriveUrl: videoResult.url,
        transcript,
        status: "completed",
      },
    });

    return NextResponse.json(updated, { status: 201 });
  } catch (error) {
    console.error("Submission error:", error);

    // Mark as failed if we created the record
    if (testimonialId) {
      await prisma.testimonial.update({
        where: { id: testimonialId },
        data: { status: "failed" },
      }).catch(() => {});
    }

    return NextResponse.json(
      { error: "Failed to process submission" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(testimonials);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}
