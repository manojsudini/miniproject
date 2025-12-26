import { useNavigate } from "react-router-dom";

function ApplicantSignup() {
  const navigate = useNavigate();

  return (
    <div className="container">
      {/* PAGE HEADING */}
      <h2 className="page-title">Applicant Signup</h2>

      {/* CENTERED CARD */}
      <div className="form-wrapper">
        <div className="card card-light" style={{ maxWidth: "450px", width: "100%" }}>
          <input placeholder="Full Name" />
          <input placeholder="Email" />
          <input type="password" placeholder="Password" />

          <button
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={() => navigate("/applicant/login")}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApplicantSignup;
