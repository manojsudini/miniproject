import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
    const navigate = useNavigate();
    const [role, setRole] = useState("applicant");

    const handleLogin = () => {
        if (role === "applicant") navigate("/applicant");
        if (role === "hr") navigate("/hr");
        if (role === "admin") navigate("/admin");
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>HireMate</h2>
                <p className="subtitle">ATS Resume Screening System</p>

                <input type="email" placeholder="Email" />
                <input type="password" placeholder="Password" />
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="applicant">Applicant</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                </select>


                <button onClick={handleLogin}>Login</button>

                <p className="link">
                    New user? <a href="/signup">Create account</a>
                </p>
            </div>
        </div>
    );
}

export default Login;
