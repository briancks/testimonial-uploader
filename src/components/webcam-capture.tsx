"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface WebcamCaptureProps {
  onCapture: (blob: Blob) => void;
  captured: Blob | null;
}

export default function WebcamCapture({
  onCapture,
  captured,
}: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Attach stream to video element whenever either changes
  useEffect(() => {
    if (videoRef.current && streamRef.current && isStreaming) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isStreaming]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
        audio: false,
      });
      streamRef.current = stream;
      setIsStreaming(true);
    } catch {
      setError("Could not access camera. Please grant permission.");
    }
  }, []);

  const takePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
          onCapture(blob);
          stopCamera();
        }
      },
      "image/jpeg",
      0.9
    );
  }, [onCapture, stopCamera]);

  const retake = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onCapture(null as unknown as Blob);
    startCamera();
  }, [previewUrl, onCapture, startCamera]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(url);
      onCapture(file);
      stopCamera();
    },
    [previewUrl, onCapture, stopCamera]
  );

  const showLive = isStreaming && !previewUrl;
  const showPreview = !!previewUrl;

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Headshot Photo
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!isStreaming && !showPreview && !captured && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startCamera}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Open Camera
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Upload Photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {/* Always render the video element so the ref is available, hide when not needed */}
      <div className={showLive ? "space-y-2" : "hidden"}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full max-w-sm rounded-lg border border-gray-300"
        />
        <button
          type="button"
          onClick={takePhoto}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Take Photo
        </button>
      </div>

      {showPreview && (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl!}
            alt="Headshot preview"
            className="h-48 w-48 rounded-lg border border-gray-300 object-cover"
          />
          <button
            type="button"
            onClick={retake}
            className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            Retake
          </button>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
