import { useState, useEffect } from "react";
import { analyzeResumes } from "../ats/atsLogic";
import Navbar from "../components/Navbar.jsx";
import "./HRDashboard.css";

function HRDashboard() {
  const [jobDescription, setJobDescription] = useState("");
  const [role, setRole] = useState("Software Tester");
  const [limit, setLimit] = useState("");
  const [allResults, setAllResults] = useState([]);
  const [results, setResults] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  /* 🔒 LOCK BACKGROUND SCROLL WHEN POPUP OPENS */
  useEffect(() => {
    if (showPopup) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showPopup]);

  const handleAnalyze = () => {
    const applications =
      JSON.parse(localStorage.getItem("applications")) || [];

    const filtered = applications.filter(app => app.role === role);

    const formatted = filtered.map(app => ({
      name: app.name,
      text: `${app.role} selenium automation api testing`
    }));

    const analyzed = analyzeResumes(jobDescription, formatted);

    const merged = analyzed.map((res, index) => ({
      ...res,
      resumeName: filtered[index]?.resumeName || "resume.pdf",
      status: "Pending"
    }));

    setAllResults(merged);
    setResults(limit ? merged.slice(0, limit) : merged);
  };

  const updateStatus = (index, status) => {
    const updatedResults = [...results];
    updatedResults[index].status = status;

    const updatedAll = [...allResults];
    const originalIndex = allResults.findIndex(
      r => r.name === updatedResults[index].name
    );
    if (originalIndex !== -1) {
      updatedAll[originalIndex].status = status;
    }

    setResults(updatedResults);
    setAllResults(updatedAll);
  };

  const handleLimitChange = (e) => {
    const value = Number(e.target.value);
    setLimit(value);
    setResults(value ? allResults.slice(0, value) : allResults);
  };

  const shortlisted = allResults.filter(r => r.status === "Accepted");

  const downloadShortlisted = () => {
    alert(`Downloading ${shortlisted.length} shortlisted resumes`);
  };

  return (
    <>
      <Navbar role="hr" />

      <div className="hr-page">
        <h2 className="page-title">HR Dashboard</h2>

        {/* JD CARD */}
        <div className="jd-card">
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option>Software Tester</option>
            <option>Software Developer</option>
            <option>Frontend Developer</option>
            <option>Backend Developer</option>
            <option>Full Stack Developer</option>
            <option>QA Engineer</option>
            <option>Data Analyst</option>
            <option>DevOps Engineer</option>
            <option>UI/UX Designer</option>
          </select>

          <textarea
            placeholder="Enter job description..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />

          <button onClick={handleAnalyze}>Analyze Resumes</button>
        </div>

        {/* RESULTS TABLE */}
        {results.length > 0 && (
          <div className="table-card">
            <div className="table-header">
              <h3>ATS Screening Results</h3>

              <button
                className="view-shortlisted-btn"
                onClick={() => setShowPopup(true)}
              >
                View Shortlisted Resumes ({shortlisted.length})
              </button>
            </div>

            <div className="limit-input-wrapper">
              <input
                type="number"
                placeholder="Number of candidates required"
                value={limit}
                onChange={handleLimitChange}
              />
            </div>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>CANDIDATE</th>
                    <th>RESUME</th>
                    <th>MATCH %</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((res, index) => (
                    <tr key={index}>
                      <td>{res.name}</td>
                      <td>
                        <button className="view-btn">View</button>
                        <button className="download-btn">Download</button>
                      </td>
                      <td className="match">{res.percentage}%</td>
                      <td>
                        {res.status === "Pending" ? (
                          <>
                            <button
                              className="accept-btn"
                              onClick={() => updateStatus(index, "Accepted")}
                            >
                              Accept
                            </button>
                            <button
                              className="reject-btn"
                              onClick={() => updateStatus(index, "Rejected")}
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className={`status ${res.status.toLowerCase()}`}>
                            {res.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SHORTLIST POPUP */}
        {showPopup && (
          <div className="popup-overlay">
            <div className="shortlist-modal">
              <h3>Shortlisted Candidates</h3>

              <div className="shortlist-table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>CANDIDATE</th>
                      <th>RESUME</th>
                      <th>MATCH %</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortlisted.map((c, i) => (
                      <tr key={i}>
                        <td>{c.name}</td>
                        <td>
                          <button className="view-btn">View</button>
                          <button className="download-btn">Download</button>
                        </td>
                        <td className="match">{c.percentage}%</td>
                        <td className="status accepted">Accepted</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="shortlist-actions">
                <button
                  className="download-all-btn"
                  onClick={downloadShortlisted}
                >
                  Download Shortlisted Resumes
                </button>

                <button
                  className="close-btn"
                  onClick={() => setShowPopup(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default HRDashboard;
