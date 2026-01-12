import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const fixedRole = location.state?.role || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(fixedRole || "");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    if (fixedRole) setRole(fixedRole);
  }, [fixedRole]);

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("Email and password are required");
      setMessageType("error");
      return;
    }

    if (!isValidEmail(email)) {
      setMessage("Please enter a valid email address");
      setMessageType("error");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Invalid credentials");
        setMessageType("error");
        return;
      }

      setMessage("Login successful. Redirecting...");
      setMessageType("success");

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      setTimeout(() => {
        if (data.role === "applicant") navigate("/applicant");
        if (data.role === "hr") navigate("/hr");
        if (data.role === "admin") navigate("/admin");
      }, 900);
    } catch {
      setMessage("Server error. Please try again.");
      setMessageType("error");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>

        {message && (
          <div className={`form-message ${messageType}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
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

          <button type="submit">Login</button>
        </form>

        <p className="link">
          New user?{" "}
          <span
            onClick={() =>
              fixedRole
                ? navigate("/signup", { state: { role: fixedRole } })
                : navigate("/signup")
            }
          >
            Create account
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
