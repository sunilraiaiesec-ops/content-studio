"use client";

import { useActionState } from "react";

import {
  testReviewNotificationAction,
  testWhatsAppAction,
} from "@/app/actions/notifications";

function TestButton({
  label,
  action,
  disabled,
  variant = "default",
}: {
  label: string;
  action: () => Promise<{ ok: boolean; message: string }>;
  disabled?: boolean;
  variant?: "default" | "primary";
}) {
  const [state, formAction, pending] = useActionState(
    async () => action(),
    null,
  );

  const buttonClass =
    variant === "primary"
      ? "rounded-lg border border-violet-300 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-800 disabled:opacity-50"
      : "rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-50";

  return (
    <div className="space-y-2">
      <form action={formAction}>
        <button type="submit" disabled={disabled || pending} className={buttonClass}>
          {pending ? "Sending…" : label}
        </button>
      </form>
      {state ? (
        <p className={`text-sm ${state.ok ? "text-emerald-700" : "text-red-700"}`}>
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

export function WhatsAppTestButtons({ configured }: { configured: boolean }) {
  return (
    <div className="mt-4 flex flex-wrap gap-6">
      <TestButton
        label="Send test ping"
        action={testWhatsAppAction}
        disabled={!configured}
      />
      <TestButton
        label="Send sample review alert"
        action={testReviewNotificationAction}
        disabled={!configured}
        variant="primary"
      />
    </div>
  );
}
