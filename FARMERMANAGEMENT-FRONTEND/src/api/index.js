export const BASE = 'http://localhost:8080/api';
export const USER_API = `${BASE}/users`;
export const NOTIF_API = `${BASE}/notifications`;

export const esc = (s) =>
  s == null ? '-' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function profileCompletion(u) {
  const isFarmer = u.role === 'FARMER';
  const fields = isFarmer
    ? [u.name, u.email, u.phone, u.nic, u.farmSize, u.farmLocation, u.yearsOfExperience, u.cultivatedVegetables, u.profilePicture]
    : [u.name, u.email, u.phone, u.nic, u.deliveryAddress, u.profilePicture];
  const filled = fields.filter(f => f != null && String(f).trim() !== '').length;
  return Math.round((filled / fields.length) * 100);
}

export function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-LK', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' at ' + d.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });
}

export function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-LK', { day: 'numeric', month: 'short' });
}

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
}

export function avatarLetter(name) {
  return (name || '?').charAt(0).toUpperCase();
}
