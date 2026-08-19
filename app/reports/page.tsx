'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Localize } from '@deriv-com/translations';
import { useRiseFallTrading } from '../../hooks/use-rise-fall-trading';
import { useDigitsTrading } from '../../hooks/use-digits-trading';
import { useAccumulatorTrading } from '../../hooks/use-accumulator-trading';
import { useDerivWSContext } from '@/components/custom/deriv-ws-provider';
import { useLogoSrc } from '@/components/custom/logo-src-provider';
import { useAppTranslations } from '@/components/custom/i18n-provider';
import { Header } from '@/components/custom/header';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { BotBuilderLink } from '@/components/custom/bot-builder-link';
import { AppSplashScreen } from '@/components/custom/app-splash-screen';
import { Footer } from '@/components/custom/footer';
import Link from 'next/link';
import { PositionsTable } from '@/components/custom/positions-table';
import type { Market } from '@/components/custom/market-switcher';

const DIGIT_CONTRACT_TYPES = ['DIGITMATCH', 'DIGITDIFF', 'DIGITOVER', 'DIGITUNDER', 'DIGITEVEN', 'DIGITODD'] as const;
const ACCUMULATOR_CONTRACT_TYPES = ['ACCU'] as const;

function getRiseFallContractLabels(localize: (text: string) => string): Record<string, string> {
  return {
    CALL: localize('Rise'),
    PUT: localize('Fall'),
    CALLE: localize('Rise (Equal)'),
    PUTE: localize('Fall (Equal)'),
  };
}

function getDigitContractLabels(localize: (text: string) => string): Record<string, string> {
  return {
    DIGITMATCH: localize('Digit Match'),
    DIGITDIFF: localize('Digit Differs'),
    DIGITOVER: localize('Digit Over'),
    DIGITUNDER: localize('Digit Under'),
    DIGITEVEN: localize('Digit Even'),
    DIGITODD: localize('Digit Odd'),
  };
}

function getAccumulatorContractLabels(localize: (text: string) => string): Record<string, string> {
  return { ACCU: localize('Accumulator') };
}

function isValidMarket(value: string | null): value is Market {
  return value === 'rise-fall' || value === 'digits' || value === 'accumulators';
}

function ReportsPageInner() {
  const logoSrc = useLogoSrc();
  const router = useRouter();
  const searchParams = useSearchParams();
  const market: Market = isValidMarket(searchParams.get('market')) ? (searchParams.get('market') as Market) : 'rise-fall';
  const { localize } = useAppTranslations();
  const { ws, isConnected, isExhausted, auth } = useDerivWSContext();
  const { authState, accounts, activeAccount, login, signUp, logout, switchAccount } = auth;

  // All three trading hooks are called unconditionally (rules of hooks) — only the
  // one matching `market` is actually used below. Each hook's own subscriptions
  // are gated internally on `isAuthenticated`/`isConnected`, so the two unused
  // hooks stay idle rather than opening extra WS subscriptions.
  const riseFallTrading = useRiseFallTrading({ ws, isConnected, isExhausted, isAuthenticated: !!auth.wsUrl, onAuthWSFailed: logout });
  const digitsTrading = useDigitsTrading({ ws, isConnected, isExhausted, isAuthenticated: !!auth.wsUrl, onAuthWSFailed: logout });
  const accumulatorTrading = useAccumulatorTrading({ ws, isConnected, isExhausted, isAuthenticated: !!auth.wsUrl, onAuthWSFailed: logout });

  const { trading, contractTypeLabels, allowedContractTypes } =
    market === 'digits'
      ? { trading: digitsTrading, contractTypeLabels: getDigitContractLabels(localize), allowedContractTypes: DIGIT_CONTRACT_TYPES as readonly string[] }
      : market === 'accumulators'
        ? { trading: accumulatorTrading, contractTypeLabels: getAccumulatorContractLabels(localize), allowedContractTypes: ACCUMULATOR_CONTRACT_TYPES as readonly string[] }
        : {
            trading: riseFallTrading,
            contractTypeLabels: getRiseFallContractLabels(localize),
            allowedContractTypes: Object.keys(getRiseFallContractLabels(localize)),
          };

  useEffect(() => {
    if (authState === 'unauthenticated' || authState === 'error') {
      router.replace('/');
    }
  }, [authState, router]);

  if (authState !== 'authenticated') {
    return <AppSplashScreen />;
  }

  return (
    <main data-market={market} className="flex flex-col bg-background max-lg:h-dvh max-lg:overflow-y-auto lg:min-h-dvh">
      <Header
        authState={authState}
        accounts={accounts}
        activeAccount={activeAccount}
        onLogin={login}
        onSignUp={signUp}
        onLogout={logout}
        onSwitchAccount={switchAccount}
        logoSrc={logoSrc}
        actions={
          <>
            <BotBuilderLink />
            <ThemeToggle />
          </>
        }
      />

      {/* Spacer to push content below fixed header — authenticated users have a taller header */}
      <div className="h-[76px] shrink-0" />

      <div className="flex-1 w-full max-w-7xl mx-auto px-3 py-4 sm:px-4 sm:py-6 pb-14">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
          <span className="text-base leading-none">←</span>
          <span>
            <Localize i18n_default_text="Back" />
          </span>
        </Link>
        <PositionsTable
          openPositions={trading.openPositions.filter(p => allowedContractTypes.includes(p.contract_type))}
          closedPositions={trading.closedPositions.filter(p => allowedContractTypes.includes(p.contract_type))}
          onSell={trading.sellContract}
          sellingId={trading.sellingId}
          sellError={trading.sellError}
          onClearSellError={trading.clearSellError}
          contractTypeLabels={contractTypeLabels}
          className="mt-0"
        />
      </div>

      {/* Fixed footer */}
      <div className="fixed bottom-0 left-0 right-0 py-2 text-center bg-background/80 backdrop-blur-sm">
        <Footer />
      </div>
    </main>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<AppSplashScreen />}>
      <ReportsPageInner />
    </Suspense>
  );
}
