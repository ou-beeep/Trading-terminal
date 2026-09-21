'use client';

import { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import { registerTradingBlocks } from './trading-blocks';
import { parseWorkspaceStrategy, validateStrategy, type BotStrategy } from './strategy';
import { useBotExecutor } from './use-bot-executor';

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
  const [isRunning, setIsRunning] = useState(false);
  const { execute, proposal, buyResult, buyError, status } = useBotExecutor(strategy);

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
    try { workspace.clear(); Blockly.serialization.workspaces.load(JSON.parse(raw), workspace); setStrategy(null); setMessage('Strategy loaded. Validate it before running.'); }
    catch { setMessage('Saved strategy could not be loaded.'); }
  };

  const reset = () => {
    workspaceRef.current?.clear();
    localStorage.removeItem(STORAGE_KEY);
    setStrategy(null);
    setMessage('Workspace reset.');
  };

  const clear = () => { workspaceRef.current?.clear(); setStrategy(null); setMessage('Workspace cleared.'); };

  const validate = () => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const parsed = parseWorkspaceStrategy(workspace);
    const result = validateStrategy(parsed);
    if (!result.valid) { setStrategy(null); setMessage(result.errors.join(' ')); return; }
    const hasPurchase = workspace.getAllBlocks(false).some(b => b.type === 'deriv_purchase');
    if (!hasPurchase) { setStrategy(null); setMessage('Purchase block is missing.'); return; }
    setStrategy(parsed);
    setMessage('Strategy validated. Review the stake and contract before running.');
  };

  const run = async () => {
    if (!strategy) { validate(); return; }
    setIsRunning(true);
    try {
      await execute();
      setMessage('Purchase request sent successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Purchase failed.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">Bot Builder</h1>
          <p className="text-xs text-muted-foreground">WinIndex-inspired visual Deriv strategy builder</p>
          <p className="mt-1 text-xs text-muted-foreground">Connection: {status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} className="rounded-md border px-3 py-2 text-sm">Load</button>
          <button type="button" onClick={save} className="rounded-md border px-3 py-2 text-sm">{saved ? 'Saved' : 'Save'}</button>
          <button type="button" onClick={reset} className="rounded-md border px-3 py-2 text-sm">Reset</button>
          <button type="button" onClick={clear} className="rounded-md border px-3 py-2 text-sm">Clear</button>
          <button type="button" onClick={validate} className="rounded-md border px-3 py-2 text-sm">Validate</button>
          <button type="button" onClick={run} disabled={!strategy || isRunning || !proposal} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50">
            {isRunning ? 'Running…' : 'Run Once'}
          </button>
        </div>
      </header>
      <main className="relative min-h-0 flex-1">
        <div ref={hostRef} className="h-[calc(100dvh-116px)] w-full overflow-hidden" />
      </main>
      <div className="border-t bg-card px-4 py-2 text-xs">
        <span className="text-muted-foreground">{message}</span>
        {buyResult && <span className="ml-3">Contract: {String(buyResult.buy?.contract_id ?? 'submitted')}</span>}
        {buyError && <span className="ml-3 text-destructive">{buyError}</span>}
      </div>
    </div>
  );
}
