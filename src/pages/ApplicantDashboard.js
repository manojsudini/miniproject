import { useState } from "react";

function ApplicantDashboard() {
  // view = "form" | "status"
  const [view, setView] = useState("form");

  // Placeholder decision state (later comes from backend)
  const decision = "rejected"; 
  // change to "rejected" later to see missing skills UI

  return (
    <div className="container">
      {/* NAVIGATION BAR */}
      <div className="dashboard-navbar">
        <h2>Application Dashboard</h2>
        <div
          className="dashboard-nav-action"
          onClick={() =>
            setView(view === "form" ? "status" : "form")
          }
        >
          View Application Status
        </div>
      </div>

      {/* STATUS VIEW */}
      {view === "status" && (
        <div className="card">
          {/* STATUS TRACKER */}
          <div className="status-tracker">
            <div className="status-step status-active">
              <div className="status-circle"></div>
              Submitted
            </div>

            <div className="status-step status-active">
              <div className="status-circle"></div>
              Under Review
            </div>

            <div className="status-step">
              <div className="status-circle"></div>
              Final Decision
            </div>
          </div>

          {/* FINAL DECISION */}
          <div className="decision-section">
            <div className="decision-heading">
              Final Decision
            </div>

            {/* ACCEPTED / REJECTED BADGE */}
            {decision === "accepted" && (
              <div className="status-box-small status-accepted">
                Accepted / Shortlisted
              </div>
            )}

            {decision === "rejected" && (
              <div className="status-box-small status-rejected">
                Rejected
              </div>
            )}

            {/* MISSING SKILLS — ONLY IF REJECTED */}
            {decision === "rejected" && (
              <div className="missing-skills-box">
                <div className="missing-skills-title">
                  Missing Skills
                </div>
                <p>(To be displayed after evaluation)</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* APPLICATION FORM */}
      {view === "form" && (
        <div className="form-wrapper">
          <div
            className="card card-light"
            style={{ maxWidth: "500px", width: "100%" }}
          >
            <h3>Candidate Application Form</h3>

            <input placeholder="Full Name" />
            <input placeholder="Email Address" />
            <input placeholder="Phone Number" />
            <input placeholder="Role Applied For" />

            <div className="file-box">
              <input type="file" />
            </div>

            <button
              className="btn-primary"
              style={{ width: "100%" }}
            >
              Submit Application
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplicantDashboard;
