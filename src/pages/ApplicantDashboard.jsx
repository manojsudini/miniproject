import { useState } from "react";
import "./ApplicantDashboard.css";
import Navbar from "../components/Navbar.jsx";

function ApplicantDashboard() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Software Tester",
    resume: null,
  });

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.resume) {
      alert("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("name", form.name);
    formData.append("email", form.email);
    formData.append("phone", form.phone);
    formData.append("role", form.role);
    formData.append("resume", form.resume);

    try {
      const response = await fetch("/api/applications/apply", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to submit application");
        return;
      }

      alert("Application submitted successfully");

      // reset form
      setForm({
        name: "",
        email: "",
        phone: "",
        role: "Software Tester",
        resume: null,
      });
    } catch (error) {
      alert("Server error. Please try again.");
    }
  };

  return (
    <>
      <Navbar role="applicant" />
      <div className="applicant-page">
        <div className="apply-card">
          <h3>Apply for Job</h3>

          <input
            placeholder="Full Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            placeholder="Phone Number"
            value={form.phone}
            onChange={(e) =>
              setForm({ ...form, phone: e.target.value })
            }
          />

          <select
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value })
            }
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
            accept=".pdf"
            onChange={(e) =>
              setForm({ ...form, resume: e.target.files[0] })
            }
          />

          <button onClick={handleSubmit}>
            Submit Application
          </button>
        </div>
      </div>
    </>
  );
}

export default ApplicantDashboard;
