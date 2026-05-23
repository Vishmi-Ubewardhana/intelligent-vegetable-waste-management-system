import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../api/config'; 
import '../Css/addstock.css'; 

// Helper function for date math
const addDays = (dateStr, days) => {
    if (!dateStr) return '';
    const time = new Date(dateStr).getTime();
    const newTime = time + (days * 24 * 60 * 60 * 1000);
    return new Date(newTime).toISOString().split('T')[0];
};

const vegetableCategoryMap = {
    'Cabbage': 'Leafy Vegetable',
    'Beans': 'Seed/Pod Vegetable',
    'Tomato': 'Fruit Vegetable',
    'Cauliflower': 'Flower Vegetable',
    'Potato': 'Root Vegetable',
    'Okra': 'Fruit Vegetable',
    'Brinjal': 'Fruit Vegetable',
    'Green chilli': 'Fruit Vegetable',
    'Onion': 'Bulb Vegetable',
    'Carrot': 'Root Vegetable'
};

const vegetableOptions = Object.keys(vegetableCategoryMap);

const AddStockForm = () => {
    const navigate = useNavigate();
    const getResolvedFarmerId = () => {
        const user = JSON.parse(sessionStorage.getItem('loggedUser') || '{}');
        return user?.farmerId || user?.id || '';
    };

    const [formData, setFormData] = useState({
        farmerId: getResolvedFarmerId(),
        vegetableName: '',
        category: '',
        harvestDate: '',
        quantityKg: '',
        pricePerKg: '',
        qualityGrade: '',
        expiryEstimate: ''
    });

    const [touched, setTouched] = useState({});
    const [errors, setErrors] = useState({});

    const [loading, setLoading] = useState(false);
    const [maxDate, setMaxDate] = useState('');

    useEffect(() => {
        // Handle timezone properly for maxDate 
        const tzoffset = (new Date()).getTimezoneOffset() * 60000;
        const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];
        setMaxDate(localISOTime);
    }, []);

    useEffect(() => {
        if (formData.vegetableName) {
            const autoCategory = vegetableCategoryMap[formData.vegetableName] || '';
            if (formData.category !== autoCategory) {
                setFormData((prev) => ({ ...prev, category: autoCategory }));
                if (touched.category) {
                    setErrors((prev) => ({ ...prev, category: validateField('category', autoCategory) }));
                }
            }
        }
    }, [formData.vegetableName]);

    const expiryMaxDate = formData.harvestDate ? addDays(formData.harvestDate, 14) : undefined; // 2 weeks limit

    const validateField = (name, value) => {
        let error = '';
        if (name === 'vegetableName' && !value) error = 'Vegetable Name is required';
        else if (name === 'category' && !value) error = 'Category is required';
        else if (name === 'harvestDate') {
            if (!value) error = 'Harvest Date is required';
            else if (value > maxDate) error = 'Harvest date cannot be in the future';
        }
        else if (name === 'quantityKg') {
            if (!value) error = 'Quantity is required';
            else if (parseFloat(value) <= 0) error = 'Quantity must be greater than 0';
        }
        else if (name === 'pricePerKg') {
            if (!value) error = 'Price is required';
            else if (parseFloat(value) <= 0) error = 'Price must be greater than 0';
        }
        else if (name === 'qualityGrade' && !value) error = 'Quality Grade is required';
        else if (name === 'expiryEstimate') {
            if (!value) error = 'Expiry Estimate is required';
            else if (formData.harvestDate && value < formData.harvestDate) error = 'Expiry date cannot be before harvest date';
            else if (expiryMaxDate && value > expiryMaxDate) error = 'Expiry date must be within 2 weeks after harvest date';
        }
        return error;
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setErrors(prev => ({ ...prev, [name]: error }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Ensure quality grade validation is responsive to clicks
        const updateData = { ...formData, [name]: value };
        setFormData(updateData);
        
        if (touched[name]) {
            let error = validateField(name, value);
            // Re-validate expiry if harvest date changes
            if (name === 'harvestDate') {
                if (updateData.expiryEstimate) {
                    const expiryErr = validateField('expiryEstimate', updateData.expiryEstimate);
                    setErrors(prev => ({ ...prev, [name]: error, expiryEstimate: expiryErr }));
                    return;
                }
            }
            setErrors(prev => ({ ...prev, [name]: error }));
        }
    };

    const validateAll = () => {
        const newErrors = {};
        Object.keys(formData).forEach(key => {
            if (key !== 'farmerId') {
                const err = validateField(key, formData[key]);
                if (err) newErrors[key] = err;
            }
        });
        setErrors(newErrors);
        setTouched(Object.keys(formData).reduce((acc, curr) => ({ ...acc, [curr]: true }), {}));
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (actionType) => {
        if (!validateAll()) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/farmer/stocks/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    quantityKg: parseFloat(formData.quantityKg),
                    pricePerKg: parseFloat(formData.pricePerKg),
                    expiryEstimate: formData.expiryEstimate || null
                })
            });

            if (response.ok) {
                window.alert('Stock successfully added!');
                if (actionType === 'add_another') {
                    setFormData({ farmerId: getResolvedFarmerId(), vegetableName: '', category: '', harvestDate: '', quantityKg: '', pricePerKg: '', qualityGrade: '', expiryEstimate: '' });
                    setTouched({});
                    setErrors({});
                } else if (actionType === 'close') {
                    navigate('/farmer/view-stock');
                }
            } else {
                const data = await response.json();
                window.alert(data.message || 'Failed to add stock');
            }
        } catch (error) {
            window.alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <div className="form-wrapper">
                <header className="form-header">
                    <h1>Add New Stock</h1>
                    <p className="subtitle">List your fresh produce for the marketplace</p>
                </header>

                <form onSubmit={(e) => e.preventDefault()} className="form-group">
                    <div className="form-row">
                        <div className="form-section">
                            <label htmlFor="farmerId">Farmer ID <span className="required">*</span></label>
                            <input type="text" id="farmerId" name="farmerId" value={formData.farmerId} disabled style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }} />
                        </div>
                        <div className="form-section">
                            <label htmlFor="vegetableName">Vegetable Name <span className="required">*</span></label>
                            <select id="vegetableName" name="vegetableName" value={formData.vegetableName} onChange={handleChange} onBlur={handleBlur}>
                                <option value="">Select Vegetable</option>
                                {vegetableOptions.map((vegetable) => (
                                    <option key={vegetable} value={vegetable}>{vegetable}</option>
                                ))}
                            </select>
                            {touched.vegetableName && errors.vegetableName && <span className="error-text" style={{color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block'}}>{errors.vegetableName}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-section">
                            <label htmlFor="category">Category <span className="required">*</span></label>
                            <select id="category" name="category" value={formData.category} onChange={handleChange} onBlur={handleBlur}>
                                <option value="">Select Category</option>
                                <option value="Leafy Vegetable">Leafy Vegetable</option>
                                <option value="Root Vegetable">Root Vegetable</option>
                                <option value="Fruit Vegetable">Fruit Vegetable</option>
                                <option value="Seed/Pod Vegetable">Seed/Pod Vegetable</option>
                                <option value="Flower Vegetable">Flower Vegetable</option>
                                <option value="Bulb Vegetable">Bulb Vegetable</option>
                            </select>
                            {touched.category && errors.category && <span className="error-text" style={{color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block'}}>{errors.category}</span>}
                        </div>
                        <div className="form-section">
                            <label htmlFor="harvestDate">Harvest Date <span className="required">*</span></label>
                            <input type="date" id="harvestDate" name="harvestDate" max={maxDate} value={formData.harvestDate} onChange={handleChange} onBlur={handleBlur} />
                            {touched.harvestDate && errors.harvestDate && <span className="error-text" style={{color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block'}}>{errors.harvestDate}</span>}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-section">
                            <label htmlFor="quantityKg">Quantity (kg) <span className="required">*</span></label>
                            <input type="number" id="quantityKg" name="quantityKg" step="0.1" value={formData.quantityKg} onChange={handleChange} onBlur={handleBlur} />
                            {touched.quantityKg && errors.quantityKg && <span className="error-text" style={{color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block'}}>{errors.quantityKg}</span>}
                        </div>
                        <div className="form-section">
                            <label htmlFor="pricePerKg">Price per kg (LKR) <span className="required">*</span></label>
                            <input type="number" id="pricePerKg" name="pricePerKg" step="0.01" value={formData.pricePerKg} onChange={handleChange} onBlur={handleBlur} />
                            {touched.pricePerKg && errors.pricePerKg && <span className="error-text" style={{color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block'}}>{errors.pricePerKg}</span>}
                        </div>
                    </div>

                    <div className="form-section full-width">
                        <label>Quality Grade <span className="required">*</span></label>
                        <div className="quality-options">
                            {['A', 'B', 'C'].map((grade) => (
                                <label key={grade} className="radio-label" onClick={() => handleBlur({ target: { name: 'qualityGrade', value: grade } })}>
                                    <input type="radio" name="qualityGrade" value={grade} checked={formData.qualityGrade === grade} onChange={handleChange} />
                                    <div className={`grade-badge grade-${grade.toLowerCase()}`}>
                                        Grade {grade}
                                        <div className="grade-desc">{grade === 'A' ? 'Premium' : grade === 'B' ? 'Standard' : 'Discounted'}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        {touched.qualityGrade && errors.qualityGrade && <span className="error-text" style={{color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block'}}>{errors.qualityGrade}</span>}
                    </div>

                    <div className="form-section full-width">
                        <label htmlFor="expiryEstimate">Estimated Expiry <span className="required">*</span></label>
                        <input type="date" id="expiryEstimate" name="expiryEstimate" min={formData.harvestDate || undefined} max={expiryMaxDate} value={formData.expiryEstimate} onChange={handleChange} onBlur={handleBlur} />
                        {touched.expiryEstimate && errors.expiryEstimate && <span className="error-text" style={{color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block'}}>{errors.expiryEstimate}</span>}
                    </div>

                    <div className="form-actions" style={{ gap: '15px', display: 'flex', flexWrap: 'wrap', marginTop: '20px' }}>
                        <button type="button" className="btn btn-primary" onClick={() => handleSubmit('add_another')} disabled={loading}>
                            {loading ? 'Processing...' : 'Save & Add Another'}
                        </button>
                        <button type="button" className="btn" onClick={() => handleSubmit('close')} disabled={loading} style={{ backgroundColor: '#28a745', color: '#fff' }}>
                            {loading ? 'Processing...' : 'Save & Close'}
                        </button>
                        <button type="button" className="btn" onClick={() => navigate('/farmer/view-stock')} disabled={loading} style={{ backgroundColor: '#dc3545', color: '#fff', marginLeft: 'auto' }}>
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddStockForm;