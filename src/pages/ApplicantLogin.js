import { useNavigate } from "react-router-dom";

function ApplicantLogin() {
  const navigate = useNavigate();

  return (
    <div className="container">
      {/* PAGE HEADING */}
      <h2 className="page-title">Applicant Login</h2>

      {/* CENTERED CARD */}
      <div className="form-wrapper">
        <div className="card card-light" style={{ maxWidth: "420px", width: "100%" }}>
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />

          <button
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={() => navigate("/applicant/dashboard")}
          >
            Login
          </button>

          <p style={{ marginTop: "15px", textAlign: "center" }}>
            New user?{" "}
            <span className="link" onClick={() => navigate("/applicant/signup")}>
              Sign up
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ApplicantLogin;
