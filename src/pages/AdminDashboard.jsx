import { useEffect, useState } from "react";
import Navbar from "../components/Navbar.jsx";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const data =
      JSON.parse(localStorage.getItem("applications")) || [];
    setUsers(data);
  }, []);

  const toggleStatus = (index) => {
    const updated = [...users];
    updated[index].isActive = !updated[index].isActive;
    setUsers(updated);
    localStorage.setItem("applications", JSON.stringify(updated));
  };

  const total = users.length;
  const active = users.filter(u => u.isActive).length;
  const inactive = users.filter(u => !u.isActive).length;

  return (
    <>
      <Navbar role="admin" />

      <div className="admin-page">
        <h2 className="page-title">Admin Dashboard</h2>

        {/* STAT CARDS */}
        <div className="stats-container">
          <div className="stat-card">
            <h4>Total Applicants</h4>
            <p>{total}</p>
          </div>

          <div className="stat-card active-card">
            <h4>Active</h4>
            <p>{active}</p>
          </div>

          <div className="stat-card inactive-card">
            <h4>Inactive</h4>
            <p>{inactive}</p>
          </div>
        </div>

        {/* USER TABLE */}
        <div className="admin-card">
          <h3>Applicant Management</h3>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Resume</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user, index) => (
                  <tr key={index}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.resumeName}</td>
                    <td>
                      <span className={user.isActive ? "active" : "inactive"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <button
                        className={user.isActive ? "deactivate-btn" : "activate-btn"}
                        onClick={() => toggleStatus(index)}
                      >
                        {user.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  );
}

export default AdminDashboard;
