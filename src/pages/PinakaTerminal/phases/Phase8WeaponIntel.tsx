import { useNetra } from '../../../context/NetraContext';
import NetraAILabs from '../../../components/Templates/NetraAILabs';

export default function Phase8WeaponIntel() {
  const { weaponPrediction, isPredictingWeapon, triggerWeaponPrediction, stopWeaponPrediction } = useNetra();

  return (
    <NetraAILabs
      title="NETRA AI LABS"
      subheading="MAYA — Weapon Recommendation Engine"
      showUpload={false}
      isEvaluating={isPredictingWeapon}
      output={weaponPrediction}
      onAnalyse={triggerWeaponPrediction}
      onStop={stopWeaponPrediction}
    />
  );
}
