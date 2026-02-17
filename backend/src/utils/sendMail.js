import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

export const sendAcceptanceMail = async (to, name) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Job Application Update",
    html: `
      <h2>Congratulations ${name} 🎉</h2>
      <p>You have been shortlisted by HR.</p>
      <p>We will contact you soon.</p>
    `
  });
};