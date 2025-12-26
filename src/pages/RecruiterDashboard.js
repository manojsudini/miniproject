import { useState } from "react";

function RecruiterDashboard() {
  const [view, setView] = useState("dashboard");
  const [selectedResumes, setSelectedResumes] = useState([]);
  const [shortlisted, setShortlisted] = useState([]);
  const [topN, setTopN] = useState("");

  const applicantResumes = [
    { id: 1, name: "Amit Kumar", role: "Frontend Developer" },
    { id: 2, name: "Priya Sharma", role: "Frontend Developer" },
    { id: 3, name: "Rahul Verma", role: "Java Developer" },
    { id: 4, name: "Sneha Reddy", role: "Data Analyst" }
  ];

  const toggleResume = (id) => {
    setSelectedResumes((prev) =>
      prev.includes(id)
        ? prev.filter((rid) => rid !== id)
        : [...prev, id]
    );
  };

  const analyzeResumes = () => {
    if (selectedResumes.length === 0) {
      alert("Please select at least one resume to analyze.");
      return;
    }

    const analyzed = applicantResumes
      .filter((r) => selectedResumes.includes(r.id))
      .map((r, index) => ({
        ...r,
        score: Math.floor(Math.random() * 20) + 80
      }))
      .sort((a, b) => b.score - a.score);

    setShortlisted(analyzed);

    alert(
      "Resumes analyzed successfully.\nClick on 'Shortlisted Candidates' to view results."
    );
  };

  const displayedCandidates =
    topN && Number(topN) > 0
      ? shortlisted.slice(0, Number(topN))
      : shortlisted;

  return (
    <div className="container">
      {/* NAV BAR */}
      <div className="recruiter-navbar">
        <h2>Recruiter Dashboard</h2>
        <button
          className="nav-btn"
          onClick={() => setView("shortlisted")}
        >
          Shortlisted Candidates
        </button>
      </div>

      {/* DASHBOARD VIEW */}
      {view === "dashboard" && (
        <div className="recruiter-layout">
          <div className="card">
            <h3>Job Description</h3>
            <textarea
              className="textarea"
              placeholder="Enter job description here..."
            />

            <button
              className="btn-primary"
              style={{ marginTop: "20px", width: "100%" }}
              onClick={analyzeResumes}
            >
              Analyze Selected Resumes
            </button>
          </div>

          <div className="card">
            <h3>Applicant Resumes</h3>

            {applicantResumes.map((r) => (
              <div key={r.id} className="resume-card">
                <label className="resume-left">
                  <input
                    type="checkbox"
                    checked={selectedResumes.includes(r.id)}
                    onChange={() => toggleResume(r.id)}
                  />
                  <span className="resume-role">{r.role}</span>
                </label>

                <button className="btn-secondary">
                  View Resume
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHORTLISTED VIEW */}
      {view === "shortlisted" && (
        <div className="card">
          <h3>Shortlisted Candidates</h3>

          {shortlisted.length === 0 ? (
            <p>No candidates shortlisted yet.</p>
          ) : (
            <>
              <div style={{ marginBottom: "15px" }}>
                <input
                  type="number"
                  placeholder="Show top N candidates"
                  value={topN}
                  onChange={(e) => setTopN(e.target.value)}
                  style={{
                    padding: "8px",
                    width: "200px",
                    borderRadius: "8px",
                    border: "1px solid #c7d2fe"
                  }}
                />
              </div>

              <table className="table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Name</th>
                    <th>Match Score (%)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedCandidates.map((c, index) => (
                    <tr key={c.id}>
                      <td>{index + 1}</td>
                      <td>{c.name}</td>
                      <td>{c.score}</td>
                      <td>
                        <button className="accept-btn">
                          Accept
                        </button>
                        <button className="reject-btn">
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default RecruiterDashboard;
