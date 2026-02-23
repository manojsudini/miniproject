import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import ApplicantDashboard from "./pages/ApplicantDashboard";
import HRDashboard from "./pages/HRDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ApplicantStatusDashboard from "./pages/ApplicantStatusDashboard";
import TrackStatus from "./pages/TrackStatus";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/applicant-dashboard" element={<ApplicantStatusDashboard />} />
        {/* DASHBOARDS */}
        <Route path="/applicant" element={<ApplicantDashboard />} />
        <Route path="/hr" element={<HRDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/track" element={<TrackStatus />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
