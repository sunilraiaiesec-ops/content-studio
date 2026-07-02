import { loginAction } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-600">
          Content Studio
        </p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage AI-assisted Instagram &amp; TikTok content
        </p>

        <form action={loginAction} className="mt-8 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
          </div>
          {params.from ? (
            <p className="text-sm text-amber-700">Please sign in to continue.</p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Default seed credentials are in <code>.env.example</code>
        </p>
      </div>
    </div>
  );
}
