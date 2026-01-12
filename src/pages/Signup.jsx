import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Signup.css";

function Signup() {
  const navigate = useNavigate();
  const location = useLocation();

  const fixedRole = location.state?.role || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(fixedRole);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
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
        navigate("/login", { state: { role } });
      }, 1200);
    } catch (err) {
      setMessage("Server error. Please try again.");
      setMessageType("error");
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Create Account</h2>

        {message && (
          <div className={`form-message ${messageType}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <input
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {fixedRole ? (
            <input value={role.toUpperCase()} disabled />
          ) : (
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">Select Role</option>
              <option value="applicant">Applicant</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
            </select>
          )}

          <button type="submit">Create Account</button>
        </form>
      </div>
    </div>
  );
}

export default Signup;
