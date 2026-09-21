'use client';

import { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import { registerTradingBlocks } from './trading-blocks';
import { parseWorkspaceStrategy, validateStrategy, type BotStrategy } from './strategy';
import { BotRunPanel } from './bot-run-panel';
import { useBotRunner } from './use-bot-runner';

const STORAGE_KEY = 'trading-terminal-bot-workspace';

const TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    { kind: 'category', name: 'Trading', colour: '#0f766e', contents: [
      { kind: 'block', type: 'deriv_trade_definition' }, { kind: 'block', type: 'deriv_set_symbol' },
      { kind: 'block', type: 'deriv_set_stake' }, { kind: 'block', type: 'deriv_set_duration' },
      { kind: 'block', type: 'deriv_rise_fall' }, { kind: 'block', type: 'deriv_digit_contract' },
      { kind: 'block', type: 'deriv_purchase' }, { kind: 'block', type: 'deriv_condition' },
    ] },
    { kind: 'category', name: 'Logic', colour: '#5b80a5', contents: [
      { kind: 'block', type: 'controls_if' }, { kind: 'block', type: 'logic_compare' }, { kind: 'block', type: 'logic_boolean' },
    ] },
    { kind: 'category', name: 'Loops', colour: '#5ba55b', contents: [
      { kind: 'block', type: 'controls_repeat_ext' }, { kind: 'block', type: 'controls_whileUntil' },
    ] },
    { kind: 'category', name: 'Math', colour: '#5b67a5', contents: [
      { kind: 'block', type: 'math_number' }, { kind: 'block', type: 'math_arithmetic' },
    ] },
    { kind: 'category', name: 'Text', colour: '#745ba5', contents: [
      { kind: 'block', type: 'text' }, { kind: 'block', type: 'text_print' },
    ] },
  ],
};

export default function BotBuilderShell() {
  const hostRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const [message, setMessage] = useState('Build a strategy using Trading blocks.');
  const [saved, setSaved] = useState(false);
  const [strategy, setStrategy] = useState<BotStrategy | null>(null);
  const [validated, setValidated] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);
  const runner = useBotRunner(strategy);

  useEffect(() => {
    if (!hostRef.current || workspaceRef.current) return;
    registerTradingBlocks();
    const workspace = Blockly.inject(hostRef.current, {
      toolbox: TOOLBOX, trashcan: true,
      grid: { spacing: 20, length: 3, colour: '#d1d5db', snap: true },
      zoom: { controls: true, wheel: true, startScale: 0.95, maxScale: 1.5, minScale: 0.5 },
    });
    workspaceRef.current = workspace;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try { Blockly.serialization.workspaces.load(JSON.parse(raw), workspace); setMessage('Saved strategy restored. Validate it before running.'); }
      catch { localStorage.removeItem(STORAGE_KEY); }
    }
    const resize = () => Blockly.svgResize(workspace);
    window.addEventListener('resize', resize); resize();
    return () => { window.removeEventListener('resize', resize); workspace.dispose(); workspaceRef.current = null; };
  }, []);

  const save = () => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Blockly.serialization.workspaces.save(workspace)));
    setSaved(true); setMessage('Strategy saved locally.');
    window.setTimeout(() => setSaved(false), 1500);
  };

  const load = () => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { setMessage('No saved strategy found.'); return; }
    try { workspace.clear(); Blockly.serialization.workspaces.load(JSON.parse(raw), workspace); setStrategy(null); setValidated(false); setMessage('Strategy loaded. Validate it before running.'); }
    catch { setMessage('Saved strategy could not be loaded.'); }
  };

  const reset = () => {
    runner.stop();
    workspaceRef.current?.clear();
    localStorage.removeItem(STORAGE_KEY);
    setStrategy(null);
    setValidated(false);
    setMessage('Workspace reset.');
  };

  const clear = () => { runner.stop(); workspaceRef.current?.clear(); setStrategy(null); setValidated(false); setMessage('Workspace cleared.'); };

  const validate = () => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const parsed = parseWorkspaceStrategy(workspace);
    const result = validateStrategy(parsed);
    if (!result.valid) { setStrategy(null); setValidated(false); setMessage(result.errors.join(' ')); return; }
    const hasPurchase = workspace.getAllBlocks(false).some(b => b.type === 'deriv_purchase');
    if (!hasPurchase) { setStrategy(null); setValidated(false); setMessage('Purchase block is missing.'); return; }
    setStrategy(parsed);
    setValidated(true);
    setMessage('Strategy validated. Review the stake and contract before running.');
  };

  const requestStart = () => {
    if (!validated || !strategy) {
      setMessage('Validate the strategy before starting the bot.');
      return;
    }
    setConfirmStart(true);
  };

  const confirmAndStart = () => {
    setConfirmStart(false);
    runner.start();
    setMessage('Bot started. It will purchase the validated strategy repeatedly until stopped.');
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">Bot Builder</h1>
          <p className="text-xs text-muted-foreground">WinIndex-inspired visual Deriv strategy builder</p>
          <p className="mt-1 text-xs text-muted-foreground">Connection: {runner.status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} disabled={runner.running} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">Load</button>
          <button type="button" onClick={save} disabled={runner.running} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">{saved ? 'Saved' : 'Save'}</button>
          <button type="button" onClick={reset} className="rounded-md border px-3 py-2 text-sm">Reset</button>
          <button type="button" onClick={clear} className="rounded-md border px-3 py-2 text-sm">Clear</button>
          <button type="button" onClick={validate} disabled={runner.running} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">Validate</button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div ref={hostRef} className="h-[calc(100dvh-116px)] min-h-[520px] flex-1 overflow-hidden" />
        <BotRunPanel
          strategy={strategy}
          running={runner.running}
          status={runner.runnerStatus}
          stats={runner.stats}
          onStart={requestStart}
          onStop={() => { runner.stop(); setMessage('Bot stopped.'); }}
        />
      </main>

      <div className="border-t bg-card px-4 py-2 text-xs">
        <span className="text-muted-foreground">{message}</span>
        {runner.buyResult && <span className="ml-3">Contract: {String(runner.buyResult.buy?.contract_id ?? 'submitted')}</span>}
        {runner.buyError && <span className="ml-3 text-destructive">{runner.buyError}</span>}
        <span className="ml-3 text-amber-600">Use a demo account first. This bot sends real purchase requests on a live account.</span>
      </div>

      {confirmStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-6 shadow-xl">
            <h2 className="text-lg font-semibold">Start Bot?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The bot will repeatedly purchase the validated contract strategy until you press Stop. Check the selected Deriv account, stake, symbol and contract type before continuing.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmStart(false)} className="rounded-md border px-4 py-2 text-sm">Cancel</button>
              <button type="button" onClick={confirmAndStart} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Start Bot</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
