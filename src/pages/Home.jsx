import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Home.css";

const words = ["Simplified", "Faster", "Smarter", "Fairer"];

const Home = () => {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

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
        <div className="home-logo">HireMate</div>

        <div className="home-auth">
          <Link to="/login" className="nav-login">
            Login
          </Link>

          <Link to="/signup" className="nav-signup">
            Create Account
          </Link>
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
            className="btn-main"
            onClick={() => navigate("/login", { state: { role: "Applicant" } })}
          >
            I’m a Job Seeker
          </button> 

          <button
            className="btn-outline"
            onClick={() => navigate("/login", { state: { role: "HR" } })}
          >
            I’m an HR Recruiter
          </button>
        </div>
      </header>

      {/* WORKFLOW */}
      <section className="workflow-container">
        <h3>How HireMate Works</h3>

        <div className="workflow-grid">
          <div className="workflow-card">
            <div className="step-circle">1</div>
            <h4>Apply</h4>
            <p>Applicants upload resumes and apply for job roles.</p>
          </div>

          <div className="workflow-connector">→</div>

          <div className="workflow-card">
            <div className="step-circle">2</div>
            <h4>Analyze</h4>
            <p>
              ATS compares resumes with job descriptions and calculates
              match percentage.
            </p>
          </div>

          <div className="workflow-connector">→</div>

          <div className="workflow-card">
            <div className="step-circle">3</div>
            <h4>Shortlist</h4>
            <p>HR reviews candidates and shortlists the best matches.</p>
          </div>
        </div>
      </section>

      {/* ROLE BENEFITS */}
      <section className="roles-grid">
        <div className="role-card applicant-side">
          <span className="role-tag tag-blue">For Applicants</span>
          <ul>
            <li>✓ Simple job application</li>
            <li>✓ Resume upload support</li>
            <li>✓ Easy dashboard tracking</li>
          </ul>
        </div>

        <div className="role-card hr-side">
          <span className="role-tag tag-green">For HR Teams</span>
          <ul>
            <li>✓ ATS-based resume screening</li>
            <li>✓ Ranked candidate comparison</li>
            <li>✓ Faster hiring decisions</li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default Home;
