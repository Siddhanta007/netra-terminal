import { useNetra } from '../../context/NetraContext';

export default function GlobalOverlay() {
  const { toast, confirmModal, setConfirmModal } = useNetra();

  return (
    <>
      {confirmModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={() => setConfirmModal(null)}
        >
          <div
            style={{ background: '#ffffff', width: '100%', maxWidth: '400px', boxShadow: '0 24px 64px rgba(15,23,42,0.18)', animation: 'fadeUp 250ms cubic-bezier(0.4,0,0.2,1) both' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Accent strip — red for danger, blue otherwise */}
            <div style={{ height: '4px', background: confirmModal.isDanger === false ? '#4169E1' : '#ef4444' }} />

            <div style={{ padding: '32px 32px 28px' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: '10px' }}>
                {confirmModal.title}
              </div>
              <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.65, marginBottom: '28px' }}>
                {confirmModal.desc}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setConfirmModal(null)}
                  style={{ flex: 1, height: '40px', border: '1px solid rgba(15,23,42,0.18)', background: '#ffffff', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
                >
                  {confirmModal.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  style={{ flex: 1, height: '40px', border: 'none', background: confirmModal.isDanger === false ? '#4169E1' : '#ef4444', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#ffffff', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  {confirmModal.confirmText || 'Confirm'}
                </button>
              </div>
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
