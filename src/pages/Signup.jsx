import { useNavigate } from "react-router-dom";
import "./Signup.css";

function Signup() {
    const navigate = useNavigate();

    const handleSignup = () => {
        navigate("/");
    };


    return (
        <div className="signup-container">
            <div className="signup-card">
                <h2>HireMate</h2>
                <p className="subtitle">Create Applicant Account</p>

                <input type="text" placeholder="Full Name" />
                <input type="email" placeholder="Email" />
                <input type="password" placeholder="Password" />




                <button onClick={handleSignup}>Create Account</button>

                <p className="link">
                    Already have an account? <a href="/login">Login</a>
                </p>
            </div>
        </div>
    );
}

export default Signup;
