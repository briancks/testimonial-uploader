import Link from "next/link";
import type { TestimonialRecord } from "@/types";

interface Props {
  testimonial: TestimonialRecord;
}

export default function TestimonialDetail({ testimonial: t }: Props) {
  const driveEmbedUrl = t.videoDriveId
    ? `https://drive.google.com/file/d/${t.videoDriveId}/preview`
    : null;
  const headshotEmbedUrl = t.headshotDriveId
    ? `https://drive.google.com/thumbnail?id=${t.headshotDriveId}&sz=w400`
    : null;

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-block text-sm text-blue-600 hover:text-blue-800"
      >
        &larr; Back to list
      </Link>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t.name}</h2>
            <p className="text-gray-600">{t.course}</p>
            <p className="mt-1 text-sm text-gray-400">
              {new Date(t.createdAt).toLocaleString()}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              t.status === "completed"
                ? "bg-green-100 text-green-800"
                : t.status === "failed"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {t.status}
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Headshot */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-700">
              Headshot
            </h3>
            {headshotEmbedUrl ? (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={headshotEmbedUrl}
                  alt={`${t.name} headshot`}
                  className="h-48 w-48 rounded-lg border object-cover"
                />
                {t.headshotDriveUrl && (
                  <a
                    href={t.headshotDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-blue-600 hover:underline"
                  >
                    Open in Drive
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No headshot</p>
            )}
          </div>

          {/* Video */}
          <div>
            <h3 className="mb-2 text-sm font-medium text-gray-700">
              Video
            </h3>
            {driveEmbedUrl ? (
              <div>
                <iframe
                  src={driveEmbedUrl}
                  className="aspect-video w-full rounded-lg border"
                  allow="autoplay"
                  allowFullScreen
                />
                {t.videoDriveUrl && (
                  <a
                    href={t.videoDriveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-sm text-blue-600 hover:underline"
                  >
                    Open in Drive
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No video</p>
            )}
          </div>
        </div>

        {/* Transcript */}
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-medium text-gray-700">
            Transcript
          </h3>
          {t.transcript ? (
            <div className="rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
              {t.transcript}
            </div>
          ) : (
            <p className="text-sm text-gray-400">
              {t.status === "processing"
                ? "Transcript is being generated..."
                : "No transcript available"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
