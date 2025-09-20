import React, { createContext, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import { MainLayout } from './components/layouts/MainLayout';

// Create AuthContext
export const AuthContext = createContext();

function App() {
    const [auth, setAuth] = useState(null);

    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
            <Router>
                <MainLayout>
                    <AppRoutes />
                </MainLayout>
            </Router>
        </AuthContext.Provider>
    );
}

export default App;