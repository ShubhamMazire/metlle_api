const nodemailer = require('nodemailer');

// Create a transporter using SendPlus SMTP configuration
const transporter = nodemailer.createTransport({
  host: 'your-smtp-server',
  port: 587, // Use the appropriate port
  secure: false, // Set to true if using SSL
  auth: {
    user: 'your-smtp-username',
    pass: 'your-smtp-password',
  },
});

// Define the email content
const mailOptions = {
  from: 'your-email@example.com',
  to: 'recipient@example.com',
  subject: 'Subject of the email',
  text: 'Text content of the email',
  html: '<p>HTML content of the email</p>',
};

// Send the email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});