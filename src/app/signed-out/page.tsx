export default function SignedOutPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[var(--gcc-navy-raised)] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 70% 20%, var(--gcc-glow), transparent 55%), radial-gradient(ellipse 50% 40% at 10% 80%, rgba(11,22,42,0.9), transparent 50%), linear-gradient(160deg, #0b162a 0%, #023059 55%, #023059 100%)",
        }}
      />
      <main className="relative z-10 flex flex-1 flex-col justify-center px-6 pb-24 pt-10 sm:px-10 lg:px-16">
        <p className="font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          GeekSocial
        </p>
        <h1 className="mt-6 max-w-xl text-xl font-medium leading-snug text-white/90 sm:text-2xl">
          You are signed out.
        </h1>
        <div className="mt-10 flex flex-wrap gap-3">
          {/* Plain <a>: a Next Link soft navigation fetches /api/auth/start and breaks the OAuth redirect. */}
          <a
            href="/api/auth/start"
            className="inline-flex items-center justify-center rounded-md bg-[var(--gcc-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--gcc-accent-deep)]"
          >
            Sign in
          </a>
        </div>
      </main>
    </div>
  );
}
