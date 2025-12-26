import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-wrapper">
      {/* LEFT CONTENT ONLY */}
      <div className="home-left">
        <h1>HireMate</h1>

        <p>
          HireMate is an intelligent Application Tracking System that helps
          recruiters automatically screen resumes and applicants track their
          application status in real time.
        </p>

        <div className="home-buttons">
          <button
            className="btn-primary"
            onClick={() => navigate("/applicant/login")}
          >
            Applicant Portal
          </button>

          <button
            className="btn-primary"
            onClick={() => navigate("/recruiter")}
          >
            Recruiter Portal
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
