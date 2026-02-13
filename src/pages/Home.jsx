import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { animate } from "animejs";
import "./Home.css";

const words = ["Simplified", "Faster", "Smarter", "Fairer"];

const Home = () => {
  const [index, setIndex] = useState(0);
  const [flipWorkflow, setFlipWorkflow] = useState(false);
  const [flipApplicant, setFlipApplicant] = useState(false);
  const [flipHR, setFlipHR] = useState(false);

  const navigate = useNavigate();

  /* LOGO DRAG ANIMATION */
  const logoRef = useRef(null);
  const startX = useRef(0);
  const dragging = useRef(false);

  const handleDragStart = (e) => {
    dragging.current = true;
    startX.current = e.clientX;
    document.addEventListener("mousemove", handleDragging);
    document.addEventListener("mouseup", handleDragEnd);
  };

  const handleDragging = (e) => {
    if (!dragging.current) return;
    animate(logoRef.current, {
      translateX: e.clientX - startX.current,
      duration: 0,
    });
  };

  const handleDragEnd = () => {
    dragging.current = false;
    document.removeEventListener("mousemove", handleDragging);
    document.removeEventListener("mouseup", handleDragEnd);

    animate(logoRef.current, {
      translateX: 0,
      rotate: 360,
      duration: 900,
      easing: "easeOutElastic(1,.6)",
    });
  };

  /* WORD CHANGE */
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="home-wrapper">

      {/* NAVBAR */}
      <nav className="home-nav">
        <div
          className="home-logo"
          ref={logoRef}
          onMouseDown={handleDragStart}
        >
          HireMate
        </div>

        <div className="home-auth">
          <Link to="/login" className="nav-login">Login</Link>
          <Link to="/signup" className="nav-signup">Create Account</Link>
        </div>
      </nav>

      {/* HERO */}
      <header className="home-hero">
        <h1 className="hero-title">
          Hiring,&nbsp;
          <span className="changing-word">{words[index]}</span>
        </h1>

        <p className="hero-subtitle">
          HireMate is a smart Applicant Tracking System that helps companies
          screen resumes and hire faster.
        </p>

        <div className="hero-actions">
          <button
            className="btn-outline"
            onClick={() => navigate("/login", { state: { role: "applicant" } })}
          >
            I’m a Job Seeker
          </button>

          <button
            className="btn-outline"
            onClick={() => navigate("/login", { state: { role: "hr" } })}
          >
            I’m an HR Recruiter
          </button>
        </div>
      </header>

      {/* HOW HIREMATE WORKS FLIP */}
      <section className="workflow-wrapper">
        <div
          className={`flip-card workflow-flip ${flipWorkflow ? "flipped" : ""}`}
          onClick={() => setFlipWorkflow(!flipWorkflow)}
        >
          <div className="flip-inner">

            <div className="flip-front workflow-container">
              <h3>How HireMate Works</h3>

              <div className="workflow-grid">
                <div className="workflow-card">
                  <div className="step-circle">1</div>
                  <h4>Apply</h4>
                  <p>Applicants upload resumes.</p>
                </div>

                <div className="workflow-card">
                  <div className="step-circle">2</div>
                  <h4>Analyze</h4>
                  <p>ATS compares resumes.</p>
                </div>

                <div className="workflow-card">
                  <div className="step-circle">3</div>
                  <h4>Shortlist</h4>
                  <p>HR selects candidates.</p>
                </div>
              </div>
            </div>

            <div className="flip-back workflow-container">
              <h3>Advanced ATS Workflow</h3>
              <p>✔ AI Resume Parsing</p>
              <p>✔ Skill Matching Algorithm</p>
              <p>✔ Hiring Analytics Dashboard</p>
              <p>✔ Candidate Ranking Engine</p>
            </div>

          </div>
        </div>
      </section>

      {/* ROLE BENEFITS FLIP */}
      <section className="roles-grid">

        <div
          className={`flip-card ${flipApplicant ? "flipped" : ""}`}
          onClick={() => setFlipApplicant(!flipApplicant)}
        >
          <div className="flip-inner">
            <div className="flip-front role-card">
              <span className="role-tag tag-blue">For Applicants</span>
              <ul>
                <li>✓ Simple job application</li>
                <li>✓ Resume upload support</li>
                <li>✓ Easy dashboard tracking</li>
              </ul>
            </div>

            <div className="flip-back role-card">
              <span className="role-tag tag-blue">Applicant Extras</span>
              <ul>
                <li>✓ Live tracking</li>
                <li>✓ Resume feedback</li>
                <li>✓ AI tips</li>
              </ul>
            </div>
          </div>
        </div>

        <div
          className={`flip-card ${flipHR ? "flipped" : ""}`}
          onClick={() => setFlipHR(!flipHR)}
        >
          <div className="flip-inner">
            <div className="flip-front role-card">
              <span className="role-tag tag-green">For HR Teams</span>
              <ul>
                <li>✓ ATS screening</li>
                <li>✓ Candidate ranking</li>
                <li>✓ Faster hiring</li>
              </ul>
            </div>

            <div className="flip-back role-card">
              <span className="role-tag tag-green">HR Extras</span>
              <ul>
                <li>✓ Analytics dashboard</li>
                <li>✓ Automated filtering</li>
                <li>✓ Interview tracking</li>
              </ul>
            </div>
          </div>
        </div>

      </section>
    </div>
  );
};

export default Home;