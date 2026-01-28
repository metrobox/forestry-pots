const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

const sendWelcomeEmail = async (email, name, password) => {
  const subject = 'Welcome to Forestry Pots - Your Account Credentials';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d5016;">Welcome to Forestry Pots!</h2>
      <p>Hello ${name},</p>
      <p>Your account has been created successfully. Here are your login credentials:</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Login URL:</strong> ${process.env.CLIENT_URL}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> ${password}</p>
      </div>
      <p>For security reasons, please change your password after your first login.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,<br>Forestry Pots Team</p>
    </div>
  `;
  return await sendEmail(email, subject, html);
};

const sendPasswordResetEmail = async (email, name, resetLink) => {
  const subject = 'Password Reset Request - Forestry Pots';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d5016;">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password. Click the link below to reset it:</p>
      <div style="margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #2d5016; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <p>Best regards,<br>Forestry Pots Team</p>
    </div>
  `;
  return await sendEmail(email, subject, html);
};

const sendRFPNotificationEmail = async (adminEmail, userName, userCompany, productCount) => {
  const subject = 'New RFP Request Received';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2d5016;">New RFP Request</h2>
      <p>A new RFP request has been submitted:</p>
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>User:</strong> ${userName}</p>
        <p><strong>Company:</strong> ${userCompany}</p>
        <p><strong>Products:</strong> ${productCount}</p>
      </div>
      <p>Please log in to the admin dashboard to review the request.</p>
    </div>
  `;
  return await sendEmail(adminEmail, subject, html);
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendRFPNotificationEmail,
};
