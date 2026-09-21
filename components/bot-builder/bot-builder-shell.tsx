'use client';

import { useEffect, useRef, useState } from 'react';
import * as Blockly from 'blockly';
import 'blockly/blocks';

const TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Logic',
      colour: '#5b80a5',
      contents: [
        { kind: 'block', type: 'controls_if' },
        { kind: 'block', type: 'logic_compare' },
        { kind: 'block', type: 'logic_boolean' },
      ],
    },
    {
      kind: 'category',
      name: 'Loops',
      colour: '#5ba55b',
      contents: [
        { kind: 'block', type: 'controls_repeat_ext' },
        { kind: 'block', type: 'controls_whileUntil' },
      ],
    },
    {
      kind: 'category',
      name: 'Math',
      colour: '#5b67a5',
      contents: [
        { kind: 'block', type: 'math_number' },
        { kind: 'block', type: 'math_arithmetic' },
      ],
    },
    {
      kind: 'category',
      name: 'Text',
      colour: '#745ba5',
      contents: [
        { kind: 'block', type: 'text' },
        { kind: 'block', type: 'text_print' },
      ],
    },
  ],
};

export default function BotBuilderShell() {
  const hostRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<Blockly.WorkspaceSvg | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');

  useEffect(() => {
    if (!hostRef.current || workspaceRef.current) return;

    const workspace = Blockly.inject(hostRef.current, {
      toolbox: TOOLBOX,
      trashcan: true,
      grid: {
        spacing: 20,
        length: 3,
        colour: '#d1d5db',
        snap: true,
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 0.95,
        maxScale: 1.5,
        minScale: 0.5,
      },
    });

    workspaceRef.current = workspace;
    (window as Window & { derivWorkspace?: Blockly.WorkspaceSvg }).derivWorkspace = workspace;

    const resize = () => Blockly.svgResize(workspace);
    window.addEventListener('resize', resize);
    resize();

    return () => {
      window.removeEventListener('resize', resize);
      if ((window as Window & { derivWorkspace?: Blockly.WorkspaceSvg }).derivWorkspace === workspace) {
        delete (window as Window & { derivWorkspace?: Blockly.WorkspaceSvg }).derivWorkspace;
      }
      workspace.dispose();
      workspaceRef.current = null;
    };
  }, []);

  const run = () => {
    const workspace = workspaceRef.current;
    if (!workspace) return;

    const blocks = workspace.getTopBlocks(true);
    const summary = blocks.map((block) => block.type).join(', ') || 'No blocks';
    setGeneratedCode(summary);
  };

  const clear = () => {
    workspaceRef.current?.clear();
    setGeneratedCode('');
  };

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between border-b bg-card px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">Bot Builder</h1>
          <p className="text-xs text-muted-foreground">
            WinIndex Blockly workspace integrated into Trading Terminal
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={clear} className="rounded-md border px-3 py-2 text-sm">
            Clear
          </button>
          <button type="button" onClick={run} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">
            Validate Strategy
          </button>
        </div>
      </header>

      <main className="relative min-h-0 flex-1">
        <div ref={hostRef} className="h-[calc(100dvh-116px)] w-full overflow-hidden" />
      </main>

      {generatedCode && (
        <div className="border-t bg-card px-4 py-2 text-xs text-muted-foreground">
          Strategy blocks: {generatedCode}
        </div>
      )}
    </div>
  );
}
