import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Signup.css";

function Signup() {

  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const fixedRole = queryParams.get("role") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(fixedRole);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    if (fixedRole) {
      setRole(fixedRole);
    }
  }, [fixedRole]);

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignup = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!name || !email || !password || !role) {
      setMessage("All fields are required");
      setMessageType("error");
      return;
    }

    if (!isValidEmail(email)) {
      setMessage("Please enter a valid email address");
      setMessageType("error");
      return;
    }

    try {

      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Signup failed");
        setMessageType("error");
        return;
      }

      setMessage("Account created successfully. Redirecting...");
      setMessageType("success");

      setTimeout(() => {
        navigate(`/login?role=${role}`);
      }, 1200);

    } catch {
      setMessage("Server error. Please try again.");
      setMessageType("error");
    }
  };

  /* PARTICLES */

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 10
  }));

  return (
    <div className="login-container">

      {/* GRID */}
      <div className="grid-overlay" />

      {/* ORBS */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* PARTICLES */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            width: p.size + "px",
            height: p.size + "px",
            left: p.left + "%",
            animationDelay: p.delay + "s",
            animationDuration: p.duration + "s"
          }}
        />
      ))}

      <div className="login-card">

        {/* ICON */}
        <div className="icon-container">
          <div className="icon-wrapper">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>

          </div>
        </div>

        <h2>Create Account</h2>
        <p className="subtitle">Sign up to create your account</p>

        {message && (
          <div className={`form-message ${messageType}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSignup}>

          {/* NAME */}
          <div className="input-group">

            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <div className="input-icon">
              👤
            </div>

          </div>

          {/* EMAIL */}
          <div className="input-group">

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="input-icon">
              ✉
            </div>

          </div>

          {/* PASSWORD */}
          <div className="input-group">

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="input-icon">
              🔒
            </div>

          </div>

          {/* ROLE */}
          <div className="input-group">

            {fixedRole ? (

              <input
                value={role.toUpperCase()}
                disabled
              />

            ) : (

              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Select Role</option>
                <option value="applicant">Applicant</option>
                <option value="hr">HR</option>
                <option value="admin">Admin</option>
              </select>

            )}

            <div className="input-icon">
              👥
            </div>

            <div className="select-arrow">⌄</div>

          </div>

          <button
            type="submit"
            className="btn btn-primary"
          >
            Create Account
          </button>

        </form>

        <p className="link">
          Already have an account{" "}
          <span onClick={() => navigate("/login")}>
            Sign In
          </span>
        </p>

      </div>

    </div>
  );
}

export default Signup;