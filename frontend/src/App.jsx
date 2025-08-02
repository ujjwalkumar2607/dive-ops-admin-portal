// src/App.jsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login            from './components/Login'
import CoverScreen      from './components/CoverScreen'
import SchedulingLayout from './components/SchedulingLayout'
import CrewDetail       from './components/CrewDetail'
import BoatScheduling   from './components/BoatScheduling'
import { useAuth } from './services/useAuth'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')  // ← now reads each render
  return token
    ? children
    : <Navigate to="/login" replace />
}

export default function App() {
  const { role } = useAuth()  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <CoverScreen />
          </PrivateRoute>
        }
      />

      <Route
        path="scheduling/*"
        element={
          <PrivateRoute>
            <SchedulingLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<div className="flex items-center justify-center h-full p-6 text-gray-600">Please select "Crew Detail" or "Boat Scheduling" above.</div>} />
        <Route
          path="crew"
          element={<CrewDetail />}
        />
        <Route path="boat" element={<BoatScheduling />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
