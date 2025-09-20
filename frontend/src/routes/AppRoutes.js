import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ContactsPage from '../pages/master-data/ContactsPage';
import ProductsPage from '../pages/master-data/ProductsPage';
import ChartOfAccountsPage from '../pages/master-data/ChartOfAccountsPage';

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/master-data/contacts" element={<ContactsPage />} />
            <Route path="/master-data/products" element={<ProductsPage />} />
            <Route path="/master-data/chart-of-accounts" element={<ChartOfAccountsPage />} />
        </Routes>
    );
}

export default AppRoutes;