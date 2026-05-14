"use client";

import { useState, FormEvent } from "react";
import WebcamCapture from "./webcam-capture";
import VideoRecorder from "./video-recorder";

const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

type FormState = "form" | "submitting" | "success" | "error";

export default function SubmissionForm() {
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [headshot, setHeadshot] = useState<Blob | null>(null);
  const [video, setVideo] = useState<Blob | null>(null);
  const [formState, setFormState] = useState<FormState>("form");
  const [errorMsg, setErrorMsg] = useState("");

  const isReady = !!(name.trim() && course.trim() && headshot && video);
  const isSubmitting = formState === "submitting";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isReady) return;

    if (video && video.size > MAX_VIDEO_BYTES) {
      setErrorMsg("Video is too large (max 500MB). Please re-record a shorter clip.");
      setFormState("error");
      return;
    }

    setFormState("submitting");
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("course", course.trim());
      formData.append("headshot", headshot, "headshot.jpg");
      formData.append("video", video, "testimonial.webm");

      const res = await fetch("/api/testimonials", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed");
      }

      setFormState("success");
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : "Something went wrong"
      );
      setFormState("error");
    }
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
          disabled={formState === "submitting"}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          placeholder="Jane Doe"
        />
      </div>

      <div>
        <label
          htmlFor="course"
          className="block text-sm font-medium text-gray-700"
        >
          Is this testimonial for BSA, an event such as NINT or NIHB, or a
          course? (If a course, insert the course name)
        </label>
        <input
          id="course"
          type="text"
          required
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          disabled={formState === "submitting"}
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

      <button
        type="submit"
        disabled={!isReady || isSubmitting}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
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
            Uploading &amp; Processing...
          </span>
        ) : (
          "Submit Testimonial"
        )}
      </button>

      {isSubmitting && (
        <p className="text-center text-sm text-gray-500">
          Please wait while we upload your files and generate a transcript.
          This may take a minute.
        </p>
      )}

      <p className="text-center text-xs text-gray-400">
        By submitting this testimonial, you give Paths in Biblical Studies the
        right to use it and your name in our marketing materials.
      </p>
    </form>
  );
}
