"use client";

import { useRef, useState, useCallback, useEffect } from "react";

const MAX_DURATION_SEC = 120; // 2 minutes

interface VideoRecorderProps {
  onRecorded: (blob: Blob) => void;
  recorded: Blob | null;
}

function getSupportedMimeType(): string {
  const types = [
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

function getExtension(mimeType: string): string {
  if (mimeType.startsWith("video/mp4")) return "mp4";
  return "webm";
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VideoRecorder({
  onRecorded,
  recorded,
}: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [state, setState] = useState<"idle" | "ready" | "recording" | "done">(
    "idle"
  );
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Attach stream to video element whenever state transitions to ready/recording
  useEffect(() => {
    if (
      videoRef.current &&
      streamRef.current &&
      (state === "ready" || state === "recording")
    ) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [state]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const openCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: true,
      });
      streamRef.current = stream;
      setState("ready");
    } catch {
      setError("Could not access camera/microphone. Please grant permission.");
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mimeType = getSupportedMimeType();
    // Keep the encoded 2-min clip comfortably under the Cloud Run 32 MiB
    // request body limit: 1.5 Mbps video + 96 kbps audio ≈ 24 MB at 120s.
    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: mimeType || undefined,
      videoBitsPerSecond: 1_500_000,
      audioBitsPerSecond: 96_000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: mimeType || "video/mp4",
      });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      onRecorded(blob);
      stopCamera();
      clearTimer();
      setState("done");
    };

    recorder.start(1000);
    mediaRecorderRef.current = recorder;

    setElapsed(0);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= MAX_DURATION_SEC) {
          mediaRecorderRef.current?.stop();
        }
        return next;
      });
    }, 1000);

    setState("recording");
  }, [onRecorded, stopCamera, clearTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const retake = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setElapsed(0);
    onRecorded(null as unknown as Blob);
    openCamera();
  }, [previewUrl, onRecorded, openCamera]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const remaining = MAX_DURATION_SEC - elapsed;
  const showLive = state === "ready" || state === "recording";
  const showPreview = state === "done" || (!!recorded && !!previewUrl);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Video Testimonial (max 2 minutes)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {state === "idle" && !recorded && (
        <button
          type="button"
          onClick={openCamera}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Open Camera
        </button>
      )}

      {/* Always render the live video so the ref is in the DOM, hide when not needed */}
      <div className={showLive ? "space-y-2" : "hidden"}>
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-w-lg rounded-lg border border-gray-300"
          />
          {state === "recording" && (
            <div className="absolute top-2 right-2 flex items-center gap-2 rounded-lg bg-black/70 px-3 py-1 text-white">
              <span className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
              <span className="font-mono text-sm">
                {formatTime(elapsed)} / {formatTime(MAX_DURATION_SEC)}
              </span>
            </div>
          )}
        </div>

        {state === "ready" && (
          <button
            type="button"
            onClick={startRecording}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Start Recording
          </button>
        )}

        {state === "recording" && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={stopRecording}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              Stop Recording
            </button>
            {remaining <= 30 && (
              <span className="text-sm font-medium text-red-600">
                {remaining}s remaining
              </span>
            )}
          </div>
        )}
      </div>

      {showPreview && previewUrl && (
        <div className="space-y-2">
          <video
            ref={previewRef}
            src={previewUrl}
            controls
            className="w-full max-w-lg rounded-lg border border-gray-300"
          />
          <button
            type="button"
            onClick={retake}
            className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Re-record
          </button>
        </div>
      )}
    </div>
  );
}
