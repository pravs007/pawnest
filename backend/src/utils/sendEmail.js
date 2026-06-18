import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ─────────────────────────────────────────────────────────────────────────────
// TRANSPORTER FACTORY
// Creates a Gmail SMTP transporter using credentials from .env
// ─────────────────────────────────────────────────────────────────────────────
const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.warn('⚠️  [Email] EMAIL_USER or EMAIL_APP_PASSWORD not set in .env — email sending is disabled.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// SHARED HTML LAYOUT WRAPPER
// Wraps any inner HTML body in the PawNest-branded email shell
// ─────────────────────────────────────────────────────────────────────────────
const emailLayout = (title, bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5ede6;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5ede6;padding:40px 0;">
    <tr>
      <td align="center">

        <!-- Email card -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#e8603c 0%,#f59e4f 100%);padding:36px 40px;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:28px;">🐾</p>
              <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">PawNest</h1>
              <p style="margin:6px 0 0 0;font-size:13px;color:rgba(255,255,255,0.85);font-weight:500;">AI-Powered Pet Care & Rescue Platform</p>
            </td>
          </tr>

          <!-- Body content -->
          <tr>
            <td style="padding:40px 44px 32px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 44px;">
              <hr style="border:none;border-top:1px solid #f0e6dc;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 44px 36px;text-align:center;">
              <p style="margin:0 0 8px 0;font-size:13px;color:#b08a72;font-weight:600;">The PawNest Team 🐾</p>
              <p style="margin:0;font-size:11px;color:#c4a799;">
                This is an automated message. Please do not reply to this email.<br/>
                © ${new Date().getFullYear()} PawNest. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
`;

// ─────────────────────────────────────────────────────────────────────────────
// CORE SEND FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`📧 [Email] Skipped (not configured): "${subject}" → ${to}`);
    return { success: false, reason: 'Email not configured' };
  }

  const mailOptions = {
    from: `"PawNest 🐾" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Email] Sent successfully: "${subject}" → ${to} (MessageID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ [Email] Failed to send "${subject}" → ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. WELCOME EMAIL  —  sent on successful user registration
// ─────────────────────────────────────────────────────────────────────────────
export const sendWelcomeEmail = async ({ name, email }) => {
  console.log(`📧 [Email] Preparing welcome email for ${name} <${email}>`);

  const body = `
    <!-- Greeting -->
    <h2 style="margin:0 0 6px 0;font-size:24px;font-weight:800;color:#2d1f14;">
      Welcome to PawNest, ${name}! 🎉
    </h2>
    <p style="margin:0 0 24px 0;font-size:15px;color:#7a5c47;line-height:1.6;">
      Your account has been created successfully. We're thrilled to have you and your furry family join the PawNest community!
    </p>

    <!-- Feature list header -->
    <p style="margin:0 0 16px 0;font-size:14px;font-weight:700;color:#2d1f14;text-transform:uppercase;letter-spacing:0.5px;">
      Here's what you can do with PawNest:
    </p>

    <!-- Feature cards -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${[
        { icon: '🐾', label: 'Pet Registration',          desc: 'Register and manage all your pets in one place.' },
        { icon: '💉', label: 'Vaccination Tracking',      desc: 'Never miss a vaccine with smart due-date alerts.' },
        { icon: '🔍', label: 'Lost & Found Reporting',    desc: 'Post or browse lost and found pet reports nearby.' },
        { icon: '🚨', label: 'Emergency Rescue Requests', desc: 'Report stray or injured animals for immediate help.' },
        { icon: '🤖', label: 'AI Pet Assistant',          desc: 'Get instant, personalised care advice from our AI.' },
      ].map(f => `
      <tr>
        <td style="padding:0 0 10px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f1;border:1px solid #f0e0d0;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:14px 18px;width:44px;font-size:22px;vertical-align:middle;">${f.icon}</td>
              <td style="padding:14px 18px 14px 0;vertical-align:middle;">
                <p style="margin:0 0 2px 0;font-size:14px;font-weight:700;color:#2d1f14;">${f.label}</p>
                <p style="margin:0;font-size:12px;color:#9c7b65;line-height:1.5;">${f.desc}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`).join('')}
    </table>

    <!-- CTA button -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td align="center">
          <a href="${process.env.APP_URL || 'http://localhost:3000'}"
             style="display:inline-block;background:linear-gradient(135deg,#e8603c,#f59e4f);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;letter-spacing:0.3px;">
            Go to My Dashboard →
          </a>
        </td>
      </tr>
    </table>

    <!-- Closing note -->
    <p style="margin:0;font-size:13px;color:#9c7b65;line-height:1.7;border-top:1px solid #f0e6dc;padding-top:20px;">
      If you didn't create this account, please ignore this email — no action is required.<br/>
      For any help, reach us at <a href="mailto:${process.env.EMAIL_USER}" style="color:#e8603c;text-decoration:none;">${process.env.EMAIL_USER || 'support@pawnest.app'}</a>.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to PawNest 🐾 — Your pet care journey begins!',
    html: emailLayout('Welcome to PawNest 🐾', body),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. NEW PET REGISTERED
// ─────────────────────────────────────────────────────────────────────────────
export const sendPetRegisteredEmail = async ({ ownerName, ownerEmail, petName, breed, age, weight }) => {
  console.log(`📧 [Email] Preparing pet-registered email for ${ownerName} — pet: ${petName}`);

  const body = `
    <h2 style="margin:0 0 6px 0;font-size:24px;font-weight:800;color:#2d1f14;">
      ${petName} is now on PawNest! 🐶
    </h2>
    <p style="margin:0 0 24px 0;font-size:15px;color:#7a5c47;line-height:1.6;">
      Hi ${ownerName}, you've successfully registered <strong>${petName}</strong> to your PawNest profile.
    </p>

    <!-- Pet details table -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f1;border:1px solid #f0e0d0;border-radius:14px;overflow:hidden;margin-bottom:28px;">
      <tr><td colspan="2" style="padding:16px 20px 10px;font-size:13px;font-weight:700;color:#9c7b65;text-transform:uppercase;letter-spacing:0.5px;">Pet Details</td></tr>
      ${[['🐾 Name', petName], ['🦴 Breed', breed], ['🎂 Age', age], ['⚖️  Weight', weight]].map(([k, v]) => `
      <tr>
        <td style="padding:8px 20px;font-size:13px;color:#7a5c47;font-weight:600;width:40%;">${k}</td>
        <td style="padding:8px 20px 8px 0;font-size:13px;color:#2d1f14;font-weight:700;">${v}</td>
      </tr>`).join('')}
      <tr><td colspan="2" style="padding:0 0 8px;"></td></tr>
    </table>

    <p style="margin:0;font-size:13px;color:#9c7b65;line-height:1.7;">
      You can now add vaccination records, medical notes, and more from your dashboard.
    </p>
  `;

  return sendEmail({
    to: ownerEmail,
    subject: `${petName} has been registered on PawNest 🐾`,
    html: emailLayout(`${petName} Registered — PawNest`, body),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. VACCINATION REMINDER
// ─────────────────────────────────────────────────────────────────────────────
export const sendVaccinationReminderEmail = async ({ ownerName, ownerEmail, petName, vaccineName, dateDue }) => {
  console.log(`📧 [Email] Preparing vaccination reminder for ${ownerName} — pet: ${petName}, vaccine: ${vaccineName}`);

  const body = `
    <h2 style="margin:0 0 6px 0;font-size:24px;font-weight:800;color:#2d1f14;">
      Vaccination Reminder 💉
    </h2>
    <p style="margin:0 0 24px 0;font-size:15px;color:#7a5c47;line-height:1.6;">
      Hi ${ownerName}, this is a friendly reminder that <strong>${petName}</strong>'s vaccination is due soon.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8f0;border:2px solid #f59e4f;border-radius:14px;overflow:hidden;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 4px 0;font-size:22px;">⏰</p>
          <p style="margin:0 0 8px 0;font-size:16px;font-weight:800;color:#e8603c;">${vaccineName}</p>
          <p style="margin:0;font-size:13px;color:#7a5c47;">Due Date: <strong style="color:#2d1f14;">${dateDue}</strong></p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#9c7b65;line-height:1.7;">
      Log into PawNest to mark this vaccination as completed or reschedule it from your Vaccine Tracker.
    </p>
  `;

  return sendEmail({
    to: ownerEmail,
    subject: `⏰ Vaccination due for ${petName}: ${vaccineName} — PawNest`,
    html: emailLayout('Vaccination Reminder — PawNest', body),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. LOST PET REPORT SUBMITTED
// ─────────────────────────────────────────────────────────────────────────────
export const sendLostPetReportEmail = async ({ reporterName, reporterEmail, petName, species, location, dateLostFound, type }) => {
  console.log(`📧 [Email] Preparing lost/found report email for ${reporterName}`);

  const typeLabel = type === 'lost' ? 'Lost Pet' : 'Found Pet';
  const emoji = type === 'lost' ? '🔍' : '💚';

  const body = `
    <h2 style="margin:0 0 6px 0;font-size:24px;font-weight:800;color:#2d1f14;">
      ${typeLabel} Report Submitted ${emoji}
    </h2>
    <p style="margin:0 0 24px 0;font-size:15px;color:#7a5c47;line-height:1.6;">
      Hi ${reporterName}, your ${typeLabel.toLowerCase()} report has been submitted successfully and is now visible to the PawNest community.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f1;border:1px solid #f0e0d0;border-radius:14px;overflow:hidden;margin-bottom:28px;">
      <tr><td colspan="2" style="padding:16px 20px 10px;font-size:13px;font-weight:700;color:#9c7b65;text-transform:uppercase;letter-spacing:0.5px;">Report Summary</td></tr>
      ${[['Pet Name', petName || 'Unknown'], ['Species', species], ['Location', location], ['Date', dateLostFound]].map(([k, v]) => `
      <tr>
        <td style="padding:8px 20px;font-size:13px;color:#7a5c47;font-weight:600;width:40%;">${k}</td>
        <td style="padding:8px 20px 8px 0;font-size:13px;color:#2d1f14;font-weight:700;">${v}</td>
      </tr>`).join('')}
      <tr><td colspan="2" style="padding:0 0 8px;"></td></tr>
    </table>

    <p style="margin:0;font-size:13px;color:#9c7b65;line-height:1.7;">
      We'll keep your report active until you mark it as resolved. You can manage your reports from the Lost & Found section.
    </p>
  `;

  return sendEmail({
    to: reporterEmail,
    subject: `Your ${typeLabel} report has been submitted — PawNest`,
    html: emailLayout(`${typeLabel} Report — PawNest`, body),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. RESCUE REQUEST SUBMITTED
// ─────────────────────────────────────────────────────────────────────────────
export const sendRescueRequestEmail = async ({ reporterName, reporterEmail, species, location, severity }) => {
  console.log(`📧 [Email] Preparing rescue request email for ${reporterName}`);

  const severityColors = {
    low: '#4ade80',
    medium: '#f59e0b',
    high: '#f97316',
    critical: '#ef4444',
  };
  const severityColor = severityColors[severity] || '#f59e0b';

  const body = `
    <h2 style="margin:0 0 6px 0;font-size:24px;font-weight:800;color:#2d1f14;">
      Rescue Request Submitted 🚨
    </h2>
    <p style="margin:0 0 24px 0;font-size:15px;color:#7a5c47;line-height:1.6;">
      Hi ${reporterName}, thank you for reporting this animal in need. Our rescue team has been notified and will respond as soon as possible.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f1;border:1px solid #f0e0d0;border-radius:14px;overflow:hidden;margin-bottom:28px;">
      <tr><td colspan="2" style="padding:16px 20px 10px;font-size:13px;font-weight:700;color:#9c7b65;text-transform:uppercase;letter-spacing:0.5px;">Rescue Details</td></tr>
      <tr>
        <td style="padding:8px 20px;font-size:13px;color:#7a5c47;font-weight:600;width:40%;">Species</td>
        <td style="padding:8px 20px 8px 0;font-size:13px;color:#2d1f14;font-weight:700;">${species}</td>
      </tr>
      <tr>
        <td style="padding:8px 20px;font-size:13px;color:#7a5c47;font-weight:600;">Location</td>
        <td style="padding:8px 20px 8px 0;font-size:13px;color:#2d1f14;font-weight:700;">${location}</td>
      </tr>
      <tr>
        <td style="padding:8px 20px 16px;font-size:13px;color:#7a5c47;font-weight:600;">Severity</td>
        <td style="padding:8px 20px 16px 0;">
          <span style="display:inline-block;background:${severityColor}22;color:${severityColor};font-size:12px;font-weight:700;padding:3px 12px;border-radius:50px;text-transform:capitalize;">
            ${severity}
          </span>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#9c7b65;line-height:1.7;">
      You can track the status of this rescue request from the Rescue Module in your PawNest dashboard.
    </p>
  `;

  return sendEmail({
    to: reporterEmail,
    subject: '🚨 Rescue request submitted — PawNest is on it!',
    html: emailLayout('Rescue Request — PawNest', body),
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. PASSWORD RESET
// ─────────────────────────────────────────────────────────────────────────────
export const sendPasswordResetEmail = async ({ name, email, resetLink, expiryMinutes = 30 }) => {
  console.log(`📧 [Email] Preparing password reset email for ${name} <${email}>`);

  const body = `
    <h2 style="margin:0 0 6px 0;font-size:24px;font-weight:800;color:#2d1f14;">
      Reset Your Password 🔑
    </h2>
    <p style="margin:0 0 24px 0;font-size:15px;color:#7a5c47;line-height:1.6;">
      Hi ${name}, we received a request to reset the password for your PawNest account. Click the button below to create a new password.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td align="center">
          <a href="${resetLink}"
             style="display:inline-block;background:linear-gradient(135deg,#e8603c,#f59e4f);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;">
            Reset My Password →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 16px 0;font-size:13px;color:#9c7b65;line-height:1.7;">
      This link expires in <strong>${expiryMinutes} minutes</strong>. If you didn't request a password reset, you can safely ignore this email — your password won't change.
    </p>
    <p style="margin:0;font-size:11px;color:#c4a799;line-height:1.6;word-break:break-all;">
      If the button doesn't work, copy and paste this link into your browser:<br/>
      <span style="color:#e8603c;">${resetLink}</span>
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset your PawNest password 🔑',
    html: emailLayout('Password Reset — PawNest', body),
  });
};
