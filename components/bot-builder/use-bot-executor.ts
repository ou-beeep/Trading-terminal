'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useBuy, useProposal } from '@deriv/core';
import type { ProposalParams } from '@deriv/core';
import { useDerivWSContext } from '@/components/custom/deriv-ws-provider';
import type { BotStrategy } from './strategy';
import type { BotRunStats } from './bot-run-panel';

export function useBotExecutor(strategy: BotStrategy | null) {
  const { ws, isConnected, auth } = useDerivWSContext();
  const isAuthenticated = Boolean(auth.activeAccountId);
  const { proposal } = useProposal(ws, isConnected && isAuthenticated, strategy ? toProposalParams(strategy) : null);
  const { buyContract, isBuying, buyResult, buyError } = useBuy(ws, isConnected && isAuthenticated);
  const [stats, setStats] = useState<BotRunStats>({ runs: 0, wins: 0, losses: 0, totalStake: 0, totalPayout: 0, profit: 0 });
  const [lastContractId, setLastContractId] = useState<number | null>(null);
  const [contractStatus, setContractStatus] = useState('Idle');
  const countedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    const id = buyResult?.buy?.contract_id;
    if (id) {
      setLastContractId(Number(id));
      setContractStatus('Contract running');
    }
  }, [buyResult]);

  useEffect(() => {
    if (!ws || !isConnected || !isAuthenticated || !lastContractId) return;
    return ws.onMessage(data => {
      if (data.msg_type !== 'proposal_open_contract') return;
      const contract = data.proposal_open_contract as Record<string, unknown> | undefined;
      if (!contract || Number(contract.contract_id) !== lastContractId) return;

      const closed = Boolean(contract.is_sold) || Boolean(contract.is_expired) || contract.status !== 'open';
      if (!closed || countedRef.current.has(lastContractId)) return;

      countedRef.current.add(lastContractId);
      const stake = Number(contract.buy_price ?? strategy?.stake ?? 0);
      const payout = Number(contract.payout ?? 0);
      const profit = Number(contract.profit ?? payout - stake);
      const won = profit > 0;

      setStats(prev => ({
        runs: prev.runs + 1,
        wins: prev.wins + (won ? 1 : 0),
        losses: prev.losses + (won ? 0 : 1),
        totalStake: prev.totalStake + stake,
        totalPayout: prev.totalPayout + payout,
        profit: prev.profit + profit,
      }));
      setContractStatus(won ? 'Contract won' : 'Contract lost');
    });
  }, [ws, isConnected, isAuthenticated, lastContractId, strategy]);

  const execute = useCallback(async () => {
    if (!proposal) throw new Error('No proposal is available yet. Check the symbol, contract settings and account connection.');
    await buyContract(proposal);
  }, [proposal, buyContract]);

  const resetStats = useCallback(() => {
    countedRef.current.clear();
    setLastContractId(null);
    setStats({ runs: 0, wins: 0, losses: 0, totalStake: 0, totalPayout: 0, profit: 0 });
    setContractStatus('Idle');
  }, []);

  const status = useMemo(() => {
    if (!isConnected) return 'Disconnected';
    if (!isAuthenticated) return 'Login required';
    if (!strategy) return 'Build a strategy';
    if (!proposal) return 'Waiting for proposal';
    if (isBuying) return 'Buying…';
    if (lastContractId) return contractStatus;
    return 'Ready';
  }, [isConnected, isAuthenticated, strategy, proposal, isBuying, lastContractId, contractStatus]);

  return { proposal, execute, isBuying, buyResult, buyError, status, stats, resetStats, lastContractId };
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
