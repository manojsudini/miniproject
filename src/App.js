import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";


import ApplicantLogin from "./pages/ApplicantLogin";
import ApplicantSignup from "./pages/ApplicantSignup";
import ApplicantDashboard from "./pages/ApplicantDashboard";

import RecruiterDashboard from "./pages/RecruiterDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

      
        <Route path="/applicant/login" element={<ApplicantLogin />} />
        <Route path="/applicant/signup" element={<ApplicantSignup />} />
        <Route path="/applicant/dashboard" element={<ApplicantDashboard />} />

        {/* DIRECT recruiter dashboard */}
        <Route path="/recruiter" element={<RecruiterDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
