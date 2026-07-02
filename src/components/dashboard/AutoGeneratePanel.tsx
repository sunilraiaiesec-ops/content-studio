"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Job = {
  id: string;
  status: string;
  format: string;
  errorMessage: string | null;
  createdAt: string;
  inspiration: { creator: string | null; url: string } | null;
  content: { id: string; title: string | null; status: string } | null;
};

type StatusPayload = {
  configured: boolean;
  publicUrls: boolean;
  soulId: string | null;
  needsReview: number;
  running: number;
  jobs: Job[];
};

export function AutoGeneratePanel() {
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/generation/status");
    if (res.ok) {
      setStatus(await res.json());
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 8000);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleGenerate(count: number) {
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/generation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Generation failed");
        return;
      }

      setMessage(
        `Done — ${data.completed} ready for review${data.failed ? `, ${data.failed} failed` : ""}.`,
      );
      await refresh();
    } catch {
      setError("Network error while generating. Check that the dev server is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Auto-generate (Higgsfield)</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Picks inspiration + her photos, generates content, lands in{" "}
            <strong>Needs Review</strong> — nothing posts without your approval.
          </p>
        </div>
        {status?.needsReview ? (
          <Link
            href="/content?status=NEEDS_REVIEW"
            className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-900"
          >
            {status.needsReview} awaiting review
          </Link>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span
          className={`rounded-full px-2 py-1 ${status?.configured ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}
        >
          API {status?.configured ? "connected" : "not configured"}
        </span>
        <span
          className={`rounded-full px-2 py-1 ${status?.publicUrls ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
        >
          {status?.publicUrls ? "Public media URLs" : "Localhost — text/image mode only"}
        </span>
        {status?.soulId ? (
          <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-800">Soul ID set</span>
        ) : null}
      </div>

      {!status?.configured ? (
        <p className="mt-4 text-sm text-red-700">
          Add <code>HIGGSFIELD_CREDENTIALS=KEY_ID:KEY_SECRET</code> to <code>.env</code>, then
          restart the dev server. Get keys from{" "}
          <a
            href="https://cloud.higgsfield.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            cloud.higgsfield.ai
          </a>
          .
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleGenerate(1)}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? "Generating… (2–5 min)" : "Generate 1 for review"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleGenerate(3)}
            className="rounded-lg border border-violet-300 bg-white px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50"
          >
            Generate 3 for review
          </button>
          <Link
            href="/settings/generation"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Generation settings
          </Link>
        </div>
      )}

      {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-4 text-sm text-red-700">{error}</p> : null}

      {status?.jobs?.length ? (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-zinc-700">Recent jobs</h3>
          <ul className="mt-2 space-y-2">
            {status.jobs.slice(0, 5).map((job) => (
              <li
                key={job.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white/80 px-3 py-2 text-xs"
              >
                <span>
                  {job.status} · {job.format}
                  {job.inspiration?.creator ? ` · inspired by ${job.inspiration.creator}` : ""}
                </span>
                {job.content ? (
                  <Link href="/content?status=NEEDS_REVIEW" className="text-violet-700 underline">
                    Review
                  </Link>
                ) : job.errorMessage ? (
                  <span className="text-red-600">{job.errorMessage.slice(0, 80)}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
