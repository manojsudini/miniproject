import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import ApplicantDashboard from "./pages/ApplicantDashboard";
import HRDashboard from "./pages/HRDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import TrackStatus from "./pages/TrackStatus";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* APPLICANT ROUTES */}
        <Route
          path="/applicant"
          element={
            <ProtectedRoute roleRequired="applicant">
              <ApplicantDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/track"
          element={
            <ProtectedRoute roleRequired="applicant">
              <TrackStatus />
            </ProtectedRoute>
          }
        />

        {/* HR ROUTES */}
        <Route
          path="/hr"
          element={
            <ProtectedRoute roleRequired="hr">
              <HRDashboard />
            </ProtectedRoute>
          }
        />

        {/* ADMIN ROUTES */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roleRequired="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;