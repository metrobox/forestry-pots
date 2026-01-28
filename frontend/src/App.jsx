import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import LandingPage from './pages/LandingPage';
import CatalogPage from './pages/CatalogPage';
import MyRFPsPage from './pages/MyRFPsPage';
import ProfilePage from './pages/ProfilePage';
import AdminLayout from './pages/admin/AdminLayout';
import UsersManagement from './pages/admin/UsersManagement';
import ProductsManagement from './pages/admin/ProductsManagement';
import RFPsManagement from './pages/admin/RFPsManagement';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard/catalog" replace />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="my-rfps" element={<MyRFPsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/products" replace />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="products" element={<ProductsManagement />} />
              <Route path="rfps" element={<RFPsManagement />} />
              <Route path="access-logs" element={<div className="text-center py-12 text-gray-500">Access Logs - Coming Soon</div>} />
              <Route path="access-requests" element={<div className="text-center py-12 text-gray-500">Access Requests - Coming Soon</div>} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
