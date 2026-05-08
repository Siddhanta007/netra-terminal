import { useNetra } from '../../context/NetraContext';
import NetraAILabs from '../Templates/NetraAILabs';

export default function Phase0Vision() {
  const {
    imageDescription, uploadAndDescribeImage, isUploadingImage, stopVisualAnalysis
  } = useNetra();

  return (
    <NetraAILabs 
      phaseId="vision"
      phaseNum={0}
      title="Netra AI Labs"
      subheading="Visual Intelligence Engine"
      showUpload={true}
      isEvaluating={isUploadingImage}
      output={imageDescription}
      onAnalyse={uploadAndDescribeImage}
      onStop={stopVisualAnalysis}
    />
  );
}
