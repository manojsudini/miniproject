import "./ApplicationProgress.css";

function ApplicationProgress({ status }) {
  const steps = ["Applied", "ATS Screening", "Accepted"];

  const getStepIndex = () => {
    if (status === "Accepted") return 3;
    if (status === "Rejected") return 2;
    if (status === "ATS Screening") return 2;
    return 1;
  };

  const currentStep = getStepIndex();

  return (
    <div className="progress-wrapper">
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${(currentStep / 3) * 100}%` }}
        ></div>
      </div>

      <div className="progress-steps">
        <span className={currentStep >= 1 ? "active" : ""}>
          Applied
        </span>

        <span className={currentStep >= 2 ? "active" : ""}>
          HR Review
        </span>

        <span
          className={
            status === "Accepted"
              ? "accepted"
              : status === "Rejected"
              ? "rejected"
              : ""
          }
        >
          {status === "Rejected" ? "Rejected" : "Accepted"}
        </span>
      </div>
    </div>
  );
}

export default ApplicationProgress;