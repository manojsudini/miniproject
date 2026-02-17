import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar({ role }) {
  return (
    <nav className="navbar">
      <div className="nav-left">HireMate</div>

      <div className="nav-right">

        {/* APPLICANT NAVBAR */}
        {role === "applicant" && (
          <>
            <Link to="/applicant-dashboard">Dashboard</Link>
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

        <Link to="/">Logout</Link>
      </div>
    </nav>
  );
}

export default Navbar;