import React from 'react'
import { createRoot } from 'react-dom/client'
import AdminPortalRoot from './features/admin-portal/AdminPortalRoot'
import './styles.css'
import './styles/responsive-phase1.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminPortalRoot />
  </React.StrictMode>
)
