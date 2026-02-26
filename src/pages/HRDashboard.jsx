import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import Navbar from "../components/Navbar.jsx";
import "./HRDashboard.css";

function HRDashboard() {
  const [jobDescription, setJobDescription] = useState("");
  const [role, setRole] = useState("Software Tester");
  const [limit, setLimit] = useState("");
  const [allResults, setAllResults] = useState([]);
  const [results, setResults] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  const token = localStorage.getItem("token");

  useEffect(() => {
    document.body.style.overflow = showPopup ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [showPopup]);

  /* FETCH APPLICATIONS */
  const fetchApplications = async () => {
    const { data } = await axios.get(
      "http://localhost:5000/api/applications",
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
    return data;
  };

  /* ANALYZE RESUMES */
  const handleAnalyze = async () => {
    try {
      if (!jobDescription.trim()) {
        alert("Enter job description");
        return;
      }

      const applications = await fetchApplications();

      const filtered = applications.filter(
        app => app.role === role
      );

      if (!filtered.length) {
        alert("No resumes found");
        return;
      }

      const analyzedResults = [];

      for (const app of filtered) {
        const cleanJD = jobDescription
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();

        const cleanResume = (app.text || "")
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();

        if (!cleanResume) continue;

        const response = await axios.post(
          "http://127.0.0.1:8000/match",
          {
            jobDescription: cleanJD,
            resumeText: cleanResume
          }
        );

        analyzedResults.push({
          _id: app._id,
          name: app.name,
          percentage: Math.round(response.data.percentage || 0),
          resumeUrl: app.resumeUrl,
          status: app.status || "APPLIED"
        });
      }

      setAllResults(analyzedResults);
      setResults(
        limit ? analyzedResults.slice(0, limit) : analyzedResults
      );

    } catch (error) {
      console.error(error);
      alert("AI analysis failed");
    }
  };

  /* UPDATE STATUS */
  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `http://localhost:5000/api/applications/status/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Candidate ${status}`);
      handleAnalyze();

    } catch {
      alert("Status update failed");
    }
  };

  /* LIMIT FILTER */
  const handleLimitChange = e => {
    const value = Number(e.target.value);
    setLimit(value);
    setResults(value ? allResults.slice(0, value) : allResults);
  };

  const shortlisted = allResults.filter(
    r => r.status === "ACCEPTED"
  );

  /* DOWNLOAD SHORTLISTED PDF */
  const downloadShortlistedPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Shortlisted Candidates Report", 20, 20);

    let y = 40;

    shortlisted.forEach((c, index) => {
      doc.setFontSize(12);
      doc.text(
        `${index + 1}. ${c.name} - ${c.percentage}%`,
        20,
        y
      );
      y += 10;
    });

    doc.save("Shortlisted_Candidates.pdf");
  };

  return (
    <>
      <Navbar role="hr" />

      <div className="hr-page">
        <h2 className="page-title">HR Dashboard</h2>

        {/* JOB DESCRIPTION */}
        <div className="jd-card">
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
          >
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
            onChange={e => setJobDescription(e.target.value)}
          />

          <button onClick={handleAnalyze}>
            Analyze Resumes
          </button>
        </div>

        {results.length > 0 && (
          <div className="table-card">
            <div className="table-header">
              <h3>ATS Screening Results</h3>

              <button
                className="view-shortlisted-btn"
                onClick={() => setShowPopup(true)}
              >
                View Shortlisted ({shortlisted.length})
              </button>
            </div>

            <div className="limit-input-wrapper">
              <input
                type="number"
                placeholder="Candidates required"
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
                  {results.map(res => (
                    <tr key={res._id}>
                      <td>{res.name}</td>

                      <td>
                        <button
                          className="view-btn"
                          onClick={() =>
                            window.open(
                              `https://docs.google.com/gview?url=${res.resumeUrl}&embedded=true`,
                              "_blank"
                            )
                          }
                        >
                          View PDF
                        </button>
                      </td>

                      <td className="match">
                        {res.percentage}%
                      </td>

                      <td>
                        {res.status === "APPLIED" ? (
                          <>
                            <button
                              className="accept-btn"
                              onClick={() =>
                                updateStatus(res._id, "UNDER_REVIEW")
                              }
                            >
                              Review
                            </button>

                            <button
                              className="reject-btn"
                              onClick={() =>
                                updateStatus(res._id, "ACCEPTED")
                              }
                            >
                              Accept
                            </button>
                          </>
                        ) : (
                          <span className="status">
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

        {/* ⭐ SHORTLIST POPUP */}
        {showPopup && (
          <div className="popup-overlay">
            <div className="shortlist-modal">
              <h3>Shortlisted Candidates</h3>

              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Resume</th>
                    <th>Match %</th>
                  </tr>
                </thead>

                <tbody>
                  {shortlisted.map(c => (
                    <tr key={c._id}>
                      <td>{c.name}</td>

                      <td>
                        <button
                          className="view-btn"
                          onClick={() =>
                            window.open(
                              `https://docs.google.com/gview?url=${c.resumeUrl}&embedded=true`,
                              "_blank"
                            )
                          }
                        >
                          View PDF
                        </button>
                      </td>

                      <td>{c.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* ⭐ FIXED BUTTONS */}
              <div className="shortlist-actions">
                <button
                  className="download-all-btn"
                  onClick={downloadShortlistedPDF}
                >
                  Download PDF
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