'use client';

import { Bot } from 'lucide-react';
import { Localize } from '@deriv-com/translations';
import { Button } from '@/components/ui/button';

/**
 * Internal Bot Builder route.
 *
 * The previous implementation linked to a separate WinIndex deployment. The
 * integration branch now hosts the builder inside this Next.js application.
 */
export function BotBuilderLink() {
  return (
    <Button variant="ghost" size="sm" asChild>
      <a href="/bot-builder" className="gap-1.5">
        <Localize i18n_default_text="Bot Builder" />
        <Bot className="h-3.5 w-3.5" />
      </a>
    </Button>
  );
}
