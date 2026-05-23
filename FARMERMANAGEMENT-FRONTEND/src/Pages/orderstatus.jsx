import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api/config';
import '../Css/orderstatus.css';

const OrderStatus = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const API_ORDER_URL = `${API_BASE_URL}/farmer/orders`;
  const farmerId = JSON.parse(sessionStorage.getItem('loggedUser') || '{}')?.farmerId || '';

  useEffect(() => {
    if (!farmerId) {
      setError('Farmer not logged in.');
      setOrders([]);
      return;
    }
    fetchOrders();
  }, [farmerId]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_ORDER_URL}/farmer/${farmerId}`);
      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(result.message || 'Failed to load orders');
      }

      setOrders(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || 'Error communicating with backend');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    if (!window.confirm(`Update order status to ${newStatus}?`)) return;

    try {
      const res = await fetch(`${API_ORDER_URL}/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus })
      });

      const result = await res.json();

      if (!res.ok || result.success === false) {
        throw new Error(result.message || 'Failed to update status');
      }

      setOrders(prev =>
        prev.map(order =>
          order.orderId === orderId ? { ...order, orderStatus: newStatus } : order
        )
      );
      window.alert('Status updated successfully!');
    } catch (err) {
      window.alert('Could not update status: ' + err.message);
    }
  };

  const safeDate = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString();
  };

  const safeTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredOrders = orders.filter(o =>
    (filterStatus === '' || o.orderStatus === filterStatus) &&
    ((o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.vegetableName || '').toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="order-page">
      <div className="order-header">
        <h1>📦 Manage Customer Orders</h1>
        <p>View and update the status of orders placed by customers for your stocks.</p>
      </div>

      <div className="order-container">
        {error && <div className="order-status-error"><span className="warning-icon">!</span> {error}</div>}

        <div className="order-controls">
          <div className="order-search">
            <input 
              type="text" 
              placeholder="Search by customer or item..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="order-filter">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="READY">Ready</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="order-status-text">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="order-status-text" style={{ color: '#666' }}>No orders found.</div>
        ) : (
          <div className="order-table-wrapper">
            <table className="order-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date & Time</th>
                  <th>Customer</th>
                  <th>Item</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.orderId}>
                    <td><strong>#{order.orderId}</strong></td>
                    <td>
                      <div>{safeDate(order.createdAt)}</div>
                      <div className="text-muted">{safeTime(order.createdAt)}</div>
                    </td>
                    <td>
                      <div>{order.customerName}</div>
                      <div className="text-muted">{order.deliveryAddress}</div>
                    </td>
                    <td>
                      <div>{order.vegetableName}</div>
                      <div className="text-muted">{order.quantityKg} kg @ Rs.{order.pricePerKg}</div>
                    </td>
                    <td><strong>Rs. {order.totalAmount.toFixed(2)}</strong></td>
                    <td>
                      <span className={`status-badge status-${order.orderStatus.toLowerCase()}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td>
                      <select 
                        className="btn-update" 
                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc' }}
                        value={order.orderStatus}
                        onChange={(e) => handleStatusUpdate(order.orderId, e.target.value)}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="CONFIRMED">Confirmed</option>
                        <option value="READY">Ready</option>
                        <option value="DISPATCHED">Dispatched</option>
                        <option value="DELIVERED">Delivered</option>
                        <option value="CANCELLED">Cancelled</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderStatus;