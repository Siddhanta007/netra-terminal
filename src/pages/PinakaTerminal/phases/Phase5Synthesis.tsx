import { useNetra } from '../../../context/NetraContext';
import NetraAILabs from '../../../components/Templates/NetraAILabs';

export default function Phase5Synthesis() {
  const { netraOutput, isEvaluating, triggerNeuralSynthesis, stopSynthesis } = useNetra();

  return (
    <NetraAILabs
      title="NETRA AI LABS"
      subheading="MAYA — Market Type Selector"
      showUpload={false}
      isEvaluating={isEvaluating}
      output={netraOutput}
      onAnalyse={triggerNeuralSynthesis}
      onStop={stopSynthesis}
    />
  );
}
