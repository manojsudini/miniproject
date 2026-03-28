import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import Navbar from "../components/Navbar.jsx";
import { RAZORPAY_KEY_ID, apiUrl } from "../config/api";
import "./HRDashboard.css";

const ROLE_OPTIONS = [
  "Software Tester",
  "Software Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "QA Engineer",
  "Data Analyst",
  "DevOps Engineer",
  "UI/UX Designer",
];

const MIN_MATCH_PERCENT = 45;
const PDF_MARGIN = 14;
const PDF_HEADER_HEIGHT = 24;
const PDF_CONTENT_TOP = 36;
const PDF_FOOTER_HEIGHT = 12;

const formatStatus = (status = "") => status.replace(/_/g, " ");

const formatReportTimestamp = () =>
  new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const truncateLabel = (value = "", maxLength = 16) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

const getStatusClassName = (status = "") =>
  `status-${status.toLowerCase().replace(/_/g, "-")}`;

const getCandidateInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "NA";

const getMatchTone = (percentage) => {
  if (percentage >= 75) {
    return "high";
  }

  if (percentage >= 60) {
    return "medium";
  }

  return "low";
};

const formatAppliedDate = (value) => {
  if (!value) {
    return "Unknown";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getAtsErrorMessage = (error) => {
  const responseMessage = error?.response?.data?.message;
  const responseDetails = error?.response?.data?.details;

  if (responseMessage && responseDetails) {
    return `${responseMessage}: ${responseDetails}`;
  }

  if (responseMessage) {
    return responseMessage;
  }

  if (error?.message) {
    return error.message;
  }

  return "AI analysis failed";
};

const drawPdfLogo = (doc, x, y) => {
  doc.setFillColor(14, 165, 233);
  doc.roundedRect(x, y, 12, 12, 3, 3, "F");

  doc.setTextColor(239, 246, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("HM", x + 6, y + 7.8, { align: "center" });
};

const drawPdfNavbar = (doc, pageWidth, reportLabel) => {
  doc.setFillColor(2, 6, 23);
  doc.rect(0, 0, pageWidth, PDF_HEADER_HEIGHT, "F");

  drawPdfLogo(doc, PDF_MARGIN, 6);

  doc.setTextColor(241, 245, 249);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("HireMate", PDF_MARGIN + 16, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(148, 163, 184);
  doc.text("HR Dashboard", pageWidth - 76, 14);

  doc.setTextColor(125, 211, 252);
  doc.text("Shortlisted", pageWidth - 47, 14);

  doc.setTextColor(148, 163, 184);
  doc.text(reportLabel, pageWidth - 18, 14, { align: "right" });
};

const drawPdfFooter = (doc, pageWidth, pageHeight, pageNumber) => {
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(PDF_MARGIN, pageHeight - PDF_FOOTER_HEIGHT, pageWidth - PDF_MARGIN, pageHeight - PDF_FOOTER_HEIGHT);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("HireMate shortlist report", PDF_MARGIN, pageHeight - 5);
  doc.text(`Page ${pageNumber}`, pageWidth - PDF_MARGIN, pageHeight - 5, {
    align: "right",
  });
};

const drawPdfSummaryCard = (doc, x, y, width, title, value, tone = "default") => {
  const toneStyles = {
    default: {
      fill: [241, 245, 249],
      border: [226, 232, 240],
      value: [15, 23, 42],
    },
    accent: {
      fill: [224, 242, 254],
      border: [125, 211, 252],
      value: [2, 132, 199],
    },
    success: {
      fill: [220, 252, 231],
      border: [134, 239, 172],
      value: [22, 163, 74],
    },
  };

  const style = toneStyles[tone] || toneStyles.default;

  doc.setFillColor(...style.fill);
  doc.setDrawColor(...style.border);
  doc.roundedRect(x, y, width, 18, 3, 3, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(title, x + 4, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...style.value);
  doc.text(value, x + 4, y + 13.5);
};

const drawPdfTableHeader = (doc, y, columnX) => {
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(PDF_MARGIN, y, 182, 10, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(226, 232, 240);
  doc.text("Rank", columnX.rank, y + 6.3);
  doc.text("Candidate", columnX.candidate, y + 6.3);
  doc.text("Match", columnX.match, y + 6.3);
  doc.text("Status", columnX.status, y + 6.3);
  doc.text("Notes", columnX.notes, y + 6.3);
};

function HRDashboard() {
  const [jobDescription, setJobDescription] = useState("");
  const [role, setRole] = useState("Software Tester");
  const [limit, setLimit] = useState("");
  const [allResults, setAllResults] = useState([]);
  const [results, setResults] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showPromote, setShowPromote] = useState(false);
  const [isPromoted, setIsPromoted] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    document.body.style.overflow = showPopup ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showPopup]);

  useEffect(() => {
    if (!message) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  const fetchApplications = async () => {
    try {
      const { data } = await axios.get(
        apiUrl("/api/applications"),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return data;
    } catch (error) {
      console.error("Fetch error", error);
      setMessage("Failed to fetch applications");
      setMessageType("error");
      return [];
    }
  };

  const handleAnalyze = async ({ preserveMessage = false } = {}) => {
    if (!jobDescription.trim()) {
      setMessage("Please enter job description");
      setMessageType("error");
      return;
    }

    setHasAnalyzed(true);
    setIsAnalyzing(true);

    try {
      const applications = await fetchApplications();
      const filtered = applications.filter((app) => app.role === role);

      console.table(
        filtered.map((app) => ({
          candidateName: app.name,
          appliedOn: formatAppliedDate(app.createdAt),
          role: app.role,
          status: app.status || "APPLIED",
        }))
      );

      if (!filtered.length) {
        setAllResults([]);
        setResults([]);
        setShowPromote(false);

        if (!preserveMessage) {
          setMessage("No resumes found for this role");
          setMessageType("error");
        }

        return;
      }

      const cleanJD = jobDescription.toLowerCase().replace(/\s+/g, " ").trim();
      const candidatesForAnalysis = filtered
        .map((app) => ({
          ...app,
          cleanResume: (app.text || "").toLowerCase().replace(/\s+/g, " ").trim(),
        }))
        .filter((app) => app.cleanResume);

      if (!candidatesForAnalysis.length) {
        setAllResults([]);
        setResults([]);
        setShowPromote(false);

        if (!preserveMessage) {
          setMessage("No extracted resume text is available for ATS analysis");
          setMessageType("error");
        }

        return;
      }

      let analysisResults = [];

      try {
        const { data } = await axios.post(apiUrl("/api/ats/match-batch"), {
          jobDescription: cleanJD,
          selectedRole: role,
          candidates: candidatesForAnalysis.map((app) => ({
            candidateId: app._id,
            candidateName: app.name,
            appliedAt: app.createdAt,
            resumeText: app.cleanResume,
          })),
        });

        analysisResults = data.results || [];
      } catch (batchError) {
        console.warn("Batch ATS analysis failed, falling back to single requests", batchError);

        const settledResults = await Promise.allSettled(
          candidatesForAnalysis.map(async (app) => {
            const response = await axios.post(apiUrl("/api/ats/match"), {
              jobDescription: cleanJD,
              resumeText: app.cleanResume,
              selectedRole: role,
              candidateName: app.name,
              appliedAt: app.createdAt,
            });

            return {
              ...(response.data || {}),
              candidateId: app._id,
            };
          })
        );

        const successfulResults = settledResults
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value);

        if (successfulResults.length === 0) {
          const firstFailure = settledResults.find(
            (result) => result.status === "rejected"
          );
          throw firstFailure?.reason || batchError;
        }

        analysisResults = successfulResults;
      }

      const analysisByCandidateId = new Map(
        analysisResults.map((result) => [result.candidateId, result])
      );

      const analyzedResults = candidatesForAnalysis.reduce((matches, app) => {
        const analysis = analysisByCandidateId.get(app._id);
        const matchPercent = Math.round(analysis?.percentage || 0);

        if (matchPercent < MIN_MATCH_PERCENT) {
          return matches;
        }

        matches.push({
          _id: app._id,
          name: app.name,
          createdAt: app.createdAt,
          percentage: matchPercent,
          resumeUrl: app.resumeUrl,
          status: app.status || "APPLIED",
          missingSkills: analysis?.missingSkills || [],
        });

        return matches;
      }, []);

      analyzedResults.sort((firstCandidate, secondCandidate) =>
        secondCandidate.percentage - firstCandidate.percentage
      );

      setAllResults(analyzedResults);

      const numericLimit = Number(limit);

      if (numericLimit > 0) {
        setResults(analyzedResults.slice(0, numericLimit));
      } else {
        setResults(analyzedResults);
      }

      setShowPromote(analyzedResults.length > 0);

      if (!preserveMessage) {
        if (analyzedResults.length > 0) {
          setMessage("Analysis completed successfully");
          setMessageType("success");
        } else {
          setMessage(`No candidates crossed the ${MIN_MATCH_PERCENT}% match threshold`);
          setMessageType("error");
        }
      }
    } catch (error) {
      console.error("AI Analysis error", error);
      setMessage(getAtsErrorMessage(error));
      setMessageType("error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePromoteJob = async () => {
    setIsPromoting(true);

    try {
      const response = await axios.post(
        apiUrl("/api/payment/create-payment")
      );

      const order = response.data;

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: "INR",
        name: "HireMate",
        description: "Job Promotion Payment",
        order_id: order.id,
        handler() {
          setIsPromoted(true);
          setMessage("Job promoted successfully");
          setMessageType("success");
        },
        theme: {
          color: "#0ea5e9",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error", error);
      setMessage("Payment failed");
      setMessageType("error");
    } finally {
      setIsPromoting(false);
    }
  };

  const updateStatus = async (id, status, reason = "") => {
    setUpdatingId(id);

    try {
      await axios.put(
        apiUrl(`/api/applications/status/${id}`),
        {
          status,
          rejectionReason: reason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await handleAnalyze({ preserveMessage: true });

      setMessage(`Candidate ${formatStatus(status).toLowerCase()} successfully`);
      setMessageType("success");
    } catch (error) {
      console.error("Status update error", error);
      setMessage("Status update failed");
      setMessageType("error");
    } finally {
      setUpdatingId("");
    }
  };

  const handleLimitChange = (e) => {
    const rawValue = e.target.value;
    setLimit(rawValue);

    const numericValue = Number(rawValue);

    if (!rawValue || numericValue <= 0) {
      setResults(allResults);
      return;
    }

    setResults(allResults.slice(0, numericValue));
  };

  const openResumeViewer = (resumeUrl) => {
    window.open(
      `https://docs.google.com/gview?url=${resumeUrl}&embedded=true`,
      "_blank"
    );
  };

  const shortlisted = allResults.filter(
    (candidate) => candidate.status === "ACCEPTED"
  );
  const reviewedCount = allResults.filter(
    (candidate) => candidate.status === "UNDER_REVIEW"
  ).length;
  const rejectedCount = allResults.filter(
    (candidate) => candidate.status === "REJECTED"
  ).length;
  const averageMatch = allResults.length
    ? Math.round(
        allResults.reduce((total, candidate) => total + candidate.percentage, 0) /
          allResults.length
      )
    : 0;
  const topCandidate = allResults[0] || null;
  const displayedCount = results.length;
  const limitLabel = limit ? `Top ${limit}` : "All qualified";

  const downloadShortlistedPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const generatedAt = formatReportTimestamp();
    const reportLabel = "Report";
    const columnX = {
      rank: PDF_MARGIN + 4,
      candidate: 34,
      match: 108,
      status: 132,
      notes: 156,
    };
    const summaryCardWidth = 56;
    const averageShortlistMatch = shortlisted.length
      ? Math.round(
          shortlisted.reduce((total, candidate) => total + candidate.percentage, 0) /
            shortlisted.length
        )
      : 0;
    const topShortlistCandidate = shortlisted[0] || null;
    const topCandidateLabel = topShortlistCandidate
      ? truncateLabel(topShortlistCandidate.name)
      : "NA";
    let pageNumber = 1;

    const drawPageShell = () => {
      drawPdfNavbar(doc, pageWidth, reportLabel);
      drawPdfFooter(doc, pageWidth, pageHeight, pageNumber);
    };

    drawPageShell();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text("Shortlisted Candidates Report", PDF_MARGIN, PDF_CONTENT_TOP);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Generated on ${generatedAt}`, PDF_MARGIN, PDF_CONTENT_TOP + 7);
    doc.text(`Role: ${role}`, pageWidth - PDF_MARGIN, PDF_CONTENT_TOP + 7, {
      align: "right",
    });

    drawPdfSummaryCard(
      doc,
      PDF_MARGIN,
      PDF_CONTENT_TOP + 14,
      summaryCardWidth,
      "Shortlisted",
      String(shortlisted.length),
      "accent"
    );
    drawPdfSummaryCard(
      doc,
      PDF_MARGIN + summaryCardWidth + 6,
      PDF_CONTENT_TOP + 14,
      summaryCardWidth,
      "Average Match",
      `${averageShortlistMatch}%`,
      "default"
    );
    drawPdfSummaryCard(
      doc,
      PDF_MARGIN + (summaryCardWidth + 6) * 2,
      PDF_CONTENT_TOP + 14,
      summaryCardWidth,
      "Top Candidate",
      topCandidateLabel,
      "success"
    );

    let y = PDF_CONTENT_TOP + 40;

    drawPdfTableHeader(doc, y, columnX);
    y += 14;

    shortlisted.forEach((candidate, index) => {
      const notesText = candidate.missingSkills.length
        ? `Missing: ${candidate.missingSkills.slice(0, 2).join(", ")}`
        : "Strong overall alignment";
      const noteLines = doc.splitTextToSize(notesText, 38);
      const candidateLines = doc.splitTextToSize(candidate.name, 64);
      const rowHeight = Math.max(14, candidateLines.length * 5 + 6, noteLines.length * 5 + 6);

      if (y + rowHeight > pageHeight - 20) {
        doc.addPage();
        pageNumber += 1;
        drawPageShell();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text("Shortlisted Candidates", PDF_MARGIN, PDF_CONTENT_TOP - 2);

        y = PDF_CONTENT_TOP + 8;
        drawPdfTableHeader(doc, y, columnX);
        y += 14;
      }

      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(PDF_MARGIN, y - 4, 182, rowHeight, 2, 2, "F");
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text(String(index + 1).padStart(2, "0"), columnX.rank, y + 2.5);

      doc.text(candidateLines, columnX.candidate, y + 2.5);

      doc.setTextColor(2, 132, 199);
      doc.text(`${candidate.percentage}%`, columnX.match, y + 2.5);

      doc.setTextColor(22, 163, 74);
      doc.text("Accepted", columnX.status, y + 2.5);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(71, 85, 105);
      doc.text(noteLines, columnX.notes, y + 2.5);

      y += rowHeight + 2;
    });

    doc.save("Shortlisted_Candidates.pdf");
  };

  return (
    <>
      <Navbar role="hr" />

      {message && (
        <div className="toast-wrapper">
          <div className={`toast-message ${messageType}`}>
            <span className="toast-icon">
              {messageType === "success" ? "OK" : "!"}
            </span>
            <span className="toast-text">{message}</span>
          </div>
        </div>
      )}

      <div className="hr-page">
        <div className="dashboard-shell">
          <section className="dashboard-hero">
            <div className="hero-copy">
              <p className="hero-eyebrow">Talent Command Center</p>
              <h2 className="page-title">HR Dashboard</h2>
              <p className="page-subtitle">
                Screen candidates faster, compare match quality, and move
                high-intent roles through the pipeline with more confidence.
              </p>
            </div>

            <div className="hero-context">
              <div className="hero-chip">Role: {role}</div>
              <div className="hero-chip muted">
                Threshold: {MIN_MATCH_PERCENT}%+
              </div>
              <div className="hero-chip muted">View: {limitLabel}</div>
            </div>
          </section>

          <section className="overview-grid">
            <article className="overview-card">
              <span>Qualified matches</span>
              <strong>{allResults.length}</strong>
              <small>Profiles above the minimum threshold</small>
            </article>

            <article className="overview-card highlight">
              <span>Shortlisted</span>
              <strong>{shortlisted.length}</strong>
              <small>Candidates already accepted</small>
            </article>

            <article className="overview-card">
              <span>Average match</span>
              <strong>{averageMatch}%</strong>
              <small>Across the current ranked pool</small>
            </article>

            <article className="overview-card">
              <span>Under review</span>
              <strong>{reviewedCount}</strong>
              <small>Profiles waiting for a decision</small>
            </article>
          </section>

          <section className="workspace-grid">
            <div className="jd-card compose-card">
              <div className="card-heading">
                <div>
                  <p className="section-kicker">Job setup</p>
                  <h3>Analyze candidates for this role</h3>
                </div>
                <span className="status-chip">{limitLabel}</span>
              </div>

              <div className="form-row">
                <div className="field-group">
                  <label htmlFor="hr-role">Open role</label>
                  <select
                    id="hr-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="field-group">
                  <label htmlFor="hr-limit">Candidate cap</label>
                  <input
                    id="hr-limit"
                    type="number"
                    min="1"
                    placeholder="All qualified"
                    value={limit}
                    onChange={handleLimitChange}
                  />
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="hr-jd">Job description</label>
                <textarea
                  id="hr-jd"
                  placeholder="Paste responsibilities, skills, seniority, tools, and any must-have requirements..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
              </div>

              <div className="compose-footer">
                <button onClick={() => handleAnalyze()} disabled={isAnalyzing}>
                  {isAnalyzing ? "Analyzing candidate fit..." : "Analyze Resumes"}
                </button>

                {showPromote && !isPromoted && (
                  <button
                    className="promote-btn"
                    onClick={handlePromoteJob}
                    disabled={isPromoting}
                  >
                    {isPromoting ? "Opening payment..." : "Promote Job - INR 5000"}
                  </button>
                )}

                {isPromoted && (
                  <div className="promoted-box">Promoted live</div>
                )}
              </div>
            </div>

            <aside className="insights-card">
              <div className="card-heading">
                <div>
                  <p className="section-kicker">Live insights</p>
                  <h3>Hiring snapshot</h3>
                </div>
              </div>

              <div className="insight-list">
                <div className="insight-item">
                  <span>Selected role</span>
                  <strong>{role}</strong>
                </div>

                <div className="insight-item">
                  <span>Minimum match required</span>
                  <strong>{MIN_MATCH_PERCENT}%</strong>
                </div>

                <div className="insight-item">
                  <span>Rejected after screening</span>
                  <strong>{rejectedCount}</strong>
                </div>

                <div className="insight-item">
                  <span>Displayed candidate view</span>
                  <strong>{limitLabel}</strong>
                </div>
              </div>

              {topCandidate ? (
                <div className="highlight-card">
                  <p className="highlight-label">Top ranked candidate</p>
                  <h4>{topCandidate.name}</h4>
                  <div className="highlight-metrics">
                    <span>{topCandidate.percentage}% match</span>
                    <span>
                      {topCandidate.missingSkills.length
                        ? `${topCandidate.missingSkills.length} flagged gaps`
                        : "No missing skills flagged"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="placeholder-note">
                  Run an analysis to surface the strongest resumes, match scores,
                  and a sharper shortlist view.
                </div>
              )}
            </aside>
          </section>

          {results.length > 0 ? (
            <section className="results-panel">
              <div className="table-card">
                <div className="table-header">
                  <div>
                    <p className="section-kicker">AI ranking</p>
                    <h3>ATS Screening Results</h3>
                    <p className="table-subtitle">
                      Showing {displayedCount} of {allResults.length} qualified
                      candidates for {role}.
                    </p>
                  </div>

                  <div className="header-actions">
                    <span className="mini-stat">
                      Highest match: {topCandidate ? `${topCandidate.percentage}%` : "NA"}
                    </span>

                    <button
                      className="view-shortlisted-btn"
                      onClick={() => setShowPopup(true)}
                      disabled={shortlisted.length === 0}
                    >
                      View Shortlisted ({shortlisted.length})
                    </button>
                  </div>
                </div>

                <div className="results-ribbon">
                  <span className="ribbon-pill">Average match {averageMatch}%</span>
                  <span className="ribbon-pill">Under review {reviewedCount}</span>
                  <span className="ribbon-pill">Rejected {rejectedCount}</span>
                </div>

                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Match</th>
                        <th>Skill Gaps</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {results.map((candidate) => {
                        const visibleMissingSkills = candidate.missingSkills
                          .filter(Boolean)
                          .slice(0, 3);
                        const extraSkillCount = Math.max(
                          0,
                          candidate.missingSkills.filter(Boolean).length -
                            visibleMissingSkills.length
                        );
                        const isUpdating = updatingId === candidate._id;

                        return (
                          <tr key={candidate._id}>
                            <td>
                              <div className="candidate-profile">
                                <div className="candidate-avatar">
                                  {getCandidateInitials(candidate.name)}
                                </div>

                                <div>
                                  <div className="candidate-name">
                                    {candidate.name}
                                  </div>
                                  <div className="candidate-meta">{role}</div>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span
                                className={`match-badge ${getMatchTone(candidate.percentage)}`}
                              >
                                {candidate.percentage}%
                              </span>
                            </td>

                            <td>
                              {visibleMissingSkills.length > 0 ? (
                                <div className="skills-list">
                                  {visibleMissingSkills.map((skill) => (
                                    <span className="skill-pill" key={skill}>
                                      {skill}
                                    </span>
                                  ))}

                                  {extraSkillCount > 0 && (
                                    <span className="skill-pill more">
                                      +{extraSkillCount} more
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="aligned-pill">Fully aligned</span>
                              )}
                            </td>

                            <td>
                              <span
                                className={`status-pill ${getStatusClassName(candidate.status)}`}
                              >
                                {formatStatus(candidate.status)}
                              </span>
                            </td>

                            <td>
                              <div className="action-group">
                                <button
                                  className="view-btn"
                                  onClick={() => openResumeViewer(candidate.resumeUrl)}
                                >
                                  View Resume
                                </button>

                                {candidate.status === "APPLIED" && (
                                  <button
                                    className="review-btn"
                                    onClick={() =>
                                      updateStatus(candidate._id, "UNDER_REVIEW")
                                    }
                                    disabled={isUpdating}
                                  >
                                    {isUpdating ? "Updating..." : "Review"}
                                  </button>
                                )}

                                {candidate.status === "UNDER_REVIEW" && (
                                  <>
                                    <button
                                      className="accept-btn"
                                      onClick={() =>
                                        updateStatus(candidate._id, "ACCEPTED")
                                      }
                                      disabled={isUpdating}
                                    >
                                      {isUpdating ? "Saving..." : "Accept"}
                                    </button>

                                    <button
                                      className="reject-btn"
                                      onClick={() => {
                                        const reason = candidate.missingSkills.length
                                          ? `Missing skills: ${candidate.missingSkills.join(", ")}`
                                          : "Candidate did not meet final selection criteria";

                                        updateStatus(
                                          candidate._id,
                                          "REJECTED",
                                          reason
                                        );
                                      }}
                                      disabled={isUpdating}
                                    >
                                      {isUpdating ? "Saving..." : "Reject"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          ) : (
            <section className="empty-state">
              <div className="empty-card">
                <p className="section-kicker">Shortlist preview</p>
                <h3>
                  {hasAnalyzed ? "No qualified matches yet" : "Ready to screen candidates"}
                </h3>
                <p>
                  {hasAnalyzed
                    ? `No candidates cleared the ${MIN_MATCH_PERCENT}% threshold for ${role}. Try refining the job description or broadening the requirements.`
                    : "Select a role, paste the job description, and run the ATS analysis to surface the strongest resumes first."}
                </p>
              </div>
            </section>
          )}

          {showPopup && (
            <div className="popup-overlay">
              <div className="shortlist-modal">
                <div className="shortlist-header">
                  <div>
                    <p className="section-kicker">Accepted candidates</p>
                    <h3>Shortlisted Candidates</h3>
                    <p className="table-subtitle">
                      Export the current shortlist or review accepted profiles.
                    </p>
                  </div>

                  <span className="shortlist-count">
                    {shortlisted.length} accepted
                  </span>
                </div>

                <div className="shortlist-table-wrapper">
                  {shortlisted.length > 0 ? (
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Match</th>
                          <th>Resume</th>
                        </tr>
                      </thead>

                      <tbody>
                        {shortlisted.map((candidate) => (
                          <tr key={candidate._id}>
                            <td>{candidate.name}</td>
                            <td>{candidate.percentage}%</td>
                            <td>
                              <button
                                className="view-btn"
                                onClick={() => openResumeViewer(candidate.resumeUrl)}
                              >
                                View Resume
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="shortlist-empty">
                      Accept a candidate to populate the shortlist report.
                    </div>
                  )}
                </div>

                <div className="shortlist-actions">
                  <button
                    className="download-all-btn"
                    onClick={downloadShortlistedPDF}
                    disabled={shortlisted.length === 0}
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
      </div>
    </>
  );
}

export default HRDashboard;
