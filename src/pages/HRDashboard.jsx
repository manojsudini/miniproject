import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import Navbar from "../components/Navbar.jsx";
import "./HRDashboard.css";


/* =========================================================
   HR DASHBOARD COMPONENT
========================================================= */

function HRDashboard() {


  /* =========================================================
     STATE VARIABLES
  ========================================================= */

  const [jobDescription, setJobDescription] = useState("");

  const [role, setRole] = useState("Software Tester");

  const [limit, setLimit] = useState("");

  const [allResults, setAllResults] = useState([]);

  const [results, setResults] = useState([]);

  const [showPopup, setShowPopup] = useState(false);


  /* =========================================================
     PROMOTION STATES
  ========================================================= */

  const [showPromote, setShowPromote] = useState(false);

  const [isPromoted, setIsPromoted] = useState(false);


  /* =========================================================
     MESSAGE SYSTEM
  ========================================================= */

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("");


  /* =========================================================
     TOKEN FROM LOCAL STORAGE
  ========================================================= */

  const token = localStorage.getItem("token");


  /* =========================================================
     LOCK BODY SCROLL WHEN POPUP OPENS
  ========================================================= */

  useEffect(() => {

    document.body.style.overflow = showPopup ? "hidden" : "auto";

    return () => (document.body.style.overflow = "auto");

  }, [showPopup]);


  /* =========================================================
     AUTO HIDE MESSAGE
  ========================================================= */

  useEffect(() => {

   if (message) {
  const timer = setTimeout(() => {
    setMessage("");
    setMessageType("");
  }, 3000);


      return () => clearTimeout(timer);

    }

  }, [message]);


  /* =========================================================
     FETCH APPLICATIONS FROM BACKEND
  ========================================================= */

  const fetchApplications = async () => {

    try {

      const { data } = await axios.get(
        "http://localhost:5000/api/applications",
        {
          headers: { Authorization: `Bearer ${token}` }
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


  /* =========================================================
     ANALYZE RESUMES USING AI
  ========================================================= */

  const handleAnalyze = async () => {

    try {

      if (!jobDescription.trim()) {

        setMessage("Please enter job description");
        setMessageType("error");
        return;

      }


      const applications = await fetchApplications();


      const filtered = applications.filter(
        (app) => app.role === role
      );


      if (!filtered.length) {

        setMessage("No resumes found for this role");
        setMessageType("error");
        return;

      }


      const analyzedResults = [];


      const MIN_MATCH_PERCENT = 45;


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


        const matchPercent = Math.round(response.data.percentage || 0);


        if (matchPercent < MIN_MATCH_PERCENT) continue;


        analyzedResults.push({

          _id: app._id,
          name: app.name,
          percentage: matchPercent,
          resumeUrl: app.resumeUrl,
          status: app.status || "APPLIED",
          missingSkills: response.data.missingSkills || []

        });

      }


      setAllResults(analyzedResults);


      if (limit) {

        setResults(analyzedResults.slice(0, limit));

      } else {

        setResults(analyzedResults);

      }


      setShowPromote(true);


      setMessage("Analysis completed successfully");
      setMessageType("success");


    } catch (error) {

      console.error("AI Analysis error", error);

      setMessage("AI analysis failed");
      setMessageType("error");

    }

  };
  /* =========================================================
   JOB PROMOTION PAYMENT (RAZORPAY)
========================================================= */

const handlePromoteJob = async () => {

  try {

    const response = await axios.post(
      "http://localhost:5000/api/payment/create-payment"
    );

    const order = response.data;

    const options = {

      key: "rzp_test_SN7sEcagRzBQAG",

      amount: order.amount,

      currency: "INR",

      name: "HireMate",

      description: "Job Promotion Payment",

      order_id: order.id,

      handler: function () {

        setIsPromoted(true);

        setMessage("Job promoted successfully");

        setMessageType("success");

      },

      theme: {
        color: "#0ea5e9"
      }

    };

    const rzp = new window.Razorpay(options);

    rzp.open();

  }

  catch (error) {

    console.error("Payment error", error);

    setMessage("Payment failed");

    setMessageType("error");

  }

};


/* =========================================================
   UPDATE APPLICATION STATUS
========================================================= */

const updateStatus = async (id, status, reason = "") => {

  try {

    await axios.put(
      `http://localhost:5000/api/applications/status/${id}`,
      {
        status,
        rejectionReason: reason
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    handleAnalyze();

    setMessage(`Candidate ${status.toLowerCase()} successfully`);

    setMessageType("success");

  }

  catch (error) {

    console.error("Status update error", error);

    setMessage("Status update failed");

    setMessageType("error");

  }

};


/* =========================================================
   LIMIT FILTER
========================================================= */

const handleLimitChange = (e) => {

  const value = Number(e.target.value);

  setLimit(value);

  if (value) {

    setResults(allResults.slice(0, value));

  } else {

    setResults(allResults);

  }

};


/* =========================================================
   SHORTLISTED CANDIDATES
========================================================= */

const shortlisted = allResults.filter(
  r => r.status === "ACCEPTED"
);


/* =========================================================
   DOWNLOAD SHORTLISTED PDF
========================================================= */

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


/* =========================================================
   UI RENDER SECTION
========================================================= */

return (
<>
  <Navbar role="hr" />

  {message && (
  <div className="toast-wrapper">
    <div className={`toast-message ${messageType}`}>
      <span className="toast-icon">
        {messageType === "success" ? "✔" : "⚠"}
      </span>

      <span className="toast-text">
        {message}
      </span>
    </div>
  </div>
)}
  <div className="hr-page">

    <h2 className="page-title">
      HR Dashboard
    </h2>

    <div className="jd-card">

      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
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
        onChange={(e) =>
          setJobDescription(e.target.value)
        }
      />

      <button onClick={handleAnalyze}>
        Analyze Resumes
      </button>

      {showPromote && !isPromoted && (

        <div className="promote-container">

          <button
            className="promote-btn"
            onClick={handlePromoteJob}
          >
            Promote Job ₹5000
          </button>

        </div>

      )}

      {isPromoted && (

        <div className="promoted-box">
          Promoted ✓
        </div>

      )}

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

              {results.map((res) => (

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

                    {res.status === "APPLIED" && (

                      <button
                        className="review-btn"
                        onClick={() =>
                          updateStatus(res._id, "UNDER_REVIEW")
                        }
                      >
                        Review
                      </button>

                    )}

                    {res.status === "UNDER_REVIEW" && (

                      <>

                        <button
                          className="accept-btn"
                          onClick={() =>
                            updateStatus(res._id, "ACCEPTED")
                          }
                        >
                          Accept
                        </button>

                        <button
                          className="reject-btn"
                          onClick={() => {

                            const reason =
                              "Missing skills: " +
                              res.missingSkills.join(", ");

                            updateStatus(
                              res._id,
                              "REJECTED",
                              reason
                            );

                          }}
                        >
                          Reject
                        </button>

                      </>

                    )}

                    {res.status === "ACCEPTED" && (
                      <span className="accepted">
                        ACCEPTED
                      </span>
                    )}

                    {res.status === "REJECTED" && (
                      <span className="rejected">
                        REJECTED
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

              {shortlisted.map((c) => (

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