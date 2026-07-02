import { saveSocialAccountAction } from "@/app/actions/studio";
import { PLATFORM_LABELS } from "@/lib/constants";
import { getDefaultTalent } from "@/lib/talent";
import { prisma } from "@/lib/prisma";

export default async function AccountsSettingsPage() {
  const talent = await getDefaultTalent();
  const accounts = await prisma.socialAccount.findMany({
    where: { talentId: talent.id },
    orderBy: { platform: "asc" },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Social Accounts</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Connect Instagram and TikTok for automated publishing (OAuth wiring in Phase 2).
        </p>
      </div>

      <form
        action={saveSocialAccountAction}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-zinc-900">Add or update account</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <select name="platform" required className="rounded-lg border border-zinc-300 px-3 py-2 text-sm">
            <option value="INSTAGRAM">Instagram</option>
            <option value="TIKTOK">TikTok</option>
          </select>
          <input
            name="handle"
            required
            placeholder="@handle"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <input
            name="externalId"
            placeholder="Platform user ID (optional)"
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm md:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" name="isActive" defaultChecked />
            Active for publishing
          </label>
        </div>
        <button type="submit" className="mt-4 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white">
          Save account
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {accounts.map((account) => (
          <article key={account.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-violet-700">{PLATFORM_LABELS[account.platform]}</p>
            <p className="mt-1 text-xl font-semibold text-zinc-900">@{account.handle}</p>
            <p className="mt-2 text-sm text-zinc-500">
              Status: {account.isActive ? "Active" : "Inactive"}
              {account.externalId ? ` · ID: ${account.externalId}` : ""}
            </p>
            <p className="mt-3 text-xs text-zinc-400">
              OAuth tokens will appear here after Meta/TikTok app review integration.
            </p>
          </article>
        ))}
      </div>

      {!accounts.length ? (
        <p className="text-sm text-zinc-500">No accounts configured yet.</p>
      ) : null}

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
        <h2 className="font-semibold text-zinc-900">Phase 2 publishing requirements</h2>
        <ul className="mt-3 list-inside list-disc space-y-1">
          <li>Instagram: Business/Creator account linked to a Facebook Page</li>
          <li>Instagram: Meta app with instagram_content_publish permission</li>
          <li>TikTok: Developer app audit for public Direct Post API</li>
          <li>Media must be hosted on publicly accessible HTTPS URLs for API pull</li>
        </ul>
      </div>
    </div>
  );
}
