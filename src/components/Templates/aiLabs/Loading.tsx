import { ActionSpinner } from '@/components/UI/LoadingSpinners';

export function TerminalScroller() {
  return (
    <div className="netra-ai-spinner-shell">
      <ActionSpinner label="MAYA is processing" />
    </div>
  );
}
