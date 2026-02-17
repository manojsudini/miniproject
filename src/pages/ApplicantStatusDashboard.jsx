import Navbar from "../components/Navbar.jsx";
import "./ApplicantDashboard1.css";

function ApplicantStatusDashboard() {

  // Change this to test pipeline flow
  const status = "ATS Screening";
  // Applied | ATS Screening | Accepted | Rejected

  const stepIndex = {
    "Applied": 3,
    "ATS Screening": 2,
    "Accepted": 3,
    "Rejected": 3
  }[status];

  return (
    <>
      <Navbar role="applicant" />

      <div className="pipe-page">
        <h2>Application Pipeline</h2>

        <div className="pipe-container">

          <div className="label">USER</div>

          <div className={`pipe ${stepIndex>=1?"flow":""}`}>
            <div className="water"></div>
          </div>

          <div className="label">APPLIED</div>

          <div className={`pipe ${stepIndex>=2?"flow":""}`}>
            <div className="water"></div>
          </div>

          <div className="label">HR</div>

          <div className="branch">

            <div className={`pipe accept ${status==="Accepted"?"flow":""}`}>
              <div className="water"></div>
              <span>ACCEPT</span>
            </div>

            <div className={`pipe reject ${status==="Rejected"?"flow":""}`}>
              <div className="water"></div>
              <span>REJECT</span>
            </div>

          </div>

        </div>
      </div>
    </>
  );
}

export default ApplicantStatusDashboard;