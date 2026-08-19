'use client';

import { useLogoSrc } from '@/components/custom/logo-src-provider';

/**
 * Branded splash shown for the app's initial loading states (config fetch on first paint,
 * and the auth-resolving gate on /reports) — the "app opening" moments, as opposed to the
 * per-widget skeleton loaders used once the app is actually up and connected. Since the
 * page components that use this render as Client Components, Next.js still server-renders
 * their first pass (before the config-fetch effect fires), so this appears in the initial
 * HTML — no blank white flash before hydration.
 */
export function AppSplashScreen() {
  const logoSrc = useLogoSrc();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background" role="status" aria-live="polite">
      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- small, deploy-time logo; not worth next/image's runtime optimization pipeline here
        <img src={logoSrc} alt="" className="h-16 w-auto max-w-[240px] object-contain" />
      ) : (
        <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
          W
        </span>
      )}
      <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-muted border-t-primary" />
    </div>
  );
}
