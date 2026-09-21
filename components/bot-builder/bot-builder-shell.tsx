'use client';

import { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';
import { registerTradingBlocks } from './trading-blocks';

const STORAGE_KEY = 'trading-terminal-bot-workspace';

const TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    { kind: 'category', name: 'Trading', colour: '#0f766e', contents: [
      { kind: 'block', type: 'deriv_trade_definition' },
      { kind: 'block', type: 'deriv_set_symbol' },
      { kind: 'block', type: 'deriv_set_stake' },
      { kind: 'block', type: 'deriv_set_duration' },
      { kind: 'block', type: 'deriv_rise_fall' },
      { kind: 'block', type: 'deriv_digit_contract' },
      { kind: 'block', type: 'deriv_purchase' },
      { kind: 'block', type: 'deriv_condition' },
    ] },
    { kind: 'category', name: 'Logic', colour: '#5b80a5', contents: [
      { kind: 'block', type: 'controls_if' },
      { kind: 'block', type: 'logic_compare' },
      { kind: 'block', type: 'logic_boolean' },
    ] },
    { kind: 'category', name: 'Loops', colour: '#5ba55b', contents: [
      { kind: 'block', type: 'controls_repeat_ext' },
      { kind: 'block', type: 'controls_whileUntil' },
    ] },
    { kind: 'category', name: 'Math', colour: '#5b67a5', contents: [
      { kind: 'block', type: 'math_number' },
      { kind: 'block', type: 'math_arithmetic' },
    ] },
    { kind: 'category', name: 'Text', colour: '#745ba5', contents: [
      { kind: 'block', type: 'text' },
      { kind: 'block', type: 'text_print' },
    ] },
  ],
};

export default function BotBuilderShell() {
  const hostRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const [message, setMessage] = useState('Build a strategy using Trading blocks.');
  const [saved, setSaved] = useState(false);

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
      try { Blockly.serialization.workspaces.load(JSON.parse(raw), workspace); setMessage('Saved strategy restored.'); } catch { localStorage.removeItem(STORAGE_KEY); }
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
    try { workspace.clear(); Blockly.serialization.workspaces.load(JSON.parse(raw), workspace); setMessage('Strategy loaded.'); }
    catch { setMessage('Saved strategy could not be loaded.'); }
  };

  const reset = () => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    workspace.clear();
    localStorage.removeItem(STORAGE_KEY);
    setMessage('Workspace reset.');
  };

  const validate = () => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const blocks = workspace.getAllBlocks(false);
    if (!blocks.length) { setMessage('Add at least one trading block.'); return; }
    const symbols = blocks.filter(b => b.type === 'deriv_set_symbol');
    const stakes = blocks.filter(b => b.type === 'deriv_set_stake');
    const durations = blocks.filter(b => b.type === 'deriv_set_duration');
    const contracts = blocks.filter(b => b.type === 'deriv_rise_fall' || b.type === 'deriv_digit_contract');
    const purchases = blocks.filter(b => b.type === 'deriv_purchase');
    const errors: string[] = [];
    if (!symbols.length) errors.push('Symbol is missing.');
    if (!stakes.length) errors.push('Stake is missing.');
    if (!durations.length) errors.push('Duration is missing.');
    if (!contracts.length) errors.push('Contract type is missing.');
    if (!purchases.length) errors.push('Purchase block is missing.');
    setMessage(errors.length ? errors.join(' ') : 'Strategy is valid and ready for execution.');
  };

  const clear = () => { workspaceRef.current?.clear(); setMessage('Workspace cleared.'); };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">Bot Builder</h1>
          <p className="text-xs text-muted-foreground">WinIndex-inspired visual Deriv strategy builder</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={load} className="rounded-md border px-3 py-2 text-sm">Load</button>
          <button type="button" onClick={save} className="rounded-md border px-3 py-2 text-sm">{saved ? 'Saved' : 'Save'}</button>
          <button type="button" onClick={reset} className="rounded-md border px-3 py-2 text-sm">Reset</button>
          <button type="button" onClick={clear} className="rounded-md border px-3 py-2 text-sm">Clear</button>
          <button type="button" onClick={validate} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Validate Strategy</button>
        </div>
      </header>
      <main className="relative min-h-0 flex-1">
        <div ref={hostRef} className="h-[calc(100dvh-116px)] w-full overflow-hidden" />
      </main>
      <div className="border-t bg-card px-4 py-2 text-xs text-muted-foreground">{message}</div>
    </div>
  );
}
