export function analyzeResumes(jobDescription, resumes) {
  if (!jobDescription.trim()) return [];

  const jdWords = jobDescription
    .toLowerCase()
    .split(/\W+/)
    .filter(w => w.length > 2);

  return resumes.map(resume => {
    const resumeWords = resume.text
      .toLowerCase()
      .split(/\W+/)
      .filter(w => w.length > 2);

    let matched = 0;
    jdWords.forEach(word => {
      if (resumeWords.includes(word)) matched++;
    });

    const percentage = Math.round(
      (matched / jdWords.length) * 100
    );

    return {
      ...resume,
      percentage: isNaN(percentage) ? 0 : percentage,
      status: percentage >= 50 ? "Shortlisted" : "Rejected"
    };
  }).sort((a, b) => b.percentage - a.percentage);
}
