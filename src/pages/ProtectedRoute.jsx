import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, roleRequired }) {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" />;

  if (roleRequired && role !== roleRequired)
    return <Navigate to="/" />;

  return children;
}

export default ProtectedRoute;