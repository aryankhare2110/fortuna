import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, role } = useAuth()

  if (!isAuthenticated) {
    return <Navigate to={`/login/${allowedRole || 'player'}`} replace />
  }

  if (allowedRole && role !== allowedRole) {
    return <Navigate to="/" replace />
  }

  return children
}
