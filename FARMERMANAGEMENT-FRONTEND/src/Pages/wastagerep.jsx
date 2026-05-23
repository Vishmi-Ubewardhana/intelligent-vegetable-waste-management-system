import React, { useState, useEffect } from 'react';
import '../Css/wastagerep.css';
import { API_BASE_URL } from '../api/config';

const WastageReport = () => {
    const [farmerId, setFarmerId] = useState(() => {
        const user = JSON.parse(sessionStorage.getItem('loggedUser') || 'null');
        return user?.farmerId || user?.id || '';
    });
    const [farmerName, setFarmerName] = useState('Test Farmer');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [allWastageItems, setAllWastageItems] = useState([]);
    const [currentFilterSev, setCurrentFilterSev] = useState('ALL');
    const [kpiData, setKpiData] = useState(null);
    const [severityCounts, setSeverityCounts] = useState({});
    const [reportTimestamp, setReportTimestamp] = useState('');

    const API_BASE = API_BASE_URL;
    const getProfitGain = (item) => Number(item.profitGain ?? item.financialLoss ?? 0);
    const getUnitPrice = (item) => Number(item.unitPrice ?? item.pricePerKg ?? item.price ?? 0);
    const getTotalProfitGain = (items) => items.reduce((sum, item) => sum + getProfitGain(item), 0);

    useEffect(() => {
        const loggedUserStr = sessionStorage.getItem('loggedUser');
        if (loggedUserStr) {
            const loggedUser = JSON.parse(loggedUserStr);
            const resolvedFarmerId = loggedUser.farmerId || loggedUser.id || '';
            setFarmerId(resolvedFarmerId);
            setFarmerName(loggedUser.name || resolvedFarmerId);
            loadReport(resolvedFarmerId);
        } else {
            console.log("No user logged in, should redirect...");
            loadReport(farmerId);
        }
    }, []);

    const loadReport = (fId) => {
        setLoading(true);
        setError('');

        fetch(`${API_BASE}/farmer/stocks/farmer/${fId}/wastage-report`)
            .then(r => {
                if (!r.ok) throw new Error('Backend not reachable');
                return r.json();
            })
            .then(data => {
                setLoading(false);
                if (data.success) {
                    const mappedItems = (data.wastageItems || []).map((item) => ({
                        ...item,
                        profitGain: getProfitGain(item),
                    }));
                    setAllWastageItems(mappedItems);
                    setKpiData({
                        ...data,
                        totalProfitGain: data.totalProfitGain ?? getTotalProfitGain(mappedItems),
                    });
                    setSeverityCounts(data.severityCounts || {});
                    setReportTimestamp(data.generatedAt || new Date().toISOString());
                }
            })
            .catch(err => {
                setLoading(false);
                console.warn("Using Test Data because:", err.message);
                
                // --- TEST DATA FALLBACK ---
                const testData = {
                    success: true,
                    totalStockKg: 155.5,
                    totalWastageKg: 42.0,
                    totalFinancialLoss: 5200.00,
                    totalProfitGain: 5200.00,
                    wastagePercentage: 27.0,
                    generatedAt: new Date().toISOString(),
                    severityCounts: { CRITICAL: 1, HIGH: 1, MEDIUM: 1, LOW: 1, NONE: 1 },
                    wastageItems: [
                        { stockId: 101, vegetableName: 'Carrot', currentQuantityKg: 50.0, predictedDemandKg: 10.0, potentialWastageKg: 40.0, wastagePercentage: 80.0, daysUntilExpiry: 1, financialLoss: 4800.00, profitGain: 4800.00, severity: 'CRITICAL', quantitySold: 10.0, unitPrice: 120, recommendation: 'Price Drop 40% immediately' },
                        { stockId: 102, vegetableName: 'Leeks', currentQuantityKg: 20.0, predictedDemandKg: 18.0, potentialWastageKg: 2.0, wastagePercentage: 10.0, daysUntilExpiry: 5, financialLoss: 400.00, profitGain: 400.00, severity: 'LOW', quantitySold: 18.0, unitPrice: 200, recommendation: 'Monitor stock' }
                    ]
                };
                setAllWastageItems(testData.wastageItems);
                setKpiData(testData);
                setSeverityCounts(testData.severityCounts);
                setReportTimestamp(testData.generatedAt);
            });
    };

    const downloadReport = () => {
        const items = allWastageItems.length > 0 ? allWastageItems : [];
        const header = ['Vegetable', 'Stock (kg)', 'Wastage (kg)', 'Qty Sold (kg)', 'Unit Price', 'Days Left', 'Severity', 'Profit Gain', 'Loss If Not Sold'];
        const rows = items.map(item => [
            item.vegetableName || '',
            item.currentQuantityKg ?? item.stockKg ?? '',
            item.potentialWastageKg ?? item.wastageKg ?? '',
            item.quantitySold ?? '',
            getUnitPrice(item).toFixed(2),
            item.daysUntilExpiry ?? item.daysLeft ?? '',
            item.severity || item.wastageSeverity || '',
            getProfitGain(item).toFixed(2),
            ((item.potentialWastageKg ?? item.wastageKg ?? 0) * getUnitPrice(item)).toFixed(2),
        ]);

        const escapeValue = (value) => {
            const text = String(value ?? '');
            return text.includes(',') || text.includes('"') || text.includes('\n')
                ? `"${text.replace(/"/g, '""')}"`
                : text;
        };

        const csvContent = [header, ...rows].map(row => row.map(escapeValue).join(',')).join('\r\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `financial-report-${farmerId}-${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getFilteredItems = () => {
        return currentFilterSev === 'ALL'
            ? allWastageItems
            : allWastageItems.filter(i => i.severity === currentFilterSev);
    };

    const getSeverityLabel = (severity) => {
        switch (severity) {
            case 'CRITICAL': return '🔴 CRITICAL';
            case 'HIGH': return '🟠 HIGH';
            case 'MEDIUM': return '🟡 MEDIUM';
            case 'LOW': return '🟢 LOW';
            case 'NONE': return '✅ NONE';
            default: return '—';
        }
    };

    const filteredItems = getFilteredItems();

    return (
        <div className="report-container">
            <main className="main-wrapper">
                <div className="page-header">
                    <div className="page-header-left">
                        <h1>Financial Report</h1>
                        <p className="page-subtitle">Track profit gain and reduce vegetable spoilage</p>
                    </div>
                    <div className="page-header-right">
                        <div className="farmer-badge">
                            <span>{farmerName} ({farmerId})</span>
                        </div>
                        <button className="download-btn" onClick={downloadReport}>
                            Download CSV
                        </button>
                        <button className="refresh-btn" onClick={() => loadReport(farmerId)}>Refresh</button>
                    </div>
                </div>

                {!loading && kpiData && (
                    <>
                        <div className="kpi-grid">
                            <div className="kpi-card kpi-stock">
                                <div className="kpi-body">
                                    <div className="kpi-value">{kpiData.totalStockKg.toFixed(1)} kg</div>
                                    <div className="kpi-label">Total Stock</div>
                                </div>
                            </div>
                            <div className="kpi-card kpi-wastage">
                                <div className="kpi-body">
                                    <div className="kpi-value">{kpiData.totalWastageKg.toFixed(1)} kg</div>
                                    <div className="kpi-label">Potential Wastage</div>
                                </div>
                            </div>
                            <div className="kpi-card kpi-loss">
                                <div className="kpi-body">
                                    <div className="kpi-value">Rs. {kpiData.totalFinancialLoss.toFixed(2)}</div>
                                    <div className="kpi-label">Financial Loss</div>
                                </div>
                            </div>
                            <div className="kpi-card kpi-profit">
                                <div className="kpi-body">
                                    <div className="kpi-value">Rs. {(kpiData.totalProfitGain ?? 0).toFixed(2)}</div>
                                    <div className="kpi-label">Profit Gain</div>
                                </div>
                            </div>
                        </div>

                        <div className="filter-tabs" style={{margin: '20px 0', display: 'flex', gap: '10px'}}>
                            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                                <button 
                                    key={sev}
                                    className={`tab-btn ${currentFilterSev === sev ? 'active' : ''}`}
                                    onClick={() => setCurrentFilterSev(sev)}
                                >
                                    {sev}
                                </button>
                            ))}
                        </div>

                        <div className="items-section table-wrapper">
                            <table className="wastage-table stock-table">
                                <thead>
                                    <tr>
                                        <th>Vegetable</th>
                                        <th>Stock</th>
                                        <th>Wastage</th>
                                        <th>Qty Sold</th>
                                        <th>Unit Price</th>
                                        <th>Days Left</th>
                                        <th>Severity</th>
                                        <th>Profit Gain</th>
                                        <th>Loss If Not Sold</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map((item) => (
                                        <tr key={item.stockId}>
                                            <td>{item.vegetableName || 'Unknown'}</td>
                                            <td>{item.currentQuantityKg ?? item.stockKg ?? 0} kg</td>
                                            <td style={{color: '#EF4444', fontWeight: 'bold'}}>{item.potentialWastageKg ?? item.wastageKg ?? 0} kg</td>
                                            <td>{item.quantitySold ?? 0} kg</td>
                                            <td>Rs. {getUnitPrice(item).toFixed(2)}</td>
                                            <td>{item.daysUntilExpiry ?? item.daysLeft ?? 0}d</td>
                                            <td><span className={`risk-badge ${(item.severity || 'NONE').toLowerCase()}`}>{getSeverityLabel(item.severity || 'NONE')}</span></td>
                                            <td style={{color: '#16A34A', fontWeight: 'bold'}}>Rs. {getProfitGain(item).toFixed(2)}</td>
                                            <td style={{color: '#DC2626', fontWeight: 'bold'}}>Rs. {((item.potentialWastageKg ?? item.wastageKg ?? 0) * getUnitPrice(item)).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {filteredItems.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="empty-row" style={{textAlign: 'center', padding: '30px', color: '#666'}}>No items found for this severity.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default WastageReport;