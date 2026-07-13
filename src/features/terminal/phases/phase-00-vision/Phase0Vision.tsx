// Vision phase — upload a chart and get Maya's image description as analysis context.

import { useNetra } from '@/context/NetraContext';
import NetraAILabs from '@/components/Templates/NetraAILabs';

export default function Phase0Vision() {
  const { imageDescription, isUploadingImage, stopVisualAnalysis } = useNetra();

  return (
    <NetraAILabs
      phaseId="vision"
      phaseNum={0}
      title="Netra AI Labs"
      subheading="MAYA - AI Chart Analysis"
      showUpload={true}
      isEvaluating={isUploadingImage}
      output={imageDescription}
      onAnalyse={() => {}}
      onStop={stopVisualAnalysis}
      analyseDisabled={true}
      analyseDisabledReason="Vision analysis is temporarily disabled to avoid image-analysis API cost."
    />
  );
}
