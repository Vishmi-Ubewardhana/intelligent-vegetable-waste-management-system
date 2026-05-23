import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../api/config'; // Added this import
import '../Css/viewstock.css';

function ViewStock() {
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [farmerId] = useState(() => {
    const user = JSON.parse(sessionStorage.getItem('loggedUser') || 'null');
    return user?.farmerId || user?.id || '';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState(null);
  const [alert, setAlert] = useState({ show: false, type: '', msg: '' });

  useEffect(() => {
    fetchStocks();
  }, [farmerId]);

  // --- CONNECTED TO BACKEND ---
  const fetchStocks = async () => {
    setLoading(true);
    try {
      // Changed port to 8080 and used API_BASE_URL
      // Assumes backend endpoint is: GET /api/farmer/stocks/farmer/{farmerId}
      const res = await fetch(`${API_BASE_URL}/farmer/stocks/farmer/${farmerId}`);
      
      if (!res.ok) throw new Error('Failed to fetch data from server');
      
      const responseData = await res.json();
      const rawStocks = responseData.data || (Array.isArray(responseData) ? responseData : []);
      const formattedStocks = rawStocks.map(item => ({
        ...item,
        id: item.stockId || item.id,
        orderId: item.orderId || item.orderID || '',
        expiryDate: item.expiryEstimate || item.expiryDate,
        status: item.availabilityStatus || item.status || 'Available',
      }));

      setStocks(formattedStocks);
      setFilteredStocks(formattedStocks);
    } catch (err) {
      setAlert({ show: true, type: 'error', msg: 'Could not connect to backend server' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE FROM BACKEND ---
  const confirmDelete = async () => {
    if (!stockToDelete) return;

    try {
      const res = await fetch(`${API_BASE_URL}/farmer/stocks/${stockToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setStocks((prev) => prev.filter((item) => item.id !== stockToDelete.id));
        setAlert({ show: true, type: 'success', msg: `${stockToDelete.vegetableName} deleted successfully` });
      } else {
        throw new Error('Failed to delete item');
      }
    } catch (err) {
      setAlert({ show: true, type: 'error', msg: 'Delete failed. Check backend connection.' });
    } finally {
      setIsDeleteModalOpen(false);
      setStockToDelete(null);
    }
  };

  // --- UPDATE IN BACKEND ---
  const handleSaveEdit = async () => {
    if (!editForm) return;

    // Basic validation remains same
    if (!editForm.vegetableName || !editForm.category || !editForm.qualityGrade) {
      setAlert({ show: true, type: 'error', msg: 'Please fill required fields before saving' });
      return;
    }

    const qty = parseFloat(editForm.quantityKg);
    const price = parseFloat(editForm.pricePerKg);
    
    try {
      const res = await fetch(`${API_BASE_URL}/farmer/stocks/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          quantityKg: qty,
          pricePerKg: price,
          availabilityStatus: editForm.status
        }),
      });

      if (res.ok) {
        // Refresh local state with updated data
        const responseData = await res.json();
        const updatedRaw = responseData.data || responseData;
        const updatedStock = {
           ...updatedRaw,
           id: updatedRaw.stockId || updatedRaw.id,
           expiryDate: updatedRaw.expiryEstimate || updatedRaw.expiryDate,
           status: updatedRaw.availabilityStatus || updatedRaw.status || 'Available'
        };

        setStocks((prev) =>
          prev.map((stock) => (stock.id === updatedStock.id ? updatedStock : stock))
        );
        setAlert({ show: true, type: 'success', msg: 'Stock updated successfully' });
        setIsEditModalOpen(false);
        setEditForm(null);
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      setAlert({ show: true, type: 'error', msg: 'Update failed. Check backend connection.' });
    }
  };

  // --- UI LOGIC (Sorting/Filtering/Risk) REMAINS EXACTLY THE SAME ---
  const getRiskRank = (riskLabel) => {
    const riskOrder = { Low: 1, Medium: 2, High: 3, Expired: 4, Unknown: 5 };
    return riskOrder[riskLabel] || 5;
  };

  useEffect(() => {
    const result = stocks.filter(
      (stock) =>
        stock.vegetableName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterCategory === '' || stock.category === filterCategory)
    );

    const sorted = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc': return a.vegetableName.localeCompare(b.vegetableName);
        case 'name-desc': return b.vegetableName.localeCompare(a.vegetableName);
        case 'harvest-asc': return new Date(a.harvestDate || 0) - new Date(b.harvestDate || 0);
        case 'harvest-desc': return new Date(b.harvestDate || 0) - new Date(a.harvestDate || 0);
        case 'expiry-asc': return new Date(a.expiryDate || 0) - new Date(b.expiryDate || 0);
        case 'expiry-desc': return new Date(b.expiryDate || 0) - new Date(a.expiryDate || 0);
        case 'risk-asc': return getRiskRank(getSpoilageRisk(a.expiryDate)) - getRiskRank(getSpoilageRisk(b.expiryDate));
        case 'risk-desc': return getRiskRank(getSpoilageRisk(b.expiryDate)) - getRiskRank(getSpoilageRisk(a.expiryDate));
        case 'quantity-asc': return (a.quantityKg || 0) - (b.quantityKg || 0);
        case 'quantity-desc': return (b.quantityKg || 0) - (a.quantityKg || 0);
        case 'quality-asc': return (a.qualityGrade || '').localeCompare(b.qualityGrade || '');
        case 'quality-desc': return (b.qualityGrade || '').localeCompare(a.qualityGrade || '');
        default: return 0;
      }
    });

    setFilteredStocks(sorted);
  }, [searchTerm, filterCategory, sortBy, stocks]);

  const getSpoilageRisk = (expiryDate) => {
    if (!expiryDate) return 'Unknown';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const daysLeft = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return 'Expired';
    if (daysLeft <= 2) return 'High';
    if (daysLeft <= 5) return 'Medium';
    return 'Low';
  };

  const getFinancialLoss = (stock) => {
    const totalValue = (stock.quantityKg || 0) * (stock.pricePerKg || 0);
    const risk = getSpoilageRisk(stock.expiryDate);
    if (risk === 'Expired') return totalValue;
    if (risk === 'High') return totalValue * 0.5;
    if (risk === 'Medium') return totalValue * 0.25;
    return totalValue * 0.1;
  };

  const handleEdit = (stock) => {
    setEditForm({
      ...stock,
      quantityKg: stock.quantityKg?.toString() || '',
      pricePerKg: stock.pricePerKg?.toString() || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditFieldChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDelete = (stock) => {
    setStockToDelete(stock);
    setIsDeleteModalOpen(true);
  };

  const totalStocks = filteredStocks.length;
  const highRiskCount = filteredStocks.filter((stock) => {
    const risk = getSpoilageRisk(stock.expiryDate);
    return risk === 'High' || risk === 'Expired';
  }).length;
  const totalQuantity = filteredStocks.reduce((sum, stock) => sum + (Number(stock.quantityKg) || 0), 0);

  return (
    <main className="main-content view-stock-page">
      <header className="top-bar stock-hero">
        <div className="greeting">
          <span className="hero-kicker">Inventory Dashboard</span>
          <h1>View Stock</h1>
          <p className="greeting-sub">Track your harvest stock, risk level, and quantities in one place</p>
          <div className="hero-meta">
            <span className="hero-chip">Farmer ID: {farmerId}</span>
            <span className="hero-chip">Visible items: {totalStocks}</span>
            <span className="hero-chip">High risk: {highRiskCount}</span>
            <span className="hero-chip">Total qty: {totalQuantity.toFixed(1)} kg</span>
          </div>
        </div>
      </header>

      <section className="stocks-section">
        <h2>Stock Details</h2>
        <div className="controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search vegetables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-sort">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="Leafy">Leafy</option>
              <option value="Root">Root</option>
              <option value="Fruit">Fruit</option>
            </select>
          </div>
          <div className="filter-sort">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name-asc">Vegetable A-Z</option>
              <option value="name-desc">Vegetable Z-A</option>
              <option value="harvest-asc">Harvest Date (Old to New)</option>
              <option value="harvest-desc">Harvest Date (New to Old)</option>
              <option value="expiry-asc">Expiry Date (Early to Late)</option>
              <option value="expiry-desc">Expiry Date (Late to Early)</option>
              <option value="risk-asc">Spoilage Risk (Low to High)</option>
              <option value="risk-desc">Spoilage Risk (High to Low)</option>
              <option value="quantity-asc">Quantity (Low to High)</option>
              <option value="quantity-desc">Quantity (High to Low)</option>
              <option value="quality-asc">Quality (A to Z)</option>
              <option value="quality-desc">Quality (Z to A)</option>
            </select>
          </div>
        </div>

        {alert.show && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

        <div className="table-wrapper">
          <table className="stock-table">
            <thead>
              <tr>
                <th>Stock ID</th>
                <th>Vegetable</th>
                <th>Category</th>
                <th>Quality</th>
                <th>Harvested Date</th>
                <th>Expiry Date</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Spoilage Risk</th>
                <th>Financial Loss</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="12">Connecting to farm database...</td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan="12">No stocks found for this farmer.</td>
                </tr>
              ) : (
                filteredStocks.map((stock) => (
                  <tr key={stock.id}>
                    <td>{stock.id || '-'}</td>
                    <td>{stock.vegetableName}</td>
                    <td>{stock.category}</td>
                    <td>{stock.qualityGrade || '-'}</td>
                    <td>{stock.harvestDate || '-'}</td>
                    <td>{stock.expiryDate || '-'}</td>
                    <td>{stock.quantityKg} kg</td>
                    <td>Rs. {stock.pricePerKg}</td>
                    <td>
                      <span className={`risk-badge ${getSpoilageRisk(stock.expiryDate).toLowerCase()}`}>
                        {getSpoilageRisk(stock.expiryDate)}
                      </span>
                    </td>
                    <td>Rs. {getFinancialLoss(stock).toFixed(2)}</td>
                    <td>
                      <span className={`status-badge ${stock.status.toLowerCase().replace(' ', '-')}`}>
                        {stock.status}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="table-btn table-btn-edit" onClick={() => handleEdit(stock)}>
                          Edit
                        </button>
                        <button className="table-btn table-btn-delete" onClick={() => handleDelete(stock)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODALS REMAIN THE SAME */}
      {isEditModalOpen && editForm && (
        <div className="modal">
          <div className="modal-content edit-modal-content">
            <h3>Edit Stock</h3>
            <div className="edit-form-grid">
              <input name="vegetableName" value={editForm.vegetableName} onChange={handleEditFieldChange} placeholder="Vegetable" />
              <select name="category" value={editForm.category} onChange={handleEditFieldChange}>
                <option value="Leafy">Leafy</option>
                <option value="Root">Root</option>
                <option value="Fruit">Fruit</option>
              </select>
              <input name="qualityGrade" value={editForm.qualityGrade} onChange={handleEditFieldChange} placeholder="Quality (A/B/C)" />
              <input type="date" name="harvestDate" value={editForm.harvestDate || ''} onChange={handleEditFieldChange} />
              <input type="date" name="expiryDate" value={editForm.expiryDate || ''} onChange={handleEditFieldChange} />
              <input type="number" step="0.1" name="quantityKg" value={editForm.quantityKg} onChange={handleEditFieldChange} placeholder="Quantity (kg)" />
              <input type="number" step="0.01" name="pricePerKg" value={editForm.pricePerKg} onChange={handleEditFieldChange} placeholder="Price per kg" />
              <select name="status" value={editForm.status || 'Available'} onChange={handleEditFieldChange}>
                <option value="Available">Available</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>

            <div className="modal-actions">
              <button className="table-btn table-btn-edit" onClick={handleSaveEdit}>Save</button>
              <button
                className="table-btn table-btn-delete"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditForm(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteModalOpen && stockToDelete && (
        <div className="modal">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete {stockToDelete.vegetableName}?</p>
            <div className="modal-actions">
              <button className="table-btn table-btn-delete" onClick={confirmDelete}>Confirm Delete</button>
              <button
                className="table-btn table-btn-edit"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setStockToDelete(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default ViewStock;