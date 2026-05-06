import { useNetra } from '../../context/NetraContext';

export default function Phase0Vision() {
  const {
    visionModel, setVisionModel,
    imageDescription, uploadAndDescribeImage, isUploadingImage,
    uploadedVisionFile, setUploadedVisionFile, stopVisualAnalysis
  } = useNetra();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 fade-up">
      <div className="lg:col-span-7 flex flex-col gap-4">
        <section>
          <div className="label" style={{ marginBottom: '8px' }}>Netra Image Labs</div>
          <div className="p-4 rounded-full-lg border border-[var(--border)] bg-[var(--surface)] min-h-[200px] text-[11px] text-[var(--text-2)] font-mono whitespace-pre-wrap flex flex-col">
            {isUploadingImage ? (
              <div className="flex-1 flex flex-col items-center justify-center text-blue-500 animate-pulse">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                <span>Extracting Tactical Visuals...</span>
              </div>
            ) : imageDescription ? (
              <div dangerouslySetInnerHTML={{ __html: imageDescription.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--text-1)]">$1</strong>') }} />
            ) : (
              <div className="flex-1 flex items-center justify-center opacity-50">
                Awaiting Chart Telemetry...
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="lg:col-span-5 flex flex-col gap-6">
        <div>
          <div style={{ fontSize: '10px', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '4px' }}>Phase 0: Visual Analyst</div>
          <h2 style={{ fontSize: '22px', fontWeight: 950, letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1.1 }}>Maya Chart analysis</h2>
        </div>

        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <div className="label">Vision Engine</div>
            <select
              value={visionModel}
              onChange={(e) => setVisionModel(e.target.value)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-full text-[11px] text-[var(--text-1)] p-2 outline-none"
            >
              <option value="anthropic|claude-4.6-sonnet">Anthropic: Claude 4.6 Sonnet (Ultra)</option>
              <option value="anthropic|claude-4.6-opus">Anthropic: Claude 4.6 Opus (Ultra)</option>
              <option value="anthropic|claude-3-5-sonnet-20241022">Anthropic: Claude 3.5 Sonnet</option>
              <option value="openai|gpt-5-latest">OpenAI: GPT-5 Latest (Ultra)</option>
              <option value="openai|gpt-4o">OpenAI: GPT-4o (Premium)</option>
              <option value="google|gemini-3.1-pro">Google: Gemini 3.1 Pro (Premium)</option>
              <option value="google|gemini-1.5-pro">Google: Gemini 1.5 Pro</option>
            </select>
          </div>

          <label
            className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-full-xl cursor-pointer transition-all ${
              isUploadingImage 
                ? 'border-[var(--border)] bg-[var(--surface)] opacity-50' 
                : 'border-[#f59e0b] bg-[rgba(245,158,11,0.05)] hover:bg-[rgba(245,158,11,0.1)]'
            }`}
          >
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setUploadedVisionFile(e.target.files[0]);
                }
              }} 
              disabled={isUploadingImage} 
            />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span className="text-[11px] font-bold tracking-widest text-[#f59e0b] uppercase">
              {uploadedVisionFile ? uploadedVisionFile.name : 'Select Chart Image'}
            </span>
          </label>

          <div className="flex gap-2 mt-2">
            <button 
              onClick={stopVisualAnalysis}
              disabled={!isUploadingImage}
              className="btn-reset flex-1"
            >
              Stop
            </button>
            <button 
              onClick={uploadAndDescribeImage}
              disabled={!uploadedVisionFile || isUploadingImage}
              className="btn-confirm flex-1"
            >
              Analyse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
