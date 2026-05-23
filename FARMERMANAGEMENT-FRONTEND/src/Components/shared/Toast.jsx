import { useState, useCallback, useEffect } from 'react';

let _setToast = null;

export function showToast(msg, isError = false) {
  _setToast && _setToast({ msg, isError, id: Date.now() });
}

export function Toast() {
  const [toast, setToast] = useState(null);
  _setToast = setToast;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 10000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  return (
    <div className={`toast${toast.isError ? ' error' : ''}`}>
      <span>{toast.isError ? '⚠️' : '✅'}</span>
      <span>{toast.msg}</span>
      <span style={{ marginLeft: 'auto', cursor: 'pointer', opacity: 0.7 }} onClick={() => setToast(null)}>✕</span>
    </div>
  );
}
