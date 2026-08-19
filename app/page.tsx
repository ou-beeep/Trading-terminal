'use client';

import { useEffect, useState } from 'react';
import { LiveRiseFall } from '../components/live-rise-fall';
import { LiveDigits } from '../components/live-digits';
import { LiveAccumulator } from '../components/live-accumulator';
import { MarketSwitcher, type Market } from '../components/custom/market-switcher';
import { BotBuilderLink } from '../components/custom/bot-builder-link';
import { AppSplashScreen } from '../components/custom/app-splash-screen';
import { normalizeAppConfig as normalizeRiseFallConfig, type RiseFallAppConfig } from '../lib/app-config-rise-fall';
import { normalizeAppConfig as normalizeDigitsConfig, type DigitsAppConfig } from '../lib/app-config-digits';
import { normalizeAppConfig as normalizeAccumulatorsConfig, type AccumulatorsAppConfig } from '../lib/app-config-accumulators';

/**
 * Deployed app. Merges the three single-market apps (Rise/Fall, Digits, Accumulators)
 * behind one market switcher in the header. Each market keeps its own no-code config
 * (public/app-config-<market>.json), its own trading hook, and its own brand accent
 * color (see the [data-market] rules in globals.css) — only the header/shell is shared.
 * Only the active market's Live* component is mounted, so switching tabs correctly
 * tears down the previous market's WebSocket subscriptions (ticks/proposal) instead
 * of running three in parallel.
 */
export default function TradingTerminalPage() {
  const [market, setMarket] = useState<Market>('rise-fall');

  const [riseFallConfig, setRiseFallConfig] = useState<RiseFallAppConfig | null | undefined>(undefined);
  const [digitsConfig, setDigitsConfig] = useState<DigitsAppConfig | null | undefined>(undefined);
  const [accumulatorsConfig, setAccumulatorsConfig] = useState<AccumulatorsAppConfig | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

    const load = <T,>(file: string, normalize: (v: unknown) => T, setter: (v: T | null) => void) => {
      fetch(`${base}/${file}`)
        .then(response => (response.ok ? response.json() : null))
        .then(data => {
          if (!cancelled) setter(data ? normalize(data) : null);
        })
        .catch(() => {
          if (!cancelled) setter(null);
        });
    };

    load('app-config-rise-fall.json', normalizeRiseFallConfig, setRiseFallConfig);
    load('app-config-digits.json', normalizeDigitsConfig, setDigitsConfig);
    load('app-config-accumulators.json', normalizeAccumulatorsConfig, setAccumulatorsConfig);

    return () => {
      cancelled = true;
    };
  }, []);

  const switcher = (
    <>
      <BotBuilderLink />
      <MarketSwitcher activeMarket={market} onMarketChange={setMarket} />
    </>
  );

  // Each config starts as `undefined` (not yet fetched) then resolves to the parsed
  // config or `null` (no override — render with in-app defaults). We only block
  // render on the *active* market's config so switching tabs doesn't need to wait
  // on markets the user hasn't looked at yet.
  const activeConfigLoading =
    (market === 'rise-fall' && riseFallConfig === undefined) ||
    (market === 'digits' && digitsConfig === undefined) ||
    (market === 'accumulators' && accumulatorsConfig === undefined);

  return (
    <div data-market={market} className="min-h-dvh bg-background">
      {activeConfigLoading ? (
        <AppSplashScreen />
      ) : (
        <>
          {market === 'rise-fall' && (
            <LiveRiseFall appConfig={riseFallConfig ?? undefined} headerActions={switcher} />
          )}
          {market === 'digits' && <LiveDigits appConfig={digitsConfig ?? undefined} headerActions={switcher} />}
          {market === 'accumulators' && (
            <LiveAccumulator appConfig={accumulatorsConfig ?? undefined} headerActions={switcher} />
          )}
        </>
      )}
    </div>
  );
}
