'use client';

import { useCallback, useMemo } from 'react';
import { useBuy, useProposal } from '@deriv/core';
import type { ProposalParams } from '@deriv/core';
import { useDerivWSContext } from '@/components/custom/deriv-ws-provider';
import type { BotStrategy } from './strategy';

export function useBotExecutor(strategy: BotStrategy | null) {
  const { ws, isConnected, auth } = useDerivWSContext();
  const isAuthenticated = Boolean(auth.activeAccountId);
  const { proposal } = useProposal(ws, isConnected && isAuthenticated, strategy ? toProposalParams(strategy) : null);
  const { buyContract, isBuying, buyResult, buyError } = useBuy(ws, isConnected && isAuthenticated);

  const execute = useCallback(async () => {
    if (!proposal) throw new Error('No proposal is available yet. Check the symbol, contract settings and account connection.');
    await buyContract(proposal);
  }, [proposal, buyContract]);

  const status = useMemo(() => {
    if (!isConnected) return 'Disconnected';
    if (!isAuthenticated) return 'Login required';
    if (!strategy) return 'Build a strategy';
    if (!proposal) return 'Waiting for proposal';
    if (isBuying) return 'Buying…';
    return 'Ready';
  }, [isConnected, isAuthenticated, strategy, proposal, isBuying]);

  return { proposal, execute, isBuying, buyResult, buyError, status };
}

function toProposalParams(strategy: BotStrategy): ProposalParams {
  const needsBarrier = ['DIGITMATCH','DIGITDIFF','DIGITOVER','DIGITUNDER'].includes(strategy.contractType);
  return {
    contractType: strategy.contractType,
    symbol: strategy.symbol,
    amount: strategy.stake,
    basis: 'stake',
    currency: 'USD',
    duration: strategy.duration,
    durationUnit: 't',
    ...(needsBarrier && strategy.barrier !== undefined ? { barrier: strategy.barrier } : {}),
  };
}
