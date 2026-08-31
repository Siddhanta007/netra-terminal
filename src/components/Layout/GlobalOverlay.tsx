// Global overlay host — renders the toast and the confirm modal above all routes.

import { useEffect, useState } from 'react';
import { useNetra } from '../../context/NetraContext';
import { TerminalActivityDock } from '../UI/TerminalActivityDock';
import { waitForNextPaint } from '../../utils/waitForNextPaint';

export default function GlobalOverlay() {
  const {
    toast,
    confirmModal,
    setConfirmModal,
    session,
    sysData,
    isInitializingMission,
    isLoadingSession,
  } = useNetra();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [networkActivity, setNetworkActivity] = useState({ count: 0, label: 'Loading data' });

  useEffect(() => {
    const originalFetch = window.fetch;
    let activeRequests = 0;
    let mounted = true;

    const trackedFetch: typeof window.fetch = async (...args) => {
      const [input, init] = args;
      const rawUrl = typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
      let isApiRequest = false;
      try {
        isApiRequest = new URL(rawUrl, window.location.href).pathname.includes('/api/');
      } catch {
        isApiRequest = false;
      }

      if (!isApiRequest) return originalFetch(...args);

      const requestMethod = String(
        init?.method || (input instanceof Request ? input.method : 'GET'),
      ).toUpperCase();
      const label = requestMethod === 'GET'
        ? 'Loading data'
        : requestMethod === 'DELETE'
          ? 'Deleting data'
          : 'Saving data';

      activeRequests += 1;
      if (mounted) setNetworkActivity({ count: activeRequests, label });
      try {
        return await originalFetch(...args);
      } finally {
        activeRequests = Math.max(0, activeRequests - 1);
        if (mounted) setNetworkActivity(current => ({ ...current, count: activeRequests }));
      }
    };

    window.fetch = trackedFetch;
    return () => {
      mounted = false;
      if (window.fetch === trackedFetch) window.fetch = originalFetch;
    };
  }, []);

  const fullPageLoading = Boolean(session && !sysData) || isInitializingMission || isLoadingSession;
  const localSpinnerVisible = typeof document !== 'undefined'
    && Boolean(document.querySelector('[data-netra-local-spinner="true"]'));
  const showNetworkActivity = networkActivity.count > 0 && !fullPageLoading && !localSpinnerVisible;

  const closeModal = () => {
    if (!isSubmitting) setConfirmModal(null);
  };

  const confirmModalAction = async () => {
    if (!confirmModal || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await waitForNextPaint();
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
                  data-activity-label={confirmModal.loadingText || 'Processing'}
                  style={{ flex: 1, height: '40px', border: 'none', background: confirmModal.isDanger === false ? '#4169E1' : '#ef4444', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#ffffff', cursor: isSubmitting ? 'wait' : 'pointer', fontFamily: 'inherit', transition: 'all 150ms', opacity: isSubmitting ? 0.8 : 1 }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  {isSubmitting ? (confirmModal.loadingText || 'Processing…') : (confirmModal.confirmText || 'Confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSubmitting ? (
        <TerminalActivityDock
          loading
          message={confirmModal?.loadingText || 'Processing'}
        />
      ) : showNetworkActivity ? (
        <TerminalActivityDock
          loading
          networkActivity
          message={networkActivity.label}
        />
      ) : toast ? (
        <TerminalActivityDock message={toast.msg} tone={toast.type} />
      ) : null}
    </>
  );
}
