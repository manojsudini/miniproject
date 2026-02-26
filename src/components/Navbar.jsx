import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import "./Navbar.css";

function Navbar({ role }) {
  const navigate = useNavigate();

  /* MANUAL LOGOUT */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  /* AUTO LOGOUT WHEN TOKEN EXPIRES */
  useEffect(() => {
    const checkExpiry = () => {
      const expiry = localStorage.getItem("expiry");

      if (expiry && Date.now() > expiry) {
        localStorage.clear();
        navigate("/login");
      }
    };

    checkExpiry();

    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <nav className="navbar">
      <div className="nav-left">HireMate</div>

      <div className="nav-right">

        {/* APPLICANT NAVBAR */}
        {role === "applicant" && (
          <>
            <Link to="/track">Dashboard</Link>
            <Link to="/applicant">Apply Job</Link>
          </>
        )}

        {/* HR NAVBAR */}
        {role === "hr" && (
          <>
            <Link to="/hr">HR Dashboard</Link>
            <Link to="/hr">Analyze</Link>
          </>
        )}

        {/* ADMIN NAVBAR */}
        {role === "admin" && (
          <>
            <Link to="/admin">Admin Dashboard</Link>
            <Link to="/admin">Users</Link>
          </>
        )}

        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;