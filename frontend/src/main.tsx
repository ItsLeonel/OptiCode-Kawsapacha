import React from 'react'
import { createRoot } from 'react-dom/client'
import AdminPortalRoot from './features/admin-portal/AdminPortalRoot'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminPortalRoot />
  </React.StrictMode>
)
