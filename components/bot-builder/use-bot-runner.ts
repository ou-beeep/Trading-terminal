'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useBotExecutor } from './use-bot-executor';
import type { BotStrategy } from './strategy';

const NEXT_RUN_DELAY_MS = 350;

export function useBotRunner(strategy: BotStrategy | null) {
  const executor = useBotExecutor(strategy);
  const [running, setRunning] = useState(false);
  const [runnerStatus, setRunnerStatus] = useState('Stopped');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cycleRef = useRef(0);
  const runningRef = useRef(false);
  const activeContractRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    cycleRef.current += 1;
    activeContractRef.current = null;
    clearTimer();
    setRunnerStatus('Stopped');
  }, [clearTimer]);

  const start = useCallback(() => {
    if (!strategy) {
      setRunnerStatus('Build and validate a strategy first');
      return;
    }
    clearTimer();
    cycleRef.current += 1;
    runningRef.current = true;
    activeContractRef.current = null;
    executor.resetStats();
    setRunning(true);
    setRunnerStatus('Starting…');
  }, [strategy, clearTimer, executor.resetStats]);

  useEffect(() => {
    if (!running) return;
    if (!strategy) {
      stop();
      return;
    }

    const cycle = cycleRef.current;
    if (executor.isBuying) {
      setRunnerStatus('Buying contract…');
      return;
    }
    if (activeContractRef.current) {
      setRunnerStatus('Monitoring contract…');
      return;
    }
    if (executor.lastContractId) {
      activeContractRef.current = executor.lastContractId;
      setRunnerStatus('Monitoring contract…');
      return;
    }
    if (!executor.proposal) {
      setRunnerStatus('Waiting for proposal…');
      return;
    }

    let cancelled = false;
    const buy = async () => {
      setRunnerStatus('Purchasing…');
      try {
        await executor.execute();
        if (!cancelled && runningRef.current && cycleRef.current === cycle) {
          setRunnerStatus('Contract purchased');
        }
      } catch (error) {
        if (!cancelled && runningRef.current && cycleRef.current === cycle) {
          setRunnerStatus(error instanceof Error ? error.message : 'Purchase failed');
          stop();
        }
      }
    };
    buy();
    return () => { cancelled = true; };
  }, [running, strategy, executor.isBuying, executor.lastContractId, executor.proposal, executor.execute, stop]);

  useEffect(() => {
    if (!running || !executor.lastContractId) return;
    activeContractRef.current = executor.lastContractId;
  }, [running, executor.lastContractId]);

  useEffect(() => {
    if (!running || !executor.lastContractId) return;
    if (executor.status !== 'Contract won' && executor.status !== 'Contract lost') return;

    activeContractRef.current = null;
    setRunnerStatus(executor.status + '. Preparing next trade…');
    const cycle = cycleRef.current;
    timerRef.current = setTimeout(() => {
      if (runningRef.current && cycleRef.current === cycle) {
        setRunnerStatus('Preparing next trade…');
        setRunning(true);
      }
    }, NEXT_RUN_DELAY_MS);
    return clearTimer;
  }, [running, executor.lastContractId, executor.status, clearTimer]);

  useEffect(() => () => {
    runningRef.current = false;
    clearTimer();
  }, [clearTimer]);

  return { ...executor, running, runnerStatus, start, stop };
}
