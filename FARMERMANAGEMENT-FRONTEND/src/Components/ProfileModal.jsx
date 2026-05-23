import { Modal } from './shared/Modal';
import { profileCompletion } from '../api/index';

function Row({ label, value }) {
  return (
    <div className="profile-info-row">
      <span className="profile-info-label">{label}</span>
      <span className="profile-info-val">{value || '-'}</span>
    </div>
  );
}

export function ProfileModal({ user, onClose, onApprove, onReject, onDeactivate, onActivate, onEdit, rejectionReason }) {
  if (!user) return null;
  const isFarmer = user.role === 'FARMER';
  const pct = profileCompletion(user);
  const pctColor = pct >= 80 ? 'var(--green-bright)' : pct >= 50 ? 'var(--orange)' : 'var(--red)';

  const vegs = user.cultivatedVegetables
    ? user.cultivatedVegetables.split(',').map((v, i) => <span key={i} className="veg-tag">{v.trim()}</span>)
    : <span style={{ color: '#aaa', fontSize: '0.84rem' }}>Not specified</span>;

  return (
    <Modal open title={`${isFarmer ? 'Farmer' : 'Customer'} Profile`} onClose={onClose} width={480}
      actions={<>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
        <button className="btn btn-primary" style={{ background: '#6c757d' }} onClick={() => { onClose(); onEdit(user); }}>✏ Edit</button>
        {user.status === 'pending' && <>
          <button className="btn btn-primary" onClick={() => { onClose(); onApprove(user.id); }}>✓ Approve</button>
          <button className="btn btn-danger" onClick={() => { onClose(); onReject(user.id); }}>✗ Reject</button>
        </>}
        {user.status === 'active' && <button className="btn btn-orange" onClick={() => { onClose(); onDeactivate(user.id); }}>⏸ Deactivate</button>}
        {user.status === 'inactive' && <button className="btn btn-blue" onClick={() => { onClose(); onActivate(user.id); }}>▶ Activate</button>}
      </>}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--green-pale)', border: '1px solid #c8e6c9', borderRadius: 14, padding: 16, marginBottom: 20 }}>
        {user.profilePicture
          ? <img src={user.profilePicture} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--green-bright)', flexShrink: 0 }} alt={user.name} />
          : <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--green-mid))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', fontWeight: 700, flexShrink: 0 }}>
              {(user.name || '?').charAt(0).toUpperCase()}
            </div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          {isFarmer && user.farmerIndex && (
            <div className="farmer-index-badge" style={{ marginBottom: 6 }}>{user.farmerIndex}</div>
          )}
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--green-deep)' }}>{user.name}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-light)', marginTop: 2 }}>{user.email}</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span className={`status-badge status-${user.status}`}>{user.status}</span>
            <span style={{ fontSize: '0.74rem', color: pctColor, fontWeight: 600 }}>{pct}% complete</span>
          </div>
        </div>
      </div>

      {isFarmer && user.farmerIndex && <Row label="Farmer ID" value={<strong style={{ color: 'var(--green-mid)', fontFamily: "'Playfair Display',serif", fontSize: '1rem' }}>{user.farmerIndex}</strong>} />}
      <Row label="Role" value={<strong>{user.role}</strong>} />
      <Row label="Phone" value={user.phone} />
      <Row label="NIC" value={user.nic} />

      {isFarmer && <>
        <div className="section-divider" style={{ marginTop: 14 }}>Farm Details</div>
        <Row label="Farm Size" value={user.farmSize} />
        <Row label="Farm Location" value={user.farmLocation} />
        <Row label="Experience" value={user.yearsOfExperience != null ? `${user.yearsOfExperience} years` : null} />
        <div className="profile-info-row">
          <span className="profile-info-label">Cultivates</span>
          <span style={{ textAlign: 'right', lineHeight: 2 }}>{vegs}</span>
        </div>
      </>}

      {!isFarmer && <>
        <div className="section-divider" style={{ marginTop: 14 }}>Delivery Info</div>
        <Row label="Delivery Address" value={user.deliveryAddress} />
      </>}

      {rejectionReason && (
        <div style={{ marginTop: 14, background: '#fff0f0', border: '1px solid #f5c6cb', borderRadius: 10, padding: '12px 14px', fontSize: '0.83rem', color: 'var(--red)' }}>
          <strong>Rejection reason:</strong> {rejectionReason}
        </div>
      )}
    </Modal>
  );
}
