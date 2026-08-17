// Global overlay host — renders the toast and the confirm modal above all routes.

import { useEffect, useRef, useState } from 'react';
import { useNetra } from '../../context/NetraContext';
import { TerminalActivityDock } from '../UI/TerminalActivityDock';

export default function GlobalOverlay() {
  const { toast, confirmModal, setConfirmModal } = useNetra();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [activityLabel, setActivityLabel] = useState('Processing');
  const [interactionActive, setInteractionActive] = useState(false);
  const lastClickedButton = useRef<{ button: HTMLButtonElement; at: number } | null>(null);

  // One shared request observer gives every API-backed button the same immediate
  // feedback. Local UI-only buttons remain instant and never show a false spinner.
  useEffect(() => {
    const pendingRequests = new Map<HTMLButtonElement, { count: number; wasDisabled: boolean; showSpinner: boolean }>();
    const feedbackTimers = new Map<HTMLButtonElement, number>();
    let interactionTimer: number | null = null;
    const actionLabel = (button: HTMLButtonElement) => {
      const explicit = button.dataset.activityLabel || button.dataset.loadingLabel;
      if (explicit) return explicit;
      const text = (button.textContent || button.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
      if (/execute|analyse|maya/i.test(text)) return 'Running Maya';
      if (/abort|stop/i.test(text)) return 'Stopping Maya';
      if (/edit|reopen/i.test(text) || button.classList.contains('btn-edit')) return 'Reopening workflow';
      if (/reset|remove|delete|cut/i.test(text) || button.classList.contains('btn-reset')) return 'Updating workflow';
      if (/confirm|save|apply|resolve/i.test(text) || button.classList.contains('btn-confirm')) return 'Saving changes';
      return text ? `${text}…` : 'Processing';
    };
    const beginInteraction = (button: HTMLButtonElement) => {
      setActivityLabel(actionLabel(button));
      setInteractionActive(true);
      if (interactionTimer) window.clearTimeout(interactionTimer);
      interactionTimer = window.setTimeout(() => {
        setInteractionActive(false);
        interactionTimer = null;
      }, 650);
    };
    const animateButton = (button: HTMLButtonElement, className: string, duration: number) => {
      const current = feedbackTimers.get(button);
      if (current) window.clearTimeout(current);
      button.classList.remove('netra-button-activated', 'netra-button-settled');
      void button.offsetWidth;
      button.classList.add(className);
      feedbackTimers.set(button, window.setTimeout(() => {
        button.classList.remove(className);
        feedbackTimers.delete(button);
      }, duration));
    };
    const rememberButton = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('button') : null;
      if (target instanceof HTMLButtonElement && !target.disabled) {
        animateButton(target, 'netra-button-activated', 240);
        const hasLocalLoading = Boolean(target.closest('[data-loading-owner="local"]'));
        if (!hasLocalLoading && target.matches('.btn-primary, .btn-confirm, .btn-edit, .btn-reset, [data-activity-label], [data-loading-label]')) {
          beginInteraction(target);
        }
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
      if (button.isConnected) {
        button.disabled = pending.wasDisabled;
        if (pending.showSpinner) animateButton(button, 'netra-button-settled', 520);
      }
    };

    window.addEventListener('click', rememberButton, true);
    window.fetch = ((...args: Parameters<typeof fetch>) => {
      const candidate = lastClickedButton.current;
      const button = candidate && Date.now() - candidate.at < 800 && candidate.button.isConnected
        ? candidate.button
        : null;
      const hasLocalLoading = Boolean(button?.closest('[data-loading-owner="local"]'));
      const globalTrigger = button?.closest<HTMLButtonElement>('[data-loading-scope="global"]');
      const isGlobalRequest = Boolean(globalTrigger);
      const isHeaderRequest = !isGlobalRequest && Boolean(button?.closest('header, [data-loading-region="header"]'));
      if (button && !hasLocalLoading) start(button, !isHeaderRequest && !isGlobalRequest);
      if (button && !hasLocalLoading) {
        setActivityLabel(actionLabel(globalTrigger || button));
        setRequestCount(count => count + 1);
      }
      return originalFetch.call(window, ...args).finally(() => {
        if (button && !hasLocalLoading) finish(button);
        if (button && !hasLocalLoading) setRequestCount(count => Math.max(0, count - 1));
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
      feedbackTimers.forEach(timeout => window.clearTimeout(timeout));
      feedbackTimers.clear();
      if (interactionTimer) window.clearTimeout(interactionTimer);
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

      {(requestCount > 0 || interactionActive || isSubmitting) ? (
        <TerminalActivityDock
          loading
          message={isSubmitting ? (confirmModal?.loadingText || 'Processing') : activityLabel}
        />
      ) : toast ? (
        <TerminalActivityDock message={toast.msg} tone={toast.type} />
      ) : null}
    </>
  );
}
