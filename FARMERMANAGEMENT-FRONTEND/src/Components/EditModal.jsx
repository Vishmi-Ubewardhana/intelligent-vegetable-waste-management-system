import { useState, useEffect } from 'react';
import { Modal } from './shared/Modal';

export function EditModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [errs, setErrs] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({
      name: user.name || '',
      phone: user.phone || '',
      nic: user.nic || '',
      farmSize: user.farmSize || '',
      farmLocation: user.farmLocation || '',
      yearsOfExperience: user.yearsOfExperience ?? '',
      cultivatedVegetables: user.cultivatedVegetables || '',
      deliveryAddress: user.deliveryAddress || '',
    });
  }, [user]);

  if (!user) return null;
  const isFarmer = user.role === 'FARMER';

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function err(k, msg) { setErrs(e => ({ ...e, [k]: msg })); }
  function clearErr(k) { setErrs(e => ({ ...e, [k]: '' })); }

  async function handleSave() {
    const e = {};
    if (!form.name?.trim()) e.name = 'Name is required.';
    if (!/^[0-9]{10}$/.test(form.phone)) e.phone = 'Phone must be exactly 10 digits.';
    if (!/^[0-9]{9}[VvXx]$/.test(form.nic) && !/^[0-9]{12}$/.test(form.nic)) e.nic = 'NIC: 9 digits+V/X or 12 digits.';
    if (Object.keys(e).length) { setErrs(e); return; }
    setSaving(true);
    await onSave(user.id, { ...form, yearsOfExperience: form.yearsOfExperience !== '' ? parseInt(form.yearsOfExperience) : null });
    setSaving(false);
  }

  const F = ({ label, id, type = 'text', ...rest }) => (
    <div className="form-group">
      <label className="label">{label}</label>
      <input className="input" type={type} value={form[id] ?? ''} onChange={e => { set(id, e.target.value); clearErr(id); }} {...rest} />
      {errs[id] && <div className="field-err">{errs[id]}</div>}
    </div>
  );

  return (
    <Modal open title="Edit User Details" onClose={onClose} width={470}
      actions={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
      </>}
    >
      <F label="Name" id="name" placeholder="Full name" />
      <div className="form-group">
        <label className="label">Phone</label>
        <input className="input" value={form.phone ?? ''} maxLength={10}
          onChange={e => { set('phone', e.target.value.replace(/\D/g, '')); clearErr('phone'); }} />
        {errs.phone && <div className="field-err">{errs.phone}</div>}
      </div>
      <div className="form-group">
        <label className="label">NIC</label>
        <input className="input" value={form.nic ?? ''} onChange={e => { set('nic', e.target.value); clearErr('nic'); }} />
        {errs.nic && <div className="field-err">{errs.nic}</div>}
      </div>

      {isFarmer && <>
        <div className="section-divider">Farm Information</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <F label="Farm Size" id="farmSize" placeholder="e.g. 2 acres" />
          <F label="Experience (yrs)" id="yearsOfExperience" type="number" min="0" />
        </div>
        <F label="Farm Location" id="farmLocation" placeholder="e.g. Kandy" />
        <F label="Cultivated Vegetables" id="cultivatedVegetables" placeholder="e.g. Tomato, Carrot" />
      </>}

      {!isFarmer && <>
        <div className="section-divider">Delivery Information</div>
        <F label="Delivery Address" id="deliveryAddress" placeholder="Full address" />
      </>}
    </Modal>
  );
}
