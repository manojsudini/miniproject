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

                <p className="role-title">Select Job Role</p>

                <div className="role-group">
                    <label>
                        <input type="radio" name="jobRole" />
                        Software Tester
                    </label>

                    <label>
                        <input type="radio" name="jobRole" />
                        Frontend Developer
                    </label>

                    <label>
                        <input type="radio" name="jobRole" />
                        Backend Developer
                    </label>

                    <label>
                        <input type="radio" name="jobRole" />
                        Data Analyst
                    </label>
                </div>


                <button onClick={handleSignup}>Create Account</button>

                <p className="link">
                    Already have an account? <a href="/">Login</a>
                </p>
            </div>
        </div>
    );
}

export default Signup;
