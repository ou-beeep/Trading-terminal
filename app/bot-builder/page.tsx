import dynamic from 'next/dynamic';

const BotBuilderShell = dynamic(
  () => import('@/components/bot-builder/bot-builder-shell'),
  { ssr: false, loading: () => <div className="flex min-h-dvh items-center justify-center">Loading Bot Builder…</div> }
);

export default function BotBuilderPage() {
  return <BotBuilderShell />;
}
