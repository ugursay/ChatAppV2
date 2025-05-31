import nodemailer from "nodemailer";

export const sendResetPasswordEmail = async (email, link) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Şifre Sıfırlama",
    html: `<p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
    <a href="${link}">${link}</a>`,
  };

  await transporter.sendMail(mailOptions);
};
