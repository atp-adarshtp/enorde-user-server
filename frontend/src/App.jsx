import { AuthProvider } from './context/AuthContext'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import { useAuth } from './context/AuthContext'

function PrivateRoute({ children }) {
  const { token, loading } = useAuth()

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return token ? children : <Navigate to="/login" />
}

function PublicRoute({ children }) {
  const { token, loading } = useAuth()

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return token ? <Navigate to="/" /> : children
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
