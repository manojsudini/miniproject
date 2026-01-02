import { useState } from "react";
import { analyzeResumes } from "../ats/atsLogic";
import "./HRDashboard.css";
import Navbar from "../components/Navbar.jsx";

function HRDashboard() {
  const [jobDescription, setJobDescription] = useState("");
  const [role, setRole] = useState("Software Tester");
  const [limit, setLimit] = useState(5);
  const [results, setResults] = useState([]);

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
      resumeName: filtered[index].resumeName,
      status: "Pending"
    }));

    setResults(merged.slice(0, limit));
  };

  const updateStatus = (index, status) => {
    const updated = [...results];
    updated[index].status = status;
    setResults(updated);
  };

  const downloadShortlisted = () => {
    const shortlisted = results.filter(r => r.status === "Accepted");
    alert(`Downloading ${shortlisted.length} shortlisted resumes`);
  };

  return (
    <>
      <Navbar role="hr" />
      <div className="hr-page">
        <h2 className="page-title">HR Dashboard</h2>

        <div className="jd-card">
          <select onChange={(e) => setRole(e.target.value)}>
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

          <input
            type="number"
            placeholder="Number of candidates required"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />

          <button onClick={handleAnalyze}>Analyze Resumes</button>
        </div>

        {results.length > 0 && (
          <div className="table-card">
            <h3>ATS Screening Results</h3>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Resume</th>
                    <th>Match %</th>
                    <th>Status</th>
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

            {results.some(r => r.status === "Accepted") && (
              <div className="shortlist-bar">
                <button onClick={downloadShortlisted}>
                  Download Shortlisted Resumes
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default HRDashboard;
