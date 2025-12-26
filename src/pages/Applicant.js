import { useNavigate } from "react-router-dom";

function Applicant() {
  const navigate = useNavigate();

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h2>Applicant Portal</h2>

      <button onClick={() => navigate("/applicant/login")}>
        Login
      </button>
    </div>
  );
}

export default Applicant;
