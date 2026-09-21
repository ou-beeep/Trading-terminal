'use client';

import type { BotStrategy } from './strategy';

export interface BotRunStats {
  runs: number;
  wins: number;
  losses: number;
  totalStake: number;
  totalPayout: number;
  profit: number;
}

interface BotRunPanelProps {
  strategy: BotStrategy | null;
  running: boolean;
  status: string;
  stats: BotRunStats;
  onStart: () => void;
  onStop: () => void;
}

export function BotRunPanel({ strategy, running, status, stats, onStart, onStop }: BotRunPanelProps) {
  const cards = [
    ['Runs', String(stats.runs)],
    ['Wins', String(stats.wins)],
    ['Losses', String(stats.losses)],
    ['Stake', '$' + stats.totalStake.toFixed(2)],
    ['Payout', '$' + stats.totalPayout.toFixed(2)],
    ['P/L', '$' + stats.profit.toFixed(2)],
  ];

  return (
    <aside className="w-full border-l bg-card p-4 lg:w-80">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">Bot Runner</h2>
        <span className="rounded-full border px-2 py-1 text-xs">{running ? 'Running' : 'Stopped'}</span>
      </div>
      <div className="mb-4 rounded-lg border p-3">
        <div className="text-xs text-muted-foreground">Status</div>
        <div className="mt-1 text-sm font-medium">{status}</div>
      </div>
      {strategy && (
        <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border p-2"><span className="text-muted-foreground">Symbol</span><div>{strategy.symbol}</div></div>
          <div className="rounded border p-2"><span className="text-muted-foreground">Contract</span><div>{strategy.contractType}</div></div>
          <div className="rounded border p-2"><span className="text-muted-foreground">Stake</span><div>{strategy.stake.toFixed(2)}</div></div>
          <div className="rounded border p-2"><span className="text-muted-foreground">Duration</span><div>{strategy.duration} ticks</div></div>
        </div>
      )}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-lg border p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 font-semibold">{value}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onStart} disabled={running || !strategy} className="flex-1 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">Start Bot</button>
        <button type="button" onClick={onStop} disabled={!running} className="flex-1 rounded-md border px-3 py-2 text-sm disabled:opacity-50">Stop</button>
      </div>
    </aside>
  );
}
