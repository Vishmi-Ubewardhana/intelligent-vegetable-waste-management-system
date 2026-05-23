import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../Css/dashboard.css';
import { API_BASE_URL } from '../api/config';

const FarmerDashboard = () => {
    const navigate = useNavigate();
    const handleLogout = () => {
        sessionStorage.removeItem('loggedUser');
        navigate('/');
    };
    const [stocks, setStocks] = useState([]);
    const [farmerId, setFarmerId] = useState(() => {
      const user = JSON.parse(sessionStorage.getItem('loggedUser') || 'null');
      return user?.farmerId || user?.id || '';
    });
    const [wastageReport, setWastageReport] = useState(null);
    const [criticalSpoilageCount, setCriticalSpoilageCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const loggedUserStr = sessionStorage.getItem('loggedUser');
        const loggedUser = loggedUserStr ? JSON.parse(loggedUserStr) : null;
        const resolvedFarmerId = loggedUser?.farmerId || loggedUser?.id || '';
        setFarmerId(resolvedFarmerId);
        fetchDashboardData(resolvedFarmerId);
    }, []);

    const fetchDashboardData = async (resolvedFarmerId) => {
        setLoading(true);
        setError('');

        try {
            const [stocksResponse, wastageResponse, criticalResponse] = await Promise.allSettled([
                fetch(`${API_BASE_URL}/farmer/stocks/farmer/${resolvedFarmerId}`),
                fetch(`${API_BASE_URL}/farmer/stocks/farmer/${resolvedFarmerId}/wastage-report`),
                fetch(`${API_BASE_URL}/farmer/stocks/farmer/${resolvedFarmerId}/critical-spoilage`),
            ]);

            if (stocksResponse.status === 'fulfilled' && stocksResponse.value.ok) {
                const stockPayload = await stocksResponse.value.json();
                const rows = Array.isArray(stockPayload)
                    ? stockPayload
                    : Array.isArray(stockPayload.data)
                    ? stockPayload.data
                    : Array.isArray(stockPayload.items)
                    ? stockPayload.items
                    : [];
                const normalizedStocks = rows.map((item) => ({
                    ...item,
                    id: item.stockId ?? item.id,
                    status: item.availabilityStatus || item.status || 'Available',
                    expiryDate: item.expiryEstimate || item.expiryDate,
                    spoilageRisk: item.spoilageRisk || item.wastageSeverity || 'Unknown',
                }));
                setStocks(normalizedStocks);
            } else {
                setStocks([]);
            }

            if (wastageResponse.status === 'fulfilled' && wastageResponse.value.ok) {
                const wastagePayload = await wastageResponse.value.json();
                setWastageReport(wastagePayload);
            } else {
                setWastageReport(null);
            }

            if (criticalResponse.status === 'fulfilled' && criticalResponse.value.ok) {
                const criticalPayload = await criticalResponse.value.json();
                setCriticalSpoilageCount(Number(criticalPayload.count || (criticalPayload.data || []).length || 0));
            } else {
                setCriticalSpoilageCount(0);
            }
        } catch (err) {
            setError(err?.message || 'Failed to load dashboard data');
            setStocks([]);
            setWastageReport(null);
            setCriticalSpoilageCount(0);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        totalItems: stocks.length,
        totalQty: stocks.reduce((acc, curr) => acc + Number(curr.quantityKg || 0), 0),
        available: stocks.filter((s) => s.status === 'Available').length,
        lowStock: stocks.filter((s) => s.status === 'Low Stock').length,
        outOfStock: stocks.filter((s) => s.status === 'Out of Stock').length,
        criticalSpoilage: criticalSpoilageCount,
        financialWastage: wastageReport?.totalFinancialLoss ?? stocks.reduce((acc, curr) => acc + Number(curr.financialLoss || 0), 0),
        totalWastageKg: wastageReport?.totalWastageKg ?? 0,
    };

    const financialWastageValue = Number(stats.financialWastage || 0);
    const wastageItems = Array.isArray(wastageReport?.wastageItems)
        ? wastageReport.wastageItems
        : Array.isArray(wastageReport?.data)
        ? wastageReport.data
        : Array.isArray(wastageReport)
        ? wastageReport
        : [];
    const severityCounts = wastageReport?.severityCounts || wastageItems.reduce((counts, item) => {
        const severity = String(item.severity || item.wastageSeverity || 'UNKNOWN').toUpperCase();
        counts[severity] = (counts[severity] || 0) + 1;
        return counts;
    }, {});
    const severityOrder = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'];
    const severityChartData = severityOrder.map((severity) => ({
        severity,
        value: Number(severityCounts[severity] || 0),
    })).filter((item) => item.value > 0);
    const maxSeverityCount = Math.max(1, ...severityChartData.map((item) => item.value));
    const topRiskyItems = [...wastageItems]
        .sort((a, b) => Number(b.financialLoss || 0) - Number(a.financialLoss || 0))
        .slice(0, 5);
    const priceOverviewItems = [...stocks]
        .map((stock) => ({
            ...stock,
            sortDate: new Date(stock.updatedAt || stock.createdAt || stock.harvestDate || stock.expiryDate || 0).getTime() || 0,
        }))
        .sort((a, b) => b.sortDate - a.sortDate)
        .slice(0, 6)
        .map((stock) => ({
            id: stock.id,
            name: stock.vegetableName || stock.name || 'Unknown Vegetable',
            quantity: Number(stock.quantityKg || stock.quantity || 0),
            price: Number(stock.pricePerKg || stock.price || 0),
            dateLabel: stock.createdAt || stock.updatedAt || stock.harvestDate || stock.expiryDate || 'N/A',
        }));

    const formatDisplayDate = (value) => {
        if (!value) return 'N/A';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return String(value);
        return parsed.toLocaleDateString('en-GB');
    };

    return (
        <main className="main-content dashboard-page">
            <header className="top-bar">
                <div className="greeting">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h1 style={{ margin: 0 }}>Welcome back, {farmerId}</h1>
                        <button 
                            onClick={handleLogout}
                            style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', transition: 'background-color 0.2s', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}
                            onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
                            onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
                        >
                            Logout
                        </button>
                    </div>
                    <p className="greeting-sub" style={{ marginTop: '4px' }}>Live stock, spoilage, and wastage overview from the backend</p>
                </div>
                <div className="top-bar-right">
                    <div className="top-bar-badge">
                        <div className="badge-avatar">F</div>
                        <span>Farmer</span>
                    </div>
                </div>
            </header>

            <div className="page-content">
                {error && (
                    <div className="dashboard-alert dashboard-alert-error">
                        {error}
                    </div>
                )}

                {loading && (
                    <div className="dashboard-alert dashboard-alert-loading">
                        Loading live dashboard data...
                    </div>
                )}

                <div className="statistics-grid">
                    <StatCard icon="📦" label="Total Stocks" value={stats.totalItems} sub="vegetable types" color="green" />
                    <StatCard icon="⚖️" label="Total Quantity" value={`${stats.totalQty} kg`} sub="available" color="blue" />
                    <StatCard icon="✅" label="Available Items" value={stats.available} sub="in stock" color="emerald" />
                    <StatCard icon="⛔" label="Out of Stock" value={stats.outOfStock} sub="empty items" color="red" />
                    <StatCard icon="⚠️" label="Low Stock" value={stats.lowStock} sub="items" color="orange" />
                    <StatCard icon="🔥" label="Critical Spoilage" value={stats.criticalSpoilage} sub="urgent action required" color="yellow" />
                    <StatCard icon="₹" label="Financial Wastage" value={`Rs. ${financialWastageValue.toFixed(2)}`} sub="potential loss" color="red" />
                </div>

                <section className="insights-grid">
                    <div className="insight-card insight-chart-card">
                        <div className="insight-header">
                            <div>
                                <h2>Financial Trend</h2>
                                <p>Severity mix from the live financial report</p>
                            </div>
                            <span className="insight-pill">{wastageItems.length} items</span>
                        </div>

                        <div className="severity-chart">
                            {severityChartData.length > 0 ? severityChartData.map((item) => (
                                <div className="severity-bar-row" key={item.severity}>
                                    <div className="severity-label">{item.severity}</div>
                                    <div className="severity-bar-track">
                                        <div
                                            className={`severity-bar severity-bar-${item.severity.toLowerCase()}`}
                                            style={{ width: `${(item.value / maxSeverityCount) * 100}%` }}
                                        />
                                    </div>
                                    <div className="severity-value">{item.value}</div>
                                </div>
                            )) : (
                                <div className="insight-empty">No wastage data available yet.</div>
                            )}
                        </div>
                    </div>

                    <div className="insight-card insight-table-card">
                        <div className="insight-header">
                            <div>
                                <h2>Top Risky Items</h2>
                                <p>Highest potential losses from the backend report</p>
                            </div>
                            <span className="insight-pill">Top 5</span>
                        </div>

                        {topRiskyItems.length > 0 ? (
                            <div className="insight-table-wrap">
                                <table className="insight-table">
                                    <thead>
                                        <tr>
                                            <th>Vegetable</th>
                                            <th>Severity</th>
                                            <th>Wastage</th>
                                            <th>Loss</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topRiskyItems.map((item) => (
                                            <tr key={item.stockId || item.vegetableName}>
                                                <td>
                                                    <div className="insight-item-title">{item.vegetableName || 'Unknown item'}</div>
                                                    <div className="insight-item-sub">{item.daysUntilExpiry != null ? `${item.daysUntilExpiry} days left` : 'No expiry data'}</div>
                                                </td>
                                                <td>
                                                    <span className={`severity-chip severity-chip-${String(item.severity || item.wastageSeverity || 'NONE').toLowerCase()}`}>
                                                        {String(item.severity || item.wastageSeverity || 'NONE')}
                                                    </span>
                                                </td>
                                                <td>{Number(item.potentialWastageKg || 0).toFixed(1)} kg</td>
                                                <td>Rs. {Number(item.financialLoss || 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="insight-empty">No risky items to display yet.</div>
                        )}
                    </div>
                </section>

                <section className="price-overview-section">
                    <div className="section-title-row">
                        <div>
                            <h2>Vegetable Price Overview</h2>
                            <p>Latest stock prices and added dates from the backend</p>
                        </div>
                        <span className="section-pill">{priceOverviewItems.length} items</span>
                    </div>

                    {priceOverviewItems.length > 0 ? (
                        <div className="price-overview-grid">
                            {priceOverviewItems.map((item) => (
                                <div className="price-overview-card" key={item.id}>
                                    <div>
                                        <h3>{item.name}</h3>
                                        <p>{item.quantity} kg</p>
                                        <span>Added: {formatDisplayDate(item.dateLabel)}</span>
                                    </div>
                                    <div className="price-overview-value">
                                        <span>Rs.</span>
                                        <strong>{item.price.toFixed(2)}/kg</strong>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="price-overview-empty">No stock price data available yet.</div>
                    )}
                </section>
            </div>
        </main>
    );
};

const StatCard = ({ icon, label, value, sub, color }) => (
    <div className={`stat-card border-${color}`}>
        <div className={`stat-icon stat-icon-${color}`}>{icon}</div>
        <div className="stat-content">
            <h3>{label}</h3>
            <p className="stat-value">{value}</p>
            <span className="stat-label">{sub}</span>
        </div>
    </div>
);

export default FarmerDashboard;