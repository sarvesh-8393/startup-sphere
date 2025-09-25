// app/api/send-email/route.ts
import nodemailer from 'nodemailer';

export async function POST() {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
    user: 'pritam63633@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: '"Startup Finder 🚀"pritam63633@gmail.com',
    to: 'djsarvesh2004@gmail.com',
    subject: 'Test Email from Gmail SMTP',
    html: `<p>Hey Sarvesh! This is your inbox test using <strong>Nodemailer + Gmail SMTP</strong>. Looks good, right?</p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return Response.json({ message: 'Email sent!', info });
  } catch (error) {
    return Response.json({ error });
  }
}
