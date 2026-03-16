import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.css";

function Login() {

  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const fixedRole = queryParams.get("role") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(fixedRole);

  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (fixedRole) {
      setRole(fixedRole);
    }
  }, [fixedRole]);

  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("Email and password are required");
      setMessageType("error");
      triggerShake();
      return;
    }

    if (!isValidEmail(email)) {
      setMessage("Please enter a valid email address");
      setMessageType("error");
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {

      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed");
        setMessageType("error");
        triggerShake();
        setIsLoading(false);
        return;
      }

      setShowOtp(true);
      setMessage("OTP sent to your email");
      setMessageType("success");
      setIsLoading(false);

    } catch {

      setMessage("Server error. Please try again.");
      setMessageType("error");
      triggerShake();
      setIsLoading(false);

    }
  };

  const verifyOtp = async () => {

    if (!otp) {
      setMessage("Please enter OTP");
      setMessageType("error");
      triggerShake();
      return;
    }

    setIsLoading(true);

    try {

      const response = await fetch(
        "http://localhost:5000/api/auth/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Invalid OTP");
        setMessageType("error");
        triggerShake();
        setIsLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      const expiryTime = Date.now() + 60 * 60 * 1000;
      localStorage.setItem("expiry", expiryTime);

      setTimeout(() => {

        if (data.role === "applicant") navigate("/applicant");
        if (data.role === "hr") navigate("/hr");
        if (data.role === "admin") navigate("/admin");

      }, 900);

    } catch {

      setMessage("Server error");
      setMessageType("error");
      triggerShake();
      setIsLoading(false);

    }
  };

  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 10
  }));

  return (
    <div className="login-container">

      <div className="grid-overlay" />

      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

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

      <div className={`login-card ${shake ? "shake" : ""}`}>

        <div className="icon-container">
          <div className="icon-wrapper">
            👤
          </div>
        </div>

        <h2>Welcome Back</h2>
        <p className="subtitle">Sign in to continue to your account</p>

        {message && (
          <div className={`form-message ${messageType}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin}>

          <div className="input-group">

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="input-icon">📧</div>

          </div>

          <div className="input-group">

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="input-icon">🔒</div>

          </div>

          <div className="input-group">

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

            <div className="input-icon">👤</div>

          </div>

          {showOtp && (

            <div className="otp-section">

              <div className="divider">
                <span>Enter OTP</span>
              </div>

              <div className="input-group">

                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                />

                <div className="input-icon">🔑</div>

              </div>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={verifyOtp}
                disabled={isLoading}
              >
                {isLoading ? "Verifying..." : "Verify OTP"}
              </button>

            </div>

          )}

          {!showOtp && (

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

          )}

        </form>

        <p className="link">
          New user?{" "}
          <span
            onClick={() =>
              fixedRole
                ? navigate(`/signup?role=${fixedRole}`)
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