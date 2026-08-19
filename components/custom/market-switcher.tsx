'use client';

import { Localize } from '@deriv-com/translations';
import { cn } from '@/lib/utils';

export type Market = 'rise-fall' | 'digits' | 'accumulators';

const MARKET_LABELS: Record<Market, React.ReactNode> = {
  'rise-fall': <Localize i18n_default_text="Rise/Fall" />,
  digits: <Localize i18n_default_text="Digits" />,
  accumulators: <Localize i18n_default_text="Accumulators" />,
};

const MARKETS: Market[] = ['rise-fall', 'digits', 'accumulators'];

export function MarketSwitcher({
  activeMarket,
  onMarketChange,
}: {
  activeMarket: Market;
  onMarketChange: (market: Market) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Market"
      className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5"
    >
      {MARKETS.map(market => {
        const isActive = market === activeMarket;
        return (
          <button
            key={market}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onMarketChange(market)}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors sm:px-3 sm:text-sm',
              isActive
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {MARKET_LABELS[market]}
          </button>
        );
      })}
    </div>
  );
}
