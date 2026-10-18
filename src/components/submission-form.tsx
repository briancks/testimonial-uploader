"use client";

import { useState, FormEvent } from "react";
import WebcamCapture from "./webcam-capture";
import VideoRecorder from "./video-recorder";

const MAX_VIDEO_BYTES = 25 * 1024 * 1024;

type FormState = "form" | "uploading" | "processing" | "success" | "error";

function describeError(status: number, serverMsg: string): string {
  if (status === 0) {
    return "Network problem — your upload was interrupted. Please check your connection and try again.";
  }
  if (status === 413) {
    return "Your video is too large to upload. Please record a shorter clip and try again.";
  }
  if (status === 400) {
    return serverMsg || "Some required information is missing. Please check the form and try again.";
  }
  if (status === 401 || status === 403) {
    return "Permission denied. Please refresh the page and try again.";
  }
  if (status >= 500) {
    return "Something went wrong on our end. Please try again in a moment — if it keeps happening, let us know.";
  }
  return serverMsg || "Submission failed. Please try again.";
}

export default function SubmissionForm() {
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [headshot, setHeadshot] = useState<Blob | null>(null);
  const [video, setVideo] = useState<Blob | null>(null);
  const [formState, setFormState] = useState<FormState>("form");
  const [uploadPct, setUploadPct] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const isReady = !!(name.trim() && course.trim() && headshot && video);
  const isBusy = formState === "uploading" || formState === "processing";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isReady || !video || !headshot) return;

    if (video.size > MAX_VIDEO_BYTES) {
      setErrorMsg("Your video is too large to upload (max ~25MB). Please record a shorter clip.");
      setFormState("error");
      return;
    }

    setUploadPct(0);
    setErrorMsg("");
    setFormState("uploading");

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("course", course.trim());
    formData.append("headshot", headshot, "headshot.jpg");
    formData.append("video", video, "testimonial.webm");

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/testimonials");

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        setUploadPct(Math.min(99, Math.round((evt.loaded / evt.total) * 100)));
      }
    };

    xhr.upload.onload = () => {
      setUploadPct(100);
      setFormState("processing");
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setFormState("success");
        return;
      }
      let serverMsg = "";
      try {
        serverMsg = (JSON.parse(xhr.responseText) as { error?: string })?.error ?? "";
      } catch {
        // body wasn't JSON — leave serverMsg empty so the mapper picks a generic message
      }
      setErrorMsg(describeError(xhr.status, serverMsg));
      setFormState("error");
    };

    xhr.onerror = () => {
      setErrorMsg(describeError(0, ""));
      setFormState("error");
    };

    xhr.onabort = () => {
      setErrorMsg("Upload cancelled. Please try again.");
      setFormState("error");
    };

    xhr.send(formData);
  }

  if (formState === "success") {
    return (
      <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-5xl">&#10003;</div>
        <h2 className="mb-2 text-2xl font-bold text-green-700">Thank You!</h2>
        <p className="text-gray-600">
          Your testimonial has been submitted successfully. We appreciate you
          taking the time to share your experience!
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg space-y-6 rounded-xl bg-white p-8 shadow-lg"
    >
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Full Name
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isBusy}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          placeholder="Jane Doe"
        />
      </div>

      <div>
        <label
          htmlFor="course"
          className="block text-sm font-medium text-gray-700"
        >
          Is this testimonial for BSA, an event such as NINT or NIHB, a
          course, or Paths in Biblical Studies or Bart in general? (If a
          course, insert the course name)
        </label>
        <input
          id="course"
          type="text"
          required
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          disabled={isBusy}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          placeholder="New Insight into the Hebrew Bible"
        />
      </div>

      <WebcamCapture
        onCapture={setHeadshot}
        captured={headshot}
      />

      <VideoRecorder
        onRecorded={setVideo}
        recorded={video}
      />

      {formState === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {errorMsg}
          <button
            type="button"
            onClick={() => setFormState("form")}
            className="ml-2 font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      {isBusy && (
        <div className="space-y-2" aria-live="polite">
          <div className="flex items-center justify-between text-sm font-medium text-gray-700">
            <span>
              {formState === "uploading" ? "Uploading your video…" : "Generating transcript…"}
            </span>
            <span className="tabular-nums text-gray-500">
              {formState === "uploading" ? `${uploadPct}%` : "Processing"}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            {formState === "uploading" ? (
              <div
                className="h-full rounded-full bg-blue-600 transition-[width] duration-200 ease-out"
                style={{ width: `${uploadPct}%` }}
              />
            ) : (
              <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-600" />
            )}
          </div>
          <p className="text-xs text-gray-500">
            {formState === "uploading"
              ? "Hang tight — keep this tab open until the upload finishes."
              : "Your video uploaded. We're transcribing it now. This usually takes 10–30 seconds."}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={!isReady || isBusy}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isBusy ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {formState === "uploading" ? `Uploading ${uploadPct}%` : "Processing…"}
          </span>
        ) : (
          "Submit Testimonial"
        )}
      </button>

      <p className="text-center text-xs text-gray-400">
        By submitting this testimonial, you give Paths in Biblical Studies the
        right to use it and your name in our marketing materials.
      </p>
    </form>
  );
}
