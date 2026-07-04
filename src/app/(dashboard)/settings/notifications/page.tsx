import {
  saveWhatsAppSettingsAction,
} from "@/app/actions/notifications";
import { WhatsAppTestButtons } from "@/components/settings/WhatsAppTestButtons";
import { isWhatsAppConfigured } from "@/lib/notifications/whatsapp";
import { getDefaultTalent } from "@/lib/talent";

export default async function NotificationsSettingsPage() {
  const talent = await getDefaultTalent();
  const configured = isWhatsAppConfigured();
  const templateName = process.env.WHATSAPP_REVIEW_TEMPLATE_NAME?.trim();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">WhatsApp Notifications</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Get an automatic WhatsApp message when new AI-generated content is ready for your review.
        </p>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-900">Connection status</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">WhatsApp Cloud API</dt>
            <dd className={configured ? "text-emerald-700" : "text-red-700"}>
              {configured
                ? "Configured in .env"
                : "Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-500">Message template</dt>
            <dd className="text-zinc-700">
              {templateName
                ? `${templateName} (recommended for proactive messages)`
                : "Plain text — works within 24h of last inbound message, or set WHATSAPP_REVIEW_TEMPLATE_NAME"}
            </dd>
          </div>
        </dl>
      </div>

      <form
        action={saveWhatsAppSettingsAction}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-zinc-900">Your WhatsApp number</h2>
        <p className="mt-1 text-sm text-zinc-500">
          E.164 format without + (e.g. 15551234567). You will receive a message after each
          auto-generation completes.
        </p>
        <input
          name="whatsappPhone"
          defaultValue={talent.whatsappPhone ?? ""}
          placeholder="15551234567"
          className="mt-4 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <label className="mt-4 flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="whatsappNotifyOnReview"
            defaultChecked={talent.whatsappNotifyOnReview}
          />
          Send automatic message when content needs review
        </label>
        <button
          type="submit"
          className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
        >
          Save notification settings
        </button>
      </form>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-zinc-900">Test messages</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Verify your setup before running auto-generation or cron jobs.
        </p>
        <WhatsAppTestButtons configured={configured} />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
        <h2 className="font-semibold text-zinc-900">Setup (Meta WhatsApp Cloud API)</h2>
        <ol className="mt-3 list-inside list-decimal space-y-2">
          <li>
            Create a Meta app with WhatsApp product at{" "}
            <a
              href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
              className="text-violet-700 underline"
              target="_blank"
              rel="noreferrer"
            >
              Meta for Developers
            </a>
            .
          </li>
          <li>
            In <strong>WhatsApp → API Setup</strong>, copy the access token and Phone Number ID
            into <code className="rounded bg-zinc-200 px-1">.env</code>. Add your phone as a test
            recipient while the app is in Development mode.
          </li>
          <li>
            Restart the dev server after changing <code className="rounded bg-zinc-200 px-1">.env</code>.
          </li>
          <li>
            <strong>Quick dev test:</strong> message your business WhatsApp number from your phone,
            then use <strong>Send test ping</strong> below (plain text works for 24h after your last
            inbound message).
          </li>
          <li>
            <strong>Production / cron:</strong> create an approved template in WhatsApp Manager:
            name <code className="rounded bg-zinc-200 px-1">content_review_ready</code>, body{" "}
            <code className="rounded bg-zinc-200 px-1">
              Hi! New content for {"{{1}}"} is ready: {"{{2}}"}. Review: {"{{3}}"}
            </code>
            , then set <code className="rounded bg-zinc-200 px-1">WHATSAPP_REVIEW_TEMPLATE_NAME</code>.
          </li>
          <li>Add your personal WhatsApp number above and save.</li>
        </ol>
        <p className="mt-4 text-xs text-zinc-500">
          Messages are sent automatically when Higgsfield generation finishes (dashboard Generate or{" "}
          <code className="rounded bg-zinc-200 px-1">POST /api/cron/generate</code>).
        </p>
      </div>
    </div>
  );
}
