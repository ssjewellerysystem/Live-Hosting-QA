import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { MaintenanceProvider } from './context/MaintenanceContext'
import { HighDemandProvider } from './context/HighDemandContext'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MaintenanceProvider>
          <HighDemandProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </HighDemandProvider>
        </MaintenanceProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
