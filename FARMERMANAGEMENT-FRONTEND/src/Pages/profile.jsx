import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../Css/profile.css';

const Profile = () => {
	const navigate = useNavigate();

	const user = JSON.parse(sessionStorage.getItem('loggedUser') || '{}');

	useEffect(() => {
		if (!user || !user.role || user.role !== 'FARMER') {
			navigate('/');
		}
	}, [navigate, user]);

	const farmer = {
		farmerId: user.farmerId || user.id || '',
		fullName: user.name || '',
		phone: user.phone || '',
		email: user.email || '',
		district: user.farmLocation || '',
		address: user.deliveryAddress || user.address || '',
		joinedDate: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '-',
	};

	const handleLogout = () => {
		sessionStorage.removeItem('loggedUser');
		navigate('/');
	};

	const lands = user.lands || [];

	const totalHectares = lands.reduce((sum, land) => sum + land.hectares, 0).toFixed(1);

	return (
		<main className="profile-page">
			<section className="profile-card">
				<header className="profile-header">
					<div className="profile-header-top">
						<h1>Farmer Profile</h1>
						<button type="button" className="profile-btn profile-btn-logout" onClick={handleLogout}>
							<svg className="profile-btn-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
								<path d="M16 17l5-5-5-5v3H9v4h7v3z" fill="currentColor" />
								<path d="M4 4h8v2H6v12h6v2H4z" fill="currentColor" />
							</svg>
							Log Out
						</button>
					</div>
					<p>View your account information and manage your crops.</p>
				</header>

				<div className="profile-grid">
					<div className="profile-item"><span>Farmer ID</span><strong>{farmer.farmerId}</strong></div>
					<div className="profile-item"><span>Full Name</span><strong>{farmer.fullName}</strong></div>
					<div className="profile-item"><span>Phone</span><strong>{farmer.phone}</strong></div>
					<div className="profile-item"><span>Email</span><strong>{farmer.email}</strong></div>

					<div className="profile-item"><span>District</span><strong>{farmer.district}</strong></div>
					<div className="profile-item profile-item-wide"><span>Address</span><strong>{farmer.address}</strong></div>
					<div className="profile-item"><span>Joined Date</span><strong>{farmer.joinedDate}</strong></div>
				</div>

				<div className="profile-actions">
					<button type="button" className="profile-btn profile-btn-secondary">Edit Profile</button>
					<Link to="/add-stock" className="profile-btn profile-btn-primary">Add New Crop</Link>
				</div>
			</section>
		{/* LANDS SECTION */}
		<section className="lands-section">
			<header className="lands-header">
				<h2>My Lands</h2>
				<p>View all your agricultural lands and their details</p>
			</header>

			<div className="lands-stats">
				<div className="stat-box">
					<span className="stat-label">Total Lands</span>
					<span className="stat-value">{lands.length}</span>
				</div>
				<div className="stat-box">
					<span className="stat-label">Total Hectares</span>
					<span className="stat-value">{totalHectares} ha</span>
				</div>
			</div>

			<div className="lands-grid">
				{lands.map((land) => (
					<div key={land.id} className="land-card">
						<div className="land-card-header">
							<h3>{land.name}</h3>
							<span className="land-id">Land #{land.id}</span>
						</div>

						<div className="land-details">
							<div className="land-detail-item">
								<span className="land-detail-label">Hectares</span>
								<span className="land-detail-value">{land.hectares} ha</span>
							</div>
							<div className="land-detail-item">
								<span className="land-detail-label">Main Crop</span>
								<span className="land-detail-value">{land.mainCrop}</span>
							</div>
						</div>

						<button className="land-card-btn">Manage Land</button>
					</div>
				))}
			</div>
		</section>		</main>
	);
};

export default Profile;
