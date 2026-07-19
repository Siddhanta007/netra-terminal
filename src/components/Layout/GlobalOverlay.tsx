// Global overlay host — renders the toast and the confirm modal above all routes.

import { useEffect, useRef, useState } from 'react';
import { useNetra } from '../../context/NetraContext';
import { LuxuryShapeSpinner } from '../UI/LuxuryShapeSpinner';

export default function GlobalOverlay() {
  const { toast, confirmModal, setConfirmModal } = useNetra();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [headerRequestCount, setHeaderRequestCount] = useState(0);
  const [globalRequestCount, setGlobalRequestCount] = useState(0);
  const [globalLoadingLabel, setGlobalLoadingLabel] = useState('Processing');
  const lastClickedButton = useRef<{ button: HTMLButtonElement; at: number } | null>(null);

  // One shared request observer gives every API-backed button the same immediate
  // feedback. Local UI-only buttons remain instant and never show a false spinner.
  useEffect(() => {
    const pendingRequests = new Map<HTMLButtonElement, { count: number; wasDisabled: boolean; showSpinner: boolean }>();
    const rememberButton = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('button') : null;
      if (target instanceof HTMLButtonElement && !target.disabled) {
        lastClickedButton.current = { button: target, at: Date.now() };
      }
    };
    const originalFetch = window.fetch;

    const start = (button: HTMLButtonElement, showSpinner: boolean) => {
      const pending = pendingRequests.get(button);
      if (pending) {
        pending.count += 1;
        return;
      }
      pendingRequests.set(button, { count: 1, wasDisabled: button.disabled, showSpinner });
      if (showSpinner) {
        const width = button.getBoundingClientRect().width;
        button.style.setProperty('--netra-button-loading-color', window.getComputedStyle(button).color);
        button.classList.add('netra-button-pending');
        if (width < 84) button.classList.add('netra-button-pending-compact');
      }
      button.setAttribute('aria-busy', 'true');
      button.disabled = true;
    };
    const finish = (button: HTMLButtonElement) => {
      const pending = pendingRequests.get(button);
      if (!pending) return;
      pending.count -= 1;
      if (pending.count > 0) return;
      pendingRequests.delete(button);
      button.classList.remove('netra-button-pending');
      button.classList.remove('netra-button-pending-compact');
      button.style.removeProperty('--netra-button-loading-color');
      button.removeAttribute('aria-busy');
      if (button.isConnected) button.disabled = pending.wasDisabled;
    };

    window.addEventListener('click', rememberButton, true);
    window.fetch = ((...args: Parameters<typeof fetch>) => {
      const candidate = lastClickedButton.current;
      const button = candidate && Date.now() - candidate.at < 800 && candidate.button.isConnected
        ? candidate.button
        : null;
      const globalTrigger = button?.closest<HTMLButtonElement>('[data-loading-scope="global"]');
      const isGlobalRequest = Boolean(globalTrigger);
      const isHeaderRequest = !isGlobalRequest && Boolean(button?.closest('header, [data-loading-region="header"]'));
      if (button) start(button, !isHeaderRequest && !isGlobalRequest);
      if (isGlobalRequest) {
        setGlobalLoadingLabel(globalTrigger?.dataset.loadingLabel || 'Processing');
        setGlobalRequestCount(count => count + 1);
      }
      if (isHeaderRequest) setHeaderRequestCount(count => count + 1);
      return originalFetch.call(window, ...args).finally(() => {
        if (button) finish(button);
        if (isGlobalRequest) setGlobalRequestCount(count => Math.max(0, count - 1));
        if (isHeaderRequest) setHeaderRequestCount(count => Math.max(0, count - 1));
      });
    }) as typeof window.fetch;

    return () => {
      window.removeEventListener('click', rememberButton, true);
      window.fetch = originalFetch;
      pendingRequests.forEach((pending, button) => {
        button.classList.remove('netra-button-pending');
        button.classList.remove('netra-button-pending-compact');
        button.style.removeProperty('--netra-button-loading-color');
        button.removeAttribute('aria-busy');
        if (button.isConnected) button.disabled = pending.wasDisabled;
      });
    };
  }, []);

  const closeModal = () => {
    if (!isSubmitting) setConfirmModal(null);
  };

  const confirmModalAction = async () => {
    if (!confirmModal || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await confirmModal.onConfirm();
      setConfirmModal(null);
    } catch {
      // The action owns the error message. Keep the dialog available for retry.
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {globalRequestCount > 0 && (
        <div className="netra-lux-loader netra-global-action-loader" role="status" aria-live="assertive" aria-label={globalLoadingLabel}>
          <div className="netra-lux-grain" />
          <div className="netra-lux-frame">
            <LuxuryShapeSpinner label={globalLoadingLabel} />
          </div>
        </div>
      )}

      {confirmModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9998, background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
          onClick={closeModal}
        >
          <div
            style={{ position: 'relative', background: '#ffffff', width: '100%', maxWidth: '400px', minHeight: confirmModal.loadingText ? '330px' : undefined, boxShadow: '0 24px 64px rgba(15,23,42,0.18)', animation: 'fadeUp 250ms cubic-bezier(0.4,0,0.2,1) both' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Accent strip — red for danger, blue otherwise */}
            <div style={{ height: '4px', background: confirmModal.isDanger === false ? '#4169E1' : '#ef4444' }} />

            <div style={{ height: confirmModal.loadingText ? '326px' : undefined, boxSizing: 'border-box', padding: '32px 32px 28px', display: confirmModal.loadingText ? 'flex' : undefined, flexDirection: confirmModal.loadingText ? 'column' : undefined }}>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.01em', marginBottom: '10px' }}>
                {confirmModal.title}
              </div>
              <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.65, marginBottom: confirmModal.loadingText ? 0 : '28px' }}>
                {confirmModal.desc}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: confirmModal.loadingText ? 'auto' : undefined }}>
                <button
                  onClick={closeModal}
                  disabled={isSubmitting}
                  style={{ flex: 1, height: '40px', border: '1px solid rgba(15,23,42,0.18)', background: '#ffffff', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569', cursor: isSubmitting ? 'wait' : 'pointer', fontFamily: 'inherit', transition: 'all 150ms', opacity: isSubmitting ? 0.5 : 1 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#ffffff'; }}
                >
                  {confirmModal.cancelText || 'Cancel'}
                </button>
                <button
                  onClick={confirmModalAction}
                  disabled={isSubmitting}
                  style={{ flex: 1, height: '40px', border: 'none', background: confirmModal.isDanger === false ? '#4169E1' : '#ef4444', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#ffffff', cursor: isSubmitting ? 'wait' : 'pointer', fontFamily: 'inherit', transition: 'all 150ms', opacity: isSubmitting ? 0.8 : 1 }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  {isSubmitting ? (confirmModal.loadingText || 'Processing…') : (confirmModal.confirmText || 'Confirm')}
                </button>
              </div>
            </div>
            {isSubmitting && (
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(2px)' }}>
                <LuxuryShapeSpinner compact label={confirmModal.loadingText || 'Processing'} />
              </div>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {headerRequestCount > 0 && (
        <div role="status" aria-live="polite" style={{ position: 'fixed', right: '22px', bottom: '22px', zIndex: 9997, display: 'flex', alignItems: 'center', gap: '9px', padding: '9px 12px', background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(148,163,184,0.28)', boxShadow: '0 10px 30px rgba(15,23,42,0.2)', color: '#f8fafc', fontSize: '9px', fontWeight: 850, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Loading<span className="netra-loading-dots" aria-hidden="true"><i /><i /><i /></span>
        </div>
      )}
    </>
  );
}
