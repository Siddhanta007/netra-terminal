// Maya Terminal Audit — runs once over every committed trade in this terminal session.

import React from 'react';
import { useNetra } from '@/context/NetraContext';
import NetraAILabs from '@/components/Templates/NetraAILabs';

type Phase11MayaAuditProps = {
  enabled?: boolean;
};

export default function Phase11MayaAudit({ enabled = true }: Phase11MayaAuditProps) {
  const { auditData, isAuditing, triggerPostTradeAudit, stopPostTradeAudit, activeSessionId } = useNetra();
  const hasCompletedSessionAudit = auditData?.audit_type === 'SESSION' && auditData?.status === 'COMPLETED';
  const handleAudit = () => {
    if (!enabled || !activeSessionId || hasCompletedSessionAudit) return;
    triggerPostTradeAudit();
  };

  const analyseDisabled = !enabled || !activeSessionId || hasCompletedSessionAudit;
  const disabledReason = hasCompletedSessionAudit
    ? 'This terminal session already has its Maya Terminal Audit.'
    : 'Commit at least one closed trade before running Maya Terminal Audit.';

  return (
    <div>
      <NetraAILabs
        phaseId="mission_audit"
        phaseNum={9}
        title="NETRA AI LABS"
        subheading="MAYA - Terminal Audit"
        showUpload={false}
        isEvaluating={isAuditing}
        output={auditData}
        onAnalyse={handleAudit}
        onStop={stopPostTradeAudit}
        analyseDisabled={analyseDisabled}
        analyseDisabledReason={disabledReason}
      />
    </div>
  );
}
