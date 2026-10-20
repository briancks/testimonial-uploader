export interface TestimonialRecord {
  id: string;
  name: string;
  course: string;
  headshotDriveId: string | null;
  headshotDriveUrl: string | null;
  videoDriveId: string | null;
  videoDriveUrl: string | null;
  transcript: string | null;
  status: string;
  createdAt: Date;
}

export type TestimonialStatus = "processing" | "completed" | "failed";

export const TRANSCRIPTION_FAILED = "Transcription failed - manual review needed";
