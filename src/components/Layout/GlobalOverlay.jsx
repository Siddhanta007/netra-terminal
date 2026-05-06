import { useNetra } from '../../context/NetraContext';

export default function GlobalOverlay() {
  const { toast, confirmModal, setConfirmModal } = useNetra();

  return (
    <>
      {confirmModal && (
        <div className="modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-title">
              {confirmModal.title}
            </div>
            <div className="modal-desc">{confirmModal.desc}</div>
            <div className="modal-actions" style={{ gap: '12px' }}>
              <button
                className="flex-1 py-3.5 rounded-full border border-[var(--border-strong)] text-[var(--text-3)] text-[11px] font-bold uppercase tracking-wider hover:bg-white/5 hover:text-white transition-all font-sans"
                onClick={() => setConfirmModal(null)}
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                className={`flex-1 py-3.5 rounded-full text-white text-[11px] font-black uppercase tracking-widest shadow-lg hover:brightness-110 active:scale-[0.98] transition-all font-sans`}
                style={{ background: confirmModal.isDanger === false ? 'var(--accent)' : 'var(--red)' }}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </>
  );
}
