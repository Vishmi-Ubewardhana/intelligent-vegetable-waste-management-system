import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { USER_API } from '../api/index';
import { API_BASE_URL } from '../api/config';
import { BellDropdown } from '../components/shared/BellDropdown';
import { showToast } from '../components/shared/Toast';
import { Modal } from '../components/shared/Modal';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('marketplace');
  const [dropOpen, setDropOpen] = useState(false);
  
  // Profile edit state
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [form, setForm] = useState({});
  const [pwForm, setPwForm] = useState({});
  const [errs, setErrs] = useState({});
  const [pwErrs, setPwErrs] = useState({});
  const [saving, setSaving] = useState(false);
  const [picPreview, setPicPreview] = useState(null);

  // Marketplace & Orders & Cart state
  const [stocks, setStocks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  // Cart modal state
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [cartQty, setCartQty] = useState(1);
  
  // Custom API urls
  const STOCK_API = `${API_BASE_URL}/farmer/stocks`;
  const ORDER_API = `${API_BASE_URL}/farmer/orders`;

  useEffect(() => {
    const u = JSON.parse(sessionStorage.getItem('loggedUser') || 'null');
    if (!u || u.role !== 'CUSTOMER') { navigate('/'); return; }
    setUser(u);
  }, []);

  useEffect(() => {
    function handler(e) { if (!e.target.closest('#custDropBtn')) setDropOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (tab === 'marketplace') fetchStocks();
    if (tab === 'orders') fetchOrders();
  }, [tab, user]);

  function logout() { sessionStorage.removeItem('loggedUser'); navigate('/'); }

  // ------------------ APIs ------------------
  async function fetchStocks() {
    setLoadingStocks(true);
    try {
      const res = await fetch(`${STOCK_API}/available`);
      const data = await res.json();
      if (res.ok && data.success) setStocks(data.data || []);
      else showToast('Failed to load marketplace stocks', true);
    } catch {
      showToast('Error connecting to server', true);
    }
    setLoadingStocks(false);
  }

  async function fetchOrders() {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${ORDER_API}/customer/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.data || []);
      }
    } catch {
      showToast('Error fetching orders', true);
    }
    setLoadingOrders(false);
  }

  function openCartModal(stock) {
    setSelectedStock(stock);
    setCartQty(1);
    setCartModalOpen(true);
  }

  function confirmAddToCart() {
    const qty = parseFloat(cartQty);
    if (!qty || isNaN(qty) || qty <= 0) {
      showToast('Please enter a valid quantity.', true);
      return;
    }
    if (qty > selectedStock.quantityKg) { 
      showToast(`Only ${selectedStock.quantityKg}kg available.`, true); 
      return; 
    }

    setCart(prev => {
      const existing = prev.find(item => item.stock.stockId === selectedStock.stockId);
      if (existing) {
        if (existing.qty + qty > selectedStock.quantityKg) {
          showToast(`Cannot exceed available stock.`, true);
          return prev;
        }
        return prev.map(item => item.stock.stockId === selectedStock.stockId ? { ...item, qty: item.qty + qty } : item);
      }
      return [...prev, { stock: selectedStock, qty }];
    });
    
    showToast(`Added ${qty}kg of ${selectedStock.vegetableName} to cart.`);
    setCartModalOpen(false);
    setSelectedStock(null);
  }

  function removeFromCart(stockId) {
    setCart(prev => prev.filter(item => item.stock.stockId !== stockId));
  }

  async function checkout() {
    if (cart.length === 0) return showToast('Cart is empty', true);
    if (!user.deliveryAddress) return showToast('Please update your delivery address in Profile first.', true);

    setSaving(true);
    try {
      // Create an order for each cart item
      for (const item of cart) {
        const payload = {
          farmerId: item.stock.farmerId,
          stockId: item.stock.stockId,
          vegetableName: item.stock.vegetableName,
          customerName: user.name,
          customerId: user.id,
          quantityKg: item.qty,
          pricePerKg: item.stock.pricePerKg,
          paymentMethod: 'CASH', // default for now
          deliveryAddress: user.deliveryAddress,
          notes: 'Ordered via Marketplace'
        };

        const res = await fetch(`${ORDER_API}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) {
           showToast(`Failed to order ${item.stock.vegetableName}`, true);
        }
      }
      showToast('✅ Order placed successfully!');
      setCart([]);
      setTab('orders');
    } catch (e) {
      showToast('Checkout failed', true);
    }
    setSaving(false);
  }

  // ------------------ PROFILE ------------------
  function openEdit() {
    setForm({ name: user.name || '', phone: user.phone || '', nic: user.nic || '', deliveryAddress: user.deliveryAddress || '' });
    setPicPreview(user.profilePicture || null);
    setErrs({}); setEditOpen(true); setDropOpen(false);
  }

  function handlePic(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Image must be under 2MB.', true); return; }
    const reader = new FileReader();
    reader.onload = ev => setPicPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    const e = {};
    if (!form.name?.trim()) e.name = 'Name is required.';
    if (!/^[0-9]{10}$/.test(form.phone)) e.phone = 'Phone must be 10 digits.';
    if (!/^[0-9]{9}[VvXx]$/.test(form.nic) && !/^[0-9]{12}$/.test(form.nic)) e.nic = 'Invalid NIC.';
    if (Object.keys(e).length) { setErrs(e); return; }
    setSaving(true);
    try {
      const payload = { ...form, profilePicture: picPreview || user.profilePicture || null };
      const res = await fetch(`${USER_API}/${user.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        const updated = await res.json();
        const newUser = { ...user, ...updated };
        setUser(newUser); sessionStorage.setItem('loggedUser', JSON.stringify(newUser));
        setEditOpen(false); showToast('✅ Profile updated!');
      } else showToast(await res.text(), true);
    } catch { showToast('Network error.', true); }
    setSaving(false);
  }

  async function changePassword() {
    const e = {};
    if (!pwForm.current) e.current = 'Current password required.';
    if (!pwForm.new || pwForm.new.length < 6) e.new = 'Min 6 characters.';
    if (pwForm.new !== pwForm.confirm) e.confirm = 'Passwords do not match.';
    if (Object.keys(e).length) { setPwErrs(e); return; }
    setSaving(true);
    try {
      const res = await fetch(`${USER_API}/change-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, currentPassword: pwForm.current, newPassword: pwForm.new }) });
      if (res.ok) { setPwOpen(false); setPwForm({}); showToast('✅ Password changed!'); }
      else showToast(await res.text(), true);
    } catch { showToast('Network error.', true); }
    setSaving(false);
  }

  if (!user) return null;

  const navItems = [
    { id: 'marketplace', label: 'Marketplace', icon: '🛒' },
    { id: 'orders',      label: 'Orders', icon: '📦' },
    { id: 'cart',        label: `Cart (${cart.length})`, icon: '🛍️' },
    { id: 'profile',     label: 'Profile', icon: '👤' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', paddingBottom: '80px' }}>
      {/* Topbar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '60px', background: 'var(--green-deep)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', fontWeight: 800, color: 'white' }}>🌿 VegLife</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <BellDropdown role="CUSTOMER" />
          <div id="custDropBtn" style={{ position: 'relative' }}>
            <div onClick={() => setDropOpen(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '6px 10px', borderRadius: 10, background: dropOpen ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f39c12, #e67e22)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                {user.profilePicture ? <img src={user.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{(user.name || 'C').charAt(0).toUpperCase()}</span>}
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '0.88rem', fontWeight: 600 }}>{user.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem' }}>Customer</div>
              </div>
            </div>
            {dropOpen && (
              <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, background: 'white', borderRadius: 14, padding: '8px 0', minWidth: 200, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 200, animation: 'dropIn 0.15s ease' }}>
                {[['✏️ Edit Profile', openEdit], ['🔒 Change Password', () => { setPwOpen(true); setDropOpen(false); setPwForm({}); setPwErrs({}); }], null, ['🚪 Sign Out', logout]].map((item, i) =>
                  item === null ? <div key={i} style={{ height: 1, background: '#f0f0f0', margin: '6px 0' }} /> :
                  <div key={i} onClick={item[1]} style={{ padding: '10px 16px', fontSize: '0.88rem', cursor: 'pointer', color: item[0].includes('Sign') ? '#c0392b' : '#4a5c4a', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}
                    onMouseOver={e => e.currentTarget.style.background = item[0].includes('Sign') ? '#fdecea' : 'var(--green-pale)'}
                    onMouseOut={e => e.currentTarget.style.background = ''}>
                    {item[0]}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div style={{ marginTop: '60px', maxWidth: 1000, margin: '60px auto 0', padding: '28px 20px' }}>
        
        {/* MARKETPLACE TAB */}
        {tab === 'marketplace' && (
          <div className="animate-fade">
            <div style={{ background: 'linear-gradient(135deg, #4a9e3f, #2d5a1b)', borderRadius: 16, padding: '24px 32px', color: 'white', marginBottom: 24, boxShadow: '0 4px 15px rgba(45, 90, 27, 0.2)' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>🛒 Fresh Marketplace</div>
              <div style={{ opacity: 0.9, fontSize: '0.9rem' }}>Directly from verified Sri Lankan farmers</div>
            </div>

            {loadingStocks ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#7f8c8d' }}>Loading stocks...</div>
            ) : stocks.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '3rem', marginBottom: 14 }}>🥬</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', color: '#2d5a1b' }}>No stocks available yet</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {stocks.map(stock => (
                  <div key={stock.stockId} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8e2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ margin: 0, color: '#1a3a0a', fontSize: '1.2rem', fontFamily: "'DM Sans', sans-serif" }}>{stock.vegetableName}</h3>
                        <span style={{ fontSize: '0.75rem', color: '#6b9e62', fontWeight: 600, background: '#e8f5e9', padding: '2px 8px', borderRadius: 10, display: 'inline-block', marginTop: 4 }}>
                          {stock.category}
                        </span>
                      </div>
                      <div style={{ background: '#f8f9fa', padding: '6px 10px', borderRadius: 8, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#d35400' }}>Rs.{stock.pricePerKg}</div>
                        <div style={{ fontSize: '0.65rem', color: '#7f8c8d' }}>per Kg</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#34495e', marginBottom: 16 }}>
                      <div style={{ marginBottom: 4 }}><strong>Available:</strong> {stock.quantityKg} kg</div>
                      <div style={{ marginBottom: 4 }}><strong>Farmer:</strong> {stock.farmerId}</div>
                    </div>
                    <button 
                      onClick={() => openCartModal(stock)}
                      style={{ width: '100%', background: '#4a9e3f', color: 'white', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseOver={e => e.target.style.background = '#3d8234'}
                      onMouseOut={e => e.target.style.background = '#4a9e3f'}
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === 'orders' && (
          <div className="animate-fade">
             <div style={{ background: 'linear-gradient(135deg, #2980b9, #2c3e50)', borderRadius: 16, padding: '24px 32px', color: 'white', marginBottom: 24, boxShadow: '0 4px 15px rgba(41, 128, 185, 0.2)' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>📦 My Order Status</div>
              <div style={{ opacity: 0.9, fontSize: '0.9rem' }}>Track your purchases</div>
            </div>

            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#7f8c8d' }}>Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '3rem', marginBottom: 14 }}>🚚</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', color: '#2c3e50' }}>No orders placed yet</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {orders.map(order => (
                  <div key={order.orderId} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8e2' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#2c3e50' }}>Order #{order.orderId}</div>
                          <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: 2 }}>{new Date(order.createdAt).toLocaleString()}</div>
                        </div>
                        <span style={{ 
                          background: order.statusColor === 'green' ? '#d4edda' : order.statusColor === 'blue' ? '#cce5ff' : order.statusColor === 'red' ? '#f8d7da' : '#fff3cd', 
                          color: order.statusColor === 'green' ? '#155724' : order.statusColor === 'blue' ? '#004085' : order.statusColor === 'red' ? '#721c24' : '#856404', 
                          padding: '6px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700 
                        }}>
                          {order.orderStatus}
                        </span>
                     </div>
                     <div style={{ fontSize: '0.9rem', color: '#34495e', lineHeight: '1.5' }}>
                        <div><strong>Item:</strong> {order.quantityKg} kg of {order.vegetableName}</div>
                        <div><strong>Farmer:</strong> {order.farmerId}</div>
                        <div><strong>Delivery:</strong> {order.deliveryAddress}</div>
                        <div style={{ marginTop: 8, fontWeight: 700, color: '#27ae60', fontSize: '1.05rem' }}>Total: Rs. {order.totalAmount.toFixed(2)}</div>
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CART TAB */}
        {tab === 'cart' && (
          <div className="animate-fade">
             <div style={{ background: 'linear-gradient(135deg, #d35400, #e67e22)', borderRadius: 16, padding: '24px 32px', color: 'white', marginBottom: 24, boxShadow: '0 4px 15px rgba(211, 84, 0, 0.2)' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 800, marginBottom: 6 }}>🛍️ Shopping Cart</div>
              <div style={{ opacity: 0.9, fontSize: '0.9rem' }}>Review items before checkout</div>
            </div>

            {cart.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <div style={{ fontSize: '3rem', marginBottom: 14 }}>🛒</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.3rem', color: '#d35400' }}>Your cart is empty</div>
                <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setTab('marketplace')}>Browse Marketplace</button>
              </div>
            ) : (
              <div style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #e2e8e2' }}>
                {cart.map((item, idx) => (
                  <div key={item.stock.stockId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: idx < cart.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#1a3a0a' }}>{item.stock.vegetableName}</div>
                      <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginTop: 4 }}>{item.qty} kg @ Rs.{item.stock.pricePerKg} / kg</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ fontWeight: 700, color: '#d35400', fontSize: '1.1rem' }}>Rs. {(item.qty * item.stock.pricePerKg).toFixed(2)}</div>
                      <button onClick={() => removeFromCart(item.stock.stockId)} style={{ background: '#fdecea', color: '#c0392b', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
                    </div>
                  </div>
                ))}
                <div style={{ background: '#f8f9fa', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8e2' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>Total Amount</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#27ae60' }}>
                      Rs. {cart.reduce((sum, item) => sum + (item.qty * item.stock.pricePerKg), 0).toFixed(2)}
                    </div>
                  </div>
                  <button 
                    onClick={checkout}
                    disabled={saving}
                    style={{ background: '#d35400', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontWeight: 700, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer' }}
                  >
                    {saving ? 'Processing...' : 'Checkout & Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <div className="animate-fade">
            <div className="page-header" style={{ marginBottom: 24 }}>
              <div><div className="page-title">My Profile</div><div className="page-sub">Manage your account details</div></div>
              <button className="btn btn-primary" onClick={openEdit}>✏️ Edit Profile</button>
            </div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #f39c12, #e67e22)', border: '3px solid #f39c12', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {user.profilePicture ? <img src={user.profilePicture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ color: 'white', fontWeight: 700, fontSize: '2rem' }}>{(user.name || 'C').charAt(0).toUpperCase()}</span>}
                </div>
                <div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.4rem', fontWeight: 700, color: 'var(--green-deep)' }}>{user.name}</div>
                  <div style={{ color: 'var(--text-light)', fontSize: '0.86rem', marginTop: 4 }}>{user.email}</div>
                  <span className={`status-badge status-${user.status}`} style={{ marginTop: 8, display: 'inline-block' }}>{user.status}</span>
                </div>
              </div>
              {[['Phone', user.phone], ['NIC', user.nic], ['Delivery Address', user.deliveryAddress], ['Email', user.email]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #f5f5f5', fontSize: '0.88rem' }}>
                  <span style={{ color: 'var(--text-light)', fontWeight: 600, fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.4px' }}>{l}</span>
                  <span style={{ fontWeight: 500 }}>{v || '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAVIGATION BAR */}
      <div style={{ 
        position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px', 
        background: 'white', borderTop: '1px solid #e2e8e2', 
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)', zIndex: 100 
      }}>
        {navItems.map(item => (
          <div 
            key={item.id} 
            onClick={() => setTab(item.id)}
            style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', 
              cursor: 'pointer', padding: '8px 16px',
              color: tab === item.id ? '#4a9e3f' : '#7f8c8d',
              transform: tab === item.id ? 'scale(1.05)' : 'scale(1)',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{item.icon}</div>
            <div style={{ fontSize: '0.75rem', fontWeight: tab === item.id ? 700 : 500 }}>{item.label}</div>
            {tab === item.id && <div style={{ width: 20, height: 3, background: '#4a9e3f', borderRadius: 2, marginTop: 4 }} />}
          </div>
        ))}
      </div>

      {/* Edit Profile Modal */}
      <Modal open={editOpen} title="Edit Profile" onClose={() => setEditOpen(false)} width={460}
        actions={<>
          <button className="btn btn-ghost" onClick={() => setEditOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving…' : 'Save Changes'}</button>
        </>}
      >
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div onClick={() => document.getElementById('custPicInput').click()} style={{ width: 72, height: 72, borderRadius: '50%', background: picPreview ? 'transparent' : 'linear-gradient(135deg, #f39c12, #e67e22)', border: '3px solid #f39c12', overflow: 'hidden', cursor: 'pointer', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {picPreview ? <img src={picPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" /> : <span style={{ fontSize: '1.8rem' }}>📷</span>}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-light)' }}>Click to change photo</div>
          <input id="custPicInput" type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={handlePic} />
        </div>
        {[['Full Name', 'name', 'text', 'Nimali Silva'], ['Phone Number', 'phone', 'tel', '0771234567'], ['NIC Number', 'nic', 'text', '123456789V or 12 digits'], ['Delivery Address', 'deliveryAddress', 'text', 'No. 12, Galle Road, Colombo 3']].map(([l, id, t, ph]) => (
          <div key={id} className="form-group">
            <label className="label">{l}</label>
            <input className="input" type={t} value={form[id] || ''} onChange={e => { setForm(f => ({ ...f, [id]: e.target.value })); setErrs(er => ({ ...er, [id]: '' })); }} placeholder={ph} />
            {errs[id] && <div className="field-err">{errs[id]}</div>}
          </div>
        ))}
      </Modal>

      {/* Change Password Modal */}
      <Modal open={pwOpen} title="Change Password" onClose={() => setPwOpen(false)} width={420}
        actions={<>
          <button className="btn btn-ghost" onClick={() => setPwOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={changePassword} disabled={saving}>{saving ? 'Changing…' : 'Change Password'}</button>
        </>}
      >
        {[['Current Password', 'current'], ['New Password', 'new'], ['Confirm New Password', 'confirm']].map(([l, id]) => (
          <div key={id} className="form-group">
            <label className="label">{l}</label>
            <input className="input" type="password" value={pwForm[id] || ''} onChange={e => { setPwForm(f => ({ ...f, [id]: e.target.value })); setPwErrs(er => ({ ...er, [id]: '' })); }} />
            {pwErrs[id] && <div className="field-err">{pwErrs[id]}</div>}
          </div>
        ))}
      </Modal>

      {/* Cart Modal */}
      <Modal open={cartModalOpen} title="Add to Cart" onClose={() => setCartModalOpen(false)} width={400}
        actions={<>
          <button className="btn btn-ghost" onClick={() => setCartModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={confirmAddToCart} style={{ background: '#4a9e3f' }}>Confirm</button>
        </>}
      >
        {selectedStock && (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#1a3a0a' }}>{selectedStock.vegetableName}</h3>
            <p style={{ margin: '0 0 20px 0', color: '#7f8c8d', fontSize: '0.9rem' }}>
              Price: Rs. {selectedStock.pricePerKg} / kg <br />
              Available: {selectedStock.quantityKg} kg
            </p>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="label">Quantity (kg)</label>
              <input 
                className="input" 
                type="number" 
                min="0.1" 
                max={selectedStock.quantityKg}
                step="0.1"
                value={cartQty} 
                onChange={e => setCartQty(e.target.value)} 
              />
            </div>
            <div style={{ marginTop: 20, padding: 15, background: '#f8f9fa', borderRadius: 8, fontWeight: 'bold' }}>
              Total: Rs. {((parseFloat(cartQty) || 0) * selectedStock.pricePerKg).toFixed(2)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
