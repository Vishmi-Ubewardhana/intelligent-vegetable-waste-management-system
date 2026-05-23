import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import LoginPage from '../Pages/LoginPage';
import AdminDashboard from '../Pages/AdminDashboard';
import CustomerDashboard from '../Pages/CustomerDashboard';
import Layout from '../Components/layout';
import Dashboard from '../Pages/dashboard';
import AddStock from '../Pages/addstock';
import ViewStock from '../Pages/viewstock';
import AIDemand from '../Pages/aidemand';
import WastageRep from '../Pages/wastagerep';
import OrderStatus from '../Pages/orderstatus';
import Profile from '../Pages/profile';
import { Toast } from '../Components/shared/Toast.jsx';


function ProtectedRoute({ children, role }) {
    const user = JSON.parse(sessionStorage.getItem('loggedUser') || 'null');
    if (!user) return <Navigate to="/" replace />;
    if (role && user.role !== role) return <Navigate to="/" replace />;
    return children;
}

function RootLayout() {
    return (
        <>
            <Toast />
            <Outlet />
        </>
    );
}

const router = createBrowserRouter([
    {
        path: '/',
        element: <RootLayout />,
        children: [
            { path: '/', element: <LoginPage /> },
            {
                path: '/admin',
                element: (
                    <ProtectedRoute role="ADMIN">
                        <AdminDashboard />
                    </ProtectedRoute>
                ),
            },
            {
                path: '/farmer',
                element: (
                    <ProtectedRoute role="FARMER">
                        <Layout />
                    </ProtectedRoute>
                ),
                children: [
                    { index: true, element: <Dashboard /> },
                    { path: 'add-stock', element: <AddStock /> },
                    { path: 'view-stock', element: <ViewStock /> },
                    { path: 'demand', element: <AIDemand /> },
                    { path: 'wastage-report', element: <WastageRep /> },
                    { path: 'orders', element: <OrderStatus /> },
                    { path: 'profile', element: <Profile /> },
                ],
            },
            {
                path: '/customer',
                element: (
                    <ProtectedRoute role="CUSTOMER">
                        <CustomerDashboard />
                    </ProtectedRoute>
                ),
            },
            { path: '*', element: <Navigate to="/" replace /> },
        ],
    },
]);

export default router;