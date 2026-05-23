import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../Css/aidemand.css';
import { API_BASE_URL } from '../api/config';

const AIDemand = () => {
  const [stocks, setStocks] = useState([]);
  const [predictionsByStockId, setPredictionsByStockId] = useState({});
  const [farmerId, setFarmerId] = useState(() => {
    const user = JSON.parse(sessionStorage.getItem('loggedUser') || 'null');
    return user?.farmerId || user?.id || '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStockId, setSelectedStockId] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState('');
  const [statusInput, setStatusInput] = useState('');
  const [qtyInput, setQtyInput] = useState('');
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [aiSortOrder, setAiSortOrder] = useState('highest-risk');
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [demandOverviewData, setDemandOverviewData] = useState([]);

  // Load farmer ID from session and fetch live stock data.
  useEffect(() => {
    const loggedUserStr = sessionStorage.getItem('loggedUser');
    const loggedUser = loggedUserStr ? JSON.parse(loggedUserStr) : null;
    const resolvedFarmerId = loggedUser?.farmerId || loggedUser?.id || '';
    setFarmerId(resolvedFarmerId);
    fetchStocks(resolvedFarmerId);
  }, []);

  const fetchStocks = async (resolvedFarmerId) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/farmer/stocks/farmer/${resolvedFarmerId}`);
      if (!res.ok) {
        throw new Error('Failed to load stocks from backend');
      }

      const payload = await res.json();
      const rows = Array.isArray(payload)
        ? payload
        : Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload.items)
        ? payload.items
        : [];
      const normalizedStocks = rows.map((item) => ({
        ...item,
        id: item.stockId || item.id,
        expiryDate: item.expiryEstimate || item.expiryDate,
        status: item.availabilityStatus || item.status || 'Available',
      }));

      setStocks(normalizedStocks);
    } catch (err) {
      setError(err.message || 'Could not load stock data');
      setStocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!stocks.length) {
      setPredictionsByStockId({});
      return;
    }

    // No specialized prediction backend available; populate with empty prediction data.
    setPredictionsByStockId({});
  }, [stocks]);

  // Auto-populate price when vegetable is selected
  useEffect(() => {
    if (selectedStockId) {
      const selected = stocks.find(s => String(s.id) === String(selectedStockId));
      if (selected) {
        setPriceInput(selected.pricePerKg ?? '');
        setCalculatedPrice(selected.pricePerKg ?? '');
        setStatusInput(selected.status || 'Available');
        setQtyInput(selected.quantityKg ?? '');
      }
    } else {
      setPriceInput('');
      setCalculatedPrice('');
      setStatusInput('');
      setQtyInput('');
    }
  }, [selectedStockId, stocks]);

  const handleDiscountClick = (discountPercent) => {
    if (!selectedStockId) {
      alert('Please select a vegetable first');
      return;
    }
    const currentPrice = stocks.find(s => String(s.id) === String(selectedStockId))?.pricePerKg;
    if (currentPrice) {
      const discountedPrice = currentPrice - (currentPrice * discountPercent / 100);
      const finalPrice = Number(discountedPrice.toFixed(2));
      setPriceInput(finalPrice);
      setCalculatedPrice(finalPrice);
    }
  };

  const handlePriceInputChange = (e) => {
    const value = e.target.value;
    setPriceInput(value);
    if (value) {
      setCalculatedPrice(Number(value).toFixed(2));
    }
  };

  const handleUpdatePrice = async () => {
    if (!selectedStockId || !priceInput) return;

    try {
      const res = await fetch(`${API_BASE_URL}/farmer/stocks/${selectedStockId}/price`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricePerKg: priceInput })
      });
      if (res.ok) {
        alert('Price updated successfully');
        fetchStocks(farmerId);
        setIsQuickActionOpen(false);
      } else {
        alert('Failed to update price');
      }
    } catch (e) {
      alert('Error updating price');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedStockId || !statusInput) return;

    try {
      const res = await fetch(`${API_BASE_URL}/farmer/stocks/${selectedStockId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availabilityStatus: statusInput })
      });
      if (res.ok) {
        alert('Status updated successfully');
        fetchStocks(farmerId);
        setIsQuickActionOpen(false);
      } else {
        alert('Failed to update status');
      }
    } catch (e) {
      alert('Error updating status');
    }
  };

  const handleUpdateQty = async () => {
    if (!selectedStockId || !qtyInput) return;

    try {
      const res = await fetch(`${API_BASE_URL}/farmer/stocks/${selectedStockId}/quantity`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantityKg: qtyInput })
      });
      if (res.ok) {
        alert('Quantity updated successfully');
        fetchStocks(farmerId);
        setIsQuickActionOpen(false);
      } else {
        alert('Failed to update quantity');
      }
    } catch (e) {
      alert('Error updating quantity');
    }
  };

  const handleDelete = async (stockId) => {
    if (!window.confirm('Are you sure you want to delete this stock?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/farmer/stocks/${stockId}`, { method: 'DELETE' });
      if (res.ok) {
        setStocks(stocks.filter(s => s.id !== stockId));
        alert('Stock deleted successfully');
      } else {
        alert('Failed to delete stock');
      }
    } catch (err) {
      alert('Error deleting stock: ' + err.message);
    }
  };

  const handleEdit = (stockId) => {
    setSelectedStockId(String(stockId));
    setIsQuickActionOpen(true);
  };

  const isStockExpired = (stock) => {
    if (!stock?.expiryDate) return false;
    return getDaysUntilExpiry(stock.expiryDate) < 0;
  };

  const isStockUnavailable = (stock) => {
    const status = String(stock?.status || '').toLowerCase();
    return status === 'unavailable';
  };

  const activeStocks = stocks.filter((stock) => !isStockUnavailable(stock) && !isStockExpired(stock));

  const handleApplySuggestedPrice = (stockId, suggestedPrice) => {
    setSelectedStockId(String(stockId));
    setPriceInput(suggestedPrice);
    setCalculatedPrice(suggestedPrice);
    setIsQuickActionOpen(true);
  };

  const openQuickActionModal = () => {
    if (!selectedStockId && activeStocks.length > 0) {
      setSelectedStockId(String(activeStocks[0].id));
    }
    setIsQuickActionOpen(true);
  };

  const openDemandOverview = () => {
    setIsDemandModalOpen(true);
    const demandData = stocks.map((stock) => {
      const quantity = Number(stock.quantityKg || 0);
      const demandEstimate = Math.max(0, Math.round(quantity * (stock.status === 'Low Stock' ? 0.85 : 0.75)));
      const suggestedPrice = Number((Number(stock.pricePerKg || 0) * (stock.status === 'Low Stock' ? 0.95 : 0.9)).toFixed(2));
      return {
        stockId: stock.id,
        vegetableName: stock.vegetableName,
        category: stock.category,
        quantityKg: quantity,
        currentPricePerKg: Number(stock.pricePerKg || 0),
        suggestedPricePerKg: suggestedPrice,
        estimatedDemandKg: demandEstimate,
        riskLevel: stock.status === 'Low Stock' ? 'High' : 'Medium',
      };
    });
    setDemandOverviewData(demandData);
  };

  function getDaysUntilExpiry(expiryDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);
    return Math.floor((exp - now) / (1000 * 60 * 60 * 24));
  }

  const getWastageRisk = (daysLeft) => {
    if (daysLeft <= 1) return 'High';
    if (daysLeft <= 4) return 'Medium';
    return 'Low';
  };

  const aiPredictions = activeStocks.map((stock) => {
    const serverPrediction = predictionsByStockId[stock.id];
    const estimatedDemand = Number(
      serverPrediction?.weeklyDemandKg ??
      (stock.quantityKg * (stock.status === 'Low Stock' ? 0.5 : 0.8)).toFixed(1)
    );
    const daysLeft = getDaysUntilExpiry(stock.expiryDate);
    const risk = serverPrediction?.wastageRisk || getWastageRisk(daysLeft);
    const suggestedPrice = Number(
      serverPrediction?.predictedPricePerKg ??
      (stock.pricePerKg * (risk === 'High' ? 0.6 : risk === 'Medium' ? 0.8 : 1)).toFixed(2)
    );
    const potentialWastage = Math.max(0, stock.quantityKg - estimatedDemand);
    const potentialLoss = Number((potentialWastage * stock.pricePerKg).toFixed(2));

    const generateActionMessage = () => {
      if (serverPrediction?.message) return serverPrediction.message;
      if (stock.backendMessage) return stock.backendMessage;
      
      const wastagePercentage = stock.quantityKg > 0 ? (potentialWastage / stock.quantityKg) * 100 : 0;
      
      if (daysLeft < 0) {
        return "CRITICAL: Stock has expired. Remove from inventory immediately to prevent contamination.";
      }
      if (daysLeft <= 2 && potentialWastage > 0) {
        return `URGENT: Expiring in ${daysLeft} days with ${potentialWastage.toFixed(1)}kg excess. Apply heavy discount (Rs. ${suggestedPrice}) to clear stock instantly.`;
      }
      if (wastagePercentage >= 50) {
        return `High wastage risk (${wastagePercentage.toFixed(0)}% unsold). Initiate a flash sale at Rs. ${suggestedPrice} to boost sales velocity.`;
      }
      if (wastagePercentage >= 20) {
        return `Moderate overstock identified. Suggest lowering price to Rs. ${suggestedPrice} to match predicted weekly demand of ${estimatedDemand}kg.`;
      }
      if (stock.status === 'Low Stock' || stock.quantityKg < 10) {
        return `Low inventory (${stock.quantityKg}kg remaining). Current demand trend is strong. Consider restocking soon.`;
      }
      if (potentialWastage === 0 && daysLeft > 4) {
        return `Optimal Inventory: Stock levels perfectly match predicted demand. Maintain current price of Rs. ${stock.pricePerKg}/kg.`;
      }
      
      return `Demand is stable. Maintain current strategy and continue tracking daily sales.`;
    };

    const backendMessage = generateActionMessage();

    return {
      ...stock,
      estimatedDemand,
      daysLeft,
      risk,
      suggestedPrice,
      potentialWastage,
      potentialLoss,
      backendMessage,
    };
  }).filter((prediction) => prediction.daysLeft >= 0);

  const sortedAiPredictions = [...aiPredictions].sort((a, b) => {
    if (aiSortOrder === 'highest-loss') {
      return b.potentialLoss - a.potentialLoss;
    }
    if (aiSortOrder === 'highest-risk') {
      const riskOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      const riskA = riskOrder[a.risk] || 0;
      const riskB = riskOrder[b.risk] || 0;
      if (riskA !== riskB) return riskB - riskA;
      return b.potentialLoss - a.potentialLoss; // break tie with loss
    }
    if (aiSortOrder === 'name') {
      return a.vegetableName.localeCompare(b.vegetableName);
    }
    return 0;
  });

  return (
    <main className="demand-page">
      {/* Page Header */}
      <section className="demand-header">
        <h1>AI Demand & Predictions</h1>
        <p>Machine learning powered insights for your farm stocks.</p>
        <p>Farmer: {farmerId}</p>
        <div className="demand-topics">
          <Link to="/" className="topic-chip home-topic">Home</Link>
          <button className="topic-chip" onClick={openDemandOverview} style={{border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', fontWeight: 'bold'}}>Demand</button>
          <Link to="/wastage-report" className="topic-chip report-topic">Financial Report</Link>
          <button type="button" className="topic-chip quick-action-topic" onClick={openQuickActionModal}>Update Price</button>
        </div>
      </section>

      {loading && <p className="demand-status-text">Loading stock data...</p>}
      {error && (
        <p className="demand-status-text demand-status-error" role="alert">
          <span className="warning-icon" aria-hidden="true">!</span>
          <span>{error}</span>
        </p>
      )}

      {/* AI INSIGHTS SECTION */}
      <div className="ai-insights-section">
        <div className="ai-section-header">
          <div className="ai-header-left">
            <div className="ai-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a4 4 0 014 4c0 1.95-1.4 3.58-3.25 3.93"/>
                <path d="M8 6a4 4 0 108 0"/>
                <path d="M12 18v4"/>
                <path d="M8 22h8"/>
                <rect x="7" y="10" width="10" height="8" rx="2"/>
              </svg>
            </div>
            <div>
              <h2>AI Demand Predictions</h2>
              <p className="ai-subtitle">Machine learning powered insights</p>
            </div>
          </div>
          <div className="ai-status-badge">
            <span className="ai-dot"></span>
            Connected
          </div>
        </div>
        <div className="ai-controls-bar" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <select value={aiSortOrder} onChange={e => setAiSortOrder(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="highest-risk">Sort by: Highest Risk</option>
              <option value="highest-loss">Sort by: Highest Financial Loss</option>
              <option value="name">Sort by: Vegetable Name (A-Z)</option>
            </select>
        </div>

        {/* Prediction Cards */}
        {sortedAiPredictions.length > 0 && (
          <div className="ai-cards-grid">
            {sortedAiPredictions.map((item) => (
              <div key={item.id} className={`ai-card ${item.risk.toLowerCase()}`}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px'}}>
                   <h3 style={{fontSize: '18px', margin: 0}}>{item.vegetableName}</h3>
                   <span className={`ai-risk ${item.risk.toLowerCase()}`} style={{fontWeight: '800', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', textTransform: 'uppercase'}}>{item.risk} Risk</span>
                </div>
                
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px'}}>
                   <div style={{backgroundColor: 'rgba(255,255,255,0.6)', padding: '10px 8px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.05)', textAlign: 'center'}}>
                     <div style={{fontSize: '11px', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px'}}>Current Stock</div>
                     <div style={{fontWeight: '900', fontSize: '15px'}}>{item.quantityKg} kg</div>
                   </div>
                   <div style={{backgroundColor: item.daysLeft <= 3 ? 'rgba(254, 226, 226, 0.8)' : 'rgba(255,255,255,0.6)', padding: '10px 8px', borderRadius: '6px', border: item.daysLeft <= 3 ? '1px solid rgba(248, 113, 113, 0.5)' : '1px solid rgba(0,0,0,0.05)', textAlign: 'center'}}>
                     <div style={{fontSize: '11px', color: item.daysLeft <= 3 ? '#991b1b' : '#4b5563', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', fontWeight: item.daysLeft <= 3 ? 'bold' : 'normal'}}>Expiry</div>
                     <div style={{fontWeight: '900', fontSize: '15px', color: item.daysLeft <= 3 ? '#b91c1c' : '#111827'}}>{item.daysLeft >= 0 ? `${item.daysLeft} days` : 'Expired'}</div>
                   </div>
                </div>

                <div style={{backgroundColor: 'rgba(255,255,255,0.8)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                    <span style={{fontSize: '13px', color: '#374151', fontWeight: '800'}}>Weekly Demand:</span>
                    <span style={{fontSize: '16px', fontWeight: '900', color: '#047857'}}>{item.estimatedDemand} kg</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                    <span style={{fontSize: '13px', color: '#374151', fontWeight: '800'}}>Suggested Price:</span>
                    <span style={{fontSize: '16px', fontWeight: '900', color: '#1d4ed8'}}>Rs. {item.suggestedPrice}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed #cbd5e1'}}>
                    <span style={{fontSize: '13px', color: '#374151', fontWeight: '800'}}>Potential Loss:</span>
                    <span style={{fontSize: '16px', fontWeight: '900', color: item.potentialLoss > 0 ? '#dc2626' : '#16a34a'}}>Rs. {item.potentialLoss}</span>
                  </div>
                </div>
                
                <div className="ai-backend-message" style={{backgroundColor: 'rgba(255,255,255,0.9)', padding: '12px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', color: '#1f2937', border: '1px solid #d1d5db'}}>
                  <strong>Action:</strong> {item.backendMessage}
                </div>
                
                <div className="ai-card-actions">
                  <button 
                    className="ai-card-btn ai-card-btn-apply"
                    onClick={() => handleApplySuggestedPrice(item.id, item.suggestedPrice)}
                    style={{width: '100%', padding: '10px', backgroundColor: '#4caf50', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'}}
                  >
                    Quick Action: Update Price
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {isQuickActionOpen && (
        <div className="quick-action-modal-overlay" onClick={() => setIsQuickActionOpen(false)}>
          <div className="quick-action-panel quick-action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="quick-action-modal-head">
              <div>
                <div className="quick-action-header">Quick Stock Actions</div>
                <p className="quick-action-desc">Update price, status, or quantity for the selected stock</p>
              </div>
              <button className="quick-action-close" onClick={() => setIsQuickActionOpen(false)}>Close</button>
            </div>

            <div className="quick-action-row">
              <div className="quick-action-field">
                <label htmlFor="qaStockSelect">Select Vegetable</label>
                <select id="qaStockSelect" value={selectedStockId} onChange={(e) => setSelectedStockId(e.target.value)}>
                  <option value="">— Choose stock —</option>
                  {activeStocks.map(stock => (
                    <option key={stock.id} value={stock.id}>{stock.vegetableName}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedStockId && (
              <div className="qa-current-values">
                <div className="qa-current-item">
                  <span className="qa-current-label">Vegetable</span>
                  <span className="qa-current-value">{stocks.find(s => s.id == selectedStockId)?.vegetableName}</span>
                </div>
                <div className="qa-current-item">
                  <span className="qa-current-label">Quantity</span>
                  <span className="qa-current-value">{stocks.find(s => s.id == selectedStockId)?.quantityKg} kg</span>
                </div>
                <div className="qa-current-item">
                  <span className="qa-current-label">Price / kg</span>
                  <span className="qa-current-value">Rs. {stocks.find(s => s.id == selectedStockId)?.pricePerKg}</span>
                </div>
                <div className="qa-current-item">
                  <span className="qa-current-label">Status</span>
                  <span className="qa-current-value">{stocks.find(s => s.id == selectedStockId)?.status}</span>
                </div>
              </div>
            )}

            <div className="qa-actions">
              <div className="qa-action-card">
                <div className="qa-action-title">Update Price</div>
                <div className="qa-action-body">
                  <input 
                    type="number" 
                    placeholder="New price (Rs./kg)" 
                    step="0.01" 
                    min="0" 
                    className="qa-input"
                    value={priceInput}
                    onChange={handlePriceInputChange}
                  />
                  {calculatedPrice && (
                    <div className="qa-price-display">
                      <span className="qa-price-label">Calculated Price:</span>
                      <span className="qa-price-value">Rs. {calculatedPrice}</span>
                    </div>
                  )}
                  <div className="qa-preset-btns">
                    <button className="qa-preset" onClick={() => handleDiscountClick(0)}>-0%</button>
                    <button className="qa-preset" onClick={() => handleDiscountClick(5)}>-5%</button>
                    <button className="qa-preset" onClick={() => handleDiscountClick(10)}>-10%</button>
                    <button className="qa-preset" onClick={() => handleDiscountClick(20)}>-20%</button>
                    <button className="qa-preset" onClick={() => handleDiscountClick(50)}>-50%</button>
                  </div>
                  <button className="qa-btn qa-btn-price" onClick={handleUpdatePrice}>Update Price</button>
                </div>
              </div>
              <div className="qa-action-card">
                <div className="qa-action-title">Change Status</div>
                <div className="qa-action-body">
                  <select className="qa-input" value={statusInput} onChange={(e) => setStatusInput(e.target.value)}>
                    <option value="">-- Select new status --</option>
                    <option value="Available">Available</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                  <button className="qa-btn qa-btn-status" onClick={handleUpdateStatus}>Update Status</button>
                </div>
              </div>
              <div className="qa-action-card">
                <div className="qa-action-title">Update Quantity</div>
                <div className="qa-action-body">
                  <input type="number" placeholder="New quantity (kg)" step="0.01" min="0" className="qa-input" value={qtyInput} onChange={(e) => setQtyInput(e.target.value)}/>
                  <button className="qa-btn qa-btn-qty" onClick={handleUpdateQty}>Update Quantity</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDemandModalOpen && (
        <div className="quick-action-modal-overlay" onClick={() => setIsDemandModalOpen(false)}>
          <div className="quick-action-panel quick-action-modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '800px', width: '90%'}}>
            <div className="quick-action-modal-head">
              <div>
                <div className="quick-action-header">Demand Overview</div>
                <p className="quick-action-desc">Quick view of stock, predicted demand, and suggested prices</p>
              </div>
              <button className="quick-action-close" onClick={() => setIsDemandModalOpen(false)}>Close</button>
            </div>
            
            <div className="items-section table-wrapper" style={{padding: '20px'}}>
              <table className="stock-table" style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
                <thead>
                  <tr style={{backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0'}}>
                    <th style={{padding: '12px'}}>Vegetable Name</th>
                    <th style={{padding: '12px'}}>Current Stock</th>
                    <th style={{padding: '12px'}}>Predicted Demand</th>
                    <th style={{padding: '12px'}}>Suggested Price</th>
                  </tr>
                </thead>
                <tbody>
                  {demandOverviewData.map((item, idx) => (
                    <tr key={idx} style={{borderBottom: '1px solid #E2E8F0'}}>
                      <td style={{padding: '12px'}}>{item.vegetableName}</td>
                      <td style={{padding: '12px'}}>{item.currentStock} kg</td>
                      <td style={{padding: '12px', color: '#16A34A', fontWeight: 'bold'}}>{item.predictedDemand} kg</td>
                      <td style={{padding: '12px', fontWeight: 'bold'}}>Rs. {item.suggestedPrice} /kg</td>
                    </tr>
                  ))}
                  {demandOverviewData.length === 0 && (
                    <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px'}}>Loading...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STOCKS TABLE SECTION */}
      <section className="stocks-section">
        <h2>Stock Details</h2>

        <div className="controls">
          <div className="search-bar">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" id="searchInput" placeholder="Search by vegetable name..."/>
          </div>
          <div className="filter-sort">
            <select id="categoryFilter">
              <option value="">All Categories</option>
              <option value="Leafy">Leafy</option>
              <option value="Root">Root</option>
              <option value="Fruit">Fruit</option>
            </select>
            <select id="sortSelect">
              <option value="">Sort By...</option>
              <option value="harvest-date">Newest Harvest</option>
              <option value="quantity">Highest Quantity</option>
              <option value="price">Highest Price</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="stock-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Vegetable</th>
                <th>Quantity</th>
                <th>Predicted Demand</th>
                <th>Price</th>
                <th>Suggested Price</th>
                <th>Quality</th>
                <th>Days to Expiry</th>
                <th>Spoilage Risk</th>
                <th>Status</th>
                <th>Financial Loss</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeStocks.map((stock) => {
                const prediction = aiPredictions.find(p => p.id === stock.id);
                const daysLeft = getDaysUntilExpiry(stock.expiryDate);
                const expiryLabel = daysLeft >= 0 ? `${daysLeft} days` : 'Expired';
                return (
                  <tr key={stock.id}>
                    <td>{stock.id}</td>
                    <td>{stock.vegetableName}</td>
                    <td>{stock.quantityKg} kg</td>
                    <td style={{ color: '#16a34a', fontWeight: 'bold' }}>{prediction?.estimatedDemand ?? '-'} kg</td>
                    <td>Rs. {stock.pricePerKg ?? '-'}</td>
                    <td style={{ color: '#2563eb', fontWeight: 'bold' }}>Rs. {prediction?.suggestedPrice ?? '-'}</td>
                    <td>{stock.qualityGrade ?? '-'}</td>
                    <td style={{ color: daysLeft <= 3 ? '#dc2626' : 'inherit', fontWeight: daysLeft <= 3 ? 'bold' : 'normal' }}>
                      {stock.expiryDate ? expiryLabel : 'Unknown'}
                    </td>
                    <td><span className={`risk-badge ${String(prediction?.risk || 'unknown').toLowerCase()}`}>{prediction?.risk ?? 'Unknown'}</span></td>
                    <td><span className={`status-badge ${String(stock.status || 'unknown').toLowerCase().replace(/\s+/g, '-')}`}>{stock.status || 'Unknown'}</span></td>
                    <td style={{ color: (prediction?.potentialLoss ?? 0) > 0 ? '#dc2626' : 'inherit', fontWeight: (prediction?.potentialLoss ?? 0) > 0 ? 'bold' : 'normal' }}>
                      {(prediction?.potentialLoss ?? 0) > 0 ? `Rs. ${prediction?.potentialLoss}` : '-'}
                    </td>
                    <td>
                      <button className="action-btn edit-btn" onClick={() => handleEdit(stock.id)}>Edit</button>
                      <button className="action-btn delete-btn" onClick={() => handleDelete(stock.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
};

export default AIDemand;
