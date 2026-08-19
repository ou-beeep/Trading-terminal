'use client';

import { ExternalLink } from 'lucide-react';
import { Localize } from '@deriv-com/translations';
import { Button } from '@/components/ui/button';

/**
 * Cross-link to the companion bot builder app (winindex-main — a separate Rsbuild/React
 * SPA, not part of this Next.js build). Configure NEXT_PUBLIC_BOT_BUILDER_URL to point at
 * wherever that app is deployed; defaults to a same-origin /bot path (the common setup when
 * both apps are hosted under one domain, e.g. via reverse-proxy path routing). Renders
 * nothing if explicitly disabled via NEXT_PUBLIC_BOT_BUILDER_URL=none.
 */
export function BotBuilderLink() {
  const url = process.env.NEXT_PUBLIC_BOT_BUILDER_URL?.trim();
  if (url === 'none') return null;

  return (
    <Button variant="ghost" size="sm" asChild>
      <a href={url || '/bot'} className="gap-1.5">
        <Localize i18n_default_text="Bot Builder" />
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </Button>
  );
}
