import { useState } from "react";
import "./ApplicantDashboard.css";
import Navbar from "../components/Navbar.jsx";

function ApplicantDashboard() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Software Tester",
    resume: null
  });

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.resume) {
      alert("Please fill all required fields");
      return;
    }

    const applications =
      JSON.parse(localStorage.getItem("applications")) || [];

    applications.push({
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      resumeName: form.resume.name,
      status: "ATS Screening"
    });

    localStorage.setItem("applications", JSON.stringify(applications));
    alert("Application submitted successfully");
  };

  return (
    <>
      <Navbar role="applicant" />
      <div className="applicant-page">
        <div className="apply-card">
          <h3>Apply for Job</h3>

          <input
            placeholder="Full Name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <input
            placeholder="Email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <input
            placeholder="Phone Number"
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <select
            onChange={(e) => setForm({ ...form, role: e.target.value })}
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

          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setForm({ ...form, resume: e.target.files[0] })}
          />

          <button onClick={handleSubmit}>Submit Application</button>
        </div>
      </div>
    </>
  );
}

export default ApplicantDashboard;
