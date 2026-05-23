import { useState } from 'react';
import { Modal } from './shared/Modal';

export function RejectModal({ userId, onClose, onConfirm }) {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function handle() {
    if (!reason.trim()) { setErr('Please enter a rejection reason.'); return; }
    setLoading(true);
    await onConfirm(userId, reason.trim());
    setLoading(false);
    setReason('');
  }

  if (!userId) return null;

  return (
    <Modal open title="Reject Application" onClose={onClose} width={420}
      actions={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-danger" onClick={handle} disabled={loading}>{loading ? 'Rejecting…' : 'Reject Application'}</button>
      </>}
    >
      <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 12, padding: '13px 16px', fontSize: '0.85rem', color: '#7d5300', marginBottom: 18 }}>
        ⚠️ This will reject the farmer's application and mark their account inactive.
      </div>
      <div className="form-group">
        <label className="label">Rejection Reason <span style={{ color: 'var(--red)' }}>*</span></label>
        <textarea className="input" rows={3} style={{ resize: 'vertical', minHeight: 80 }}
          placeholder="e.g. Incomplete farm details, invalid NIC provided…"
          value={reason} onChange={e => { setReason(e.target.value); setErr(''); }}
        />
        {err && <div className="field-err">{err}</div>}
      </div>
    </Modal>
  );
}
