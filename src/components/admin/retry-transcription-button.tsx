"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  testimonialId: string;
}

export default function RetryTranscriptionButton({ testimonialId }: Props) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `/api/testimonials/${testimonialId}/retranscribe`,
        { method: "POST" }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Retry failed");
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Retry failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Transcribing (up to a minute or two)..." : "Retry transcription"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
