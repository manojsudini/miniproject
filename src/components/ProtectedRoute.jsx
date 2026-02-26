import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, roleRequired }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // If not logged in → go login
  if (!token) return <Navigate to="/login" replace />;

  // If wrong role → go home/login
  if (roleRequired && role !== roleRequired) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;