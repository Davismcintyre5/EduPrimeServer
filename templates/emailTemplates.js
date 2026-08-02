const getAdminSupport = (settings) => ({
  email: settings?.support_email || 'support@eduprime.com',
  phone: settings?.support_phone || '+254700000000',
});

const getSchoolSupport = (school) => ({
  email: school?.supportEmail || school?.adminEmail || 'support@school.com',
  phone: school?.supportPhone || school?.adminPhone || '',
});

const header = (schoolName = 'EduPrime', logo = null) => `
  <div style="background:#0d1b2a;padding:24px;text-align:center;border-radius:8px 8px 0 0;">
    ${logo ? `<img src="${logo}" alt="logo" style="max-height:50px;margin-bottom:12px;" />` : ''}
    <h1 style="color:#f0a500;margin:0;font-size:22px;">${schoolName}</h1>
  </div>
`;

const body = (content) => `
  <div style="background:#ffffff;padding:24px;font-family:Arial,sans-serif;color:#333;line-height:1.6;">
    ${content}
  </div>
`;

const footer = (support) => `
  <div style="background:#f5f5f5;padding:16px;text-align:center;border-radius:0 0 8px 8px;">
    <p style="color:#999;font-size:11px;margin:0;">Need help? Contact us:</p>
    <p style="color:#333;font-size:12px;margin:4px 0 0;">📧 ${support.email} | 📞 ${support.phone}</p>
  </div>
`;

const fullTemplate = (schoolName, logo, content, support) => `
  <div style="max-width:600px;margin:20px auto;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    ${header(schoolName, logo)}
    ${body(content)}
    ${footer(support)}
  </div>
`;

module.exports = {

  // ═══════════════ PLATFORM (Super Admin) ═══════════════

  schoolCreated: (data, settings) => ({
    subject: `Welcome to EduPrime — ${data.schoolName}`,
    html: fullTemplate('EduPrime', null, `
      <h2 style="color:#0d1b2a;">Congratulations, ${data.adminName}! 🎉</h2>
      <p>Your school <strong>${data.schoolName}</strong> has been created on EduPrime.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;"><strong>Login URL:</strong> <a href="${data.loginUrl}" style="color:#f0a500;">${data.loginUrl}</a></p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${data.email}</p>
        <p style="margin:4px 0;"><strong>Password:</strong> ${data.password}</p>
      </div>
      <p style="color:#666;font-size:13px;">Please change your password after first login.</p>
    `, getAdminSupport(settings)),
  }),

  registrationReceived: (data, settings) => ({
    subject: `Registration Received — ${data.schoolName}`,
    html: fullTemplate('EduPrime', null, `
      <h2 style="color:#0d1b2a;">Thank you, ${data.adminName}!</h2>
      <p>Your registration for <strong>${data.schoolName}</strong> has been received.</p>
      <p>We will review your application and get back to you within <strong>48 hours</strong>.</p>
      <p style="color:#666;font-size:13px;">You'll receive another email once approved.</p>
    `, getAdminSupport(settings)),
  }),

  registrationApproved: (data, settings) => ({
    subject: `Registration Approved — ${data.schoolName}`,
    html: fullTemplate('EduPrime', null, `
      <h2 style="color:#0d1b2a;">Good news, ${data.adminName}! ✅</h2>
      <p>Your school <strong>${data.schoolName}</strong> has been approved.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;"><strong>Login:</strong> <a href="${data.loginUrl}" style="color:#f0a500;">${data.loginUrl}</a></p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${data.email}</p>
      </div>
    `, getAdminSupport(settings)),
  }),

  registrationRejected: (data, settings) => ({
    subject: `Registration Update — ${data.schoolName}`,
    html: fullTemplate('EduPrime', null, `
      <h2 style="color:#0d1b2a;">Hello, ${data.adminName}</h2>
      <p>Unfortunately, your registration for <strong>${data.schoolName}</strong> was not approved.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;"><strong>Reason:</strong> ${data.reason || 'Contact support for details.'}</p>
      </div>
    `, getAdminSupport(settings)),
  }),

  schoolSuspended: (data, settings) => ({
    subject: `School Suspended — ${data.schoolName}`,
    html: fullTemplate('EduPrime', null, `
      <h2 style="color:#dc2626;">Important Notice, ${data.adminName} ⚠️</h2>
      <p>Your school <strong>${data.schoolName}</strong> has been <strong>suspended</strong>.</p>
      <div style="background:#fef2f2;border:1px solid #fecaca;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;"><strong>Reason:</strong> ${data.reason || 'Contact support for details.'}</p>
      </div>
      <p>Please contact us immediately to resolve this.</p>
    `, getAdminSupport(settings)),
  }),

  schoolReactivated: (data, settings) => ({
    subject: `School Reactivated — ${data.schoolName}`,
    html: fullTemplate('EduPrime', null, `
      <h2 style="color:#16a34a;">Good news, ${data.adminName}! 🎉</h2>
      <p>Your school <strong>${data.schoolName}</strong> has been <strong>reactivated</strong>.</p>
      <p>All services are now restored.</p>
      <p><a href="${data.loginUrl}" style="color:#f0a500;">Login here</a></p>
    `, getAdminSupport(settings)),
  }),

  passwordReset: (data, settings) => ({
    subject: 'Password Reset — EduPrime',
    html: fullTemplate('EduPrime', null, `
      <h2 style="color:#0d1b2a;">Password Reset Request</h2>
      <p>Click the button below to reset your password:</p>
      <a href="${data.resetUrl}" style="display:inline-block;background:#f0a500;color:#0d1b2a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Reset Password</a>
      <p style="color:#666;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    `, getAdminSupport(settings)),
  }),

  // ═══════════════ SCHOOL (Client) ═══════════════

  userAccountCreated: (data, school) => ({
    subject: `Welcome to ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#0d1b2a;">Welcome, ${data.name}! 👋</h2>
      <p>Your account has been created at <strong>${school.name}</strong>.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;"><strong>Role:</strong> ${data.role.replace(/_/g, ' ')}</p>
        <p style="margin:4px 0;"><strong>Login:</strong> <a href="${data.loginUrl}" style="color:#f0a500;">${data.loginUrl}</a></p>
        <p style="margin:4px 0;"><strong>Email:</strong> ${data.email}</p>
        <p style="margin:4px 0;"><strong>Password:</strong> ${data.password}</p>
      </div>
    `, getSchoolSupport(school)),
  }),

  studentAdmission: (data, school) => ({
    subject: `Admission Confirmed — ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#0d1b2a;">Congratulations! 🎓</h2>
      <p><strong>${data.studentName}</strong> has been admitted to <strong>Grade ${data.grade}</strong> at <strong>${school.name}</strong>.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;"><strong>Student ID:</strong> ${data.studentId}</p>
        <p style="margin:4px 0;"><strong>Roll Number:</strong> ${data.rollNumber}</p>
      </div>
    `, getSchoolSupport(school)),
  }),

  studentAbsent: (data, school) => ({
    subject: `Absence Alert — ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#dc2626;">Absence Notification</h2>
      <p><strong>${data.studentName}</strong> was marked <strong>absent</strong> on ${data.date}.</p>
      <p style="color:#666;">If you're aware of the reason, please inform the school.</p>
    `, getSchoolSupport(school)),
  }),

  lowAttendance: (data, school) => ({
    subject: `Low Attendance Warning — ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#f59e0b;">Attendance Alert ⚠️</h2>
      <p><strong>${data.studentName}</strong>'s attendance has dropped to <strong>${data.percentage}%</strong>.</p>
      <p>Please contact the school to discuss this matter.</p>
    `, getSchoolSupport(school)),
  }),

  examSchedule: (data, school) => ({
    subject: `Exam Schedule — ${data.examName} | ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#0d1b2a;">${data.examName}</h2>
      <p>The exam timetable for <strong>Grade ${data.grade}</strong> is now available.</p>
      <p><a href="${data.portalUrl}" style="color:#f0a500;">View on the portal →</a></p>
    `, getSchoolSupport(school)),
  }),



welcomeParent: (data) => ({
  subject: `Welcome to ${data.schoolName} Parent Portal`,
  html: fullTemplate(data.schoolName, data.logo, `
    <h2 style="color:#0d1b2a;">Welcome, ${data.parentName}! 👋</h2>
    <p>You have been registered on the <strong>${data.schoolName}</strong> Parent Portal.</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
      <p style="margin:0;"><strong>Child:</strong> ${data.studentName} (${data.admissionNumber})</p>
      <p style="margin:4px 0;"><strong>Grade:</strong> ${data.grade} ${data.section}</p>
      <p style="margin:4px 0;"><strong>Login:</strong> <a href="${data.portalUrl}" style="color:#f0a500;">${data.portalUrl}</a></p>
    </div>
    <p style="color:#666;font-size:13px;">Use your email and password to login and view your child's progress.</p>
  `, getSchoolSupport(data.school)),
}),

parentPasswordReset: (data) => ({
  subject: 'Password Reset — Parent Portal',
  html: fullTemplate(data.schoolName || 'EduPrime', data.logo, `
    <h2 style="color:#0d1b2a;">Password Reset Request</h2>
    <p>Click the button below to reset your password:</p>
    <a href="${data.resetUrl}" style="display:inline-block;background:#f0a500;color:#0d1b2a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Reset Password</a>
    <p style="color:#666;font-size:13px;">This link expires in 1 hour.</p>
  `, getSchoolSupport(data.school)),
}),

  resultsPublished: (data, school) => ({
    subject: `Results Published — ${data.examName} | ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#0d1b2a;">Exam Results Available 📊</h2>
      <p>Results for <strong>${data.examName}</strong> have been published.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;"><strong>${data.studentName}</strong> scored <strong>${data.percentage}%</strong></p>
      </div>
      <p><a href="${data.portalUrl}" style="color:#f0a500;">View full report card →</a></p>
    `, getSchoolSupport(school)),
  }),

  feeInvoice: (data, school) => ({
    subject: `Fee Invoice — ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#0d1b2a;">Fee Invoice</h2>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;"><strong>Student:</strong> ${data.studentName}</p>
        <p style="margin:4px 0;"><strong>Invoice:</strong> ${data.invoiceNumber}</p>
        <p style="margin:4px 0;"><strong>Amount:</strong> ${school.currency} ${data.amount}</p>
        <p style="margin:4px 0;"><strong>Due Date:</strong> ${data.dueDate}</p>
      </div>
    `, getSchoolSupport(school)),
  }),

  feeReceipt: (data, school) => ({
    subject: `Payment Receipt — ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#16a34a;">Payment Received ✅</h2>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;"><strong>Student:</strong> ${data.studentName}</p>
        <p style="margin:4px 0;"><strong>Invoice:</strong> ${data.invoiceNumber}</p>
        <p style="margin:4px 0;"><strong>Paid:</strong> ${school.currency} ${data.amount}</p>
        <p style="margin:4px 0;"><strong>Date:</strong> ${data.paidDate}</p>
      </div>
    `, getSchoolSupport(school)),
  }),

  feeReminder: (data, school) => ({
    subject: `Fee Reminder — ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#f59e0b;">Payment Reminder ⏰</h2>
      <div style="background:#fffbeb;border:1px solid #fde68a;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;"><strong>Student:</strong> ${data.studentName}</p>
        <p style="margin:4px 0;"><strong>Due:</strong> ${school.currency} ${data.amount}</p>
        <p style="margin:4px 0;"><strong>Due Date:</strong> ${data.dueDate}</p>
      </div>
      <p>Please make payment to avoid late fines.</p>
    `, getSchoolSupport(school)),
  }),

  feeOverdue: (data, school) => ({
    subject: `Fee Overdue — ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#dc2626;">Overdue Payment ⚠️</h2>
      <div style="background:#fef2f2;border:1px solid #fecaca;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;"><strong>Student:</strong> ${data.studentName}</p>
        <p style="margin:4px 0;"><strong>Amount:</strong> ${school.currency} ${data.amount}</p>
        <p style="margin:4px 0;"><strong>Late Fine:</strong> ${school.currency} ${data.lateFine}</p>
      </div>
    `, getSchoolSupport(school)),
  }),

  homeworkAssigned: (data, school) => ({
    subject: `New Homework — ${data.subject} | ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#0d1b2a;">Homework Assigned 📝</h2>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;"><strong>Subject:</strong> ${data.subject}</p>
        <p style="margin:4px 0;"><strong>Title:</strong> ${data.title}</p>
        <p style="margin:4px 0;"><strong>Due Date:</strong> ${data.dueDate}</p>
      </div>
    `, getSchoolSupport(school)),
  }),

  homeworkNotSubmitted: (data, school) => ({
    subject: `Homework Not Submitted — ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#dc2626;">Missing Homework ⚠️</h2>
      <p><strong>${data.studentName}</strong> has not submitted <strong>${data.title}</strong> for ${data.subject}.</p>
      <p><strong>Due Date:</strong> ${data.dueDate}</p>
    `, getSchoolSupport(school)),
  }),

  bookIssued: (data, school) => ({
    subject: `Book Issued — ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#0d1b2a;">Book Issued 📚</h2>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;"><strong>Book:</strong> ${data.bookTitle}</p>
        <p style="margin:4px 0;"><strong>Issued To:</strong> ${data.borrowerName}</p>
        <p style="margin:4px 0;"><strong>Due Date:</strong> ${data.dueDate}</p>
      </div>
    `, getSchoolSupport(school)),
  }),

  bookReturnReminder: (data, school) => ({
    subject: `Book Return Reminder — ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#f59e0b;">Return Reminder ⏰</h2>
      <p><strong>Book:</strong> ${data.bookTitle}</p>
      <p><strong>Due Date:</strong> ${data.dueDate}</p>
      <p>Please return to avoid fines.</p>
    `, getSchoolSupport(school)),
  }),

  bookOverdue: (data, school) => ({
    subject: `Book Overdue — ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#dc2626;">Overdue Book ⚠️</h2>
      <div style="background:#fef2f2;border:1px solid #fecaca;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;"><strong>Book:</strong> ${data.bookTitle}</p>
        <p style="margin:4px 0;"><strong>Days Overdue:</strong> ${data.daysOverdue}</p>
        <p style="margin:4px 0;"><strong>Fine:</strong> ${school.currency} ${data.fine}</p>
      </div>
    `, getSchoolSupport(school)),
  }),

  leaveStatus: (data, school) => ({
    subject: `Leave ${data.status} — ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:${data.status === 'approved' ? '#16a34a' : '#dc2626'};">Leave ${data.status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}</h2>
      <p>Your leave from <strong>${data.startDate}</strong> to <strong>${data.endDate}</strong> has been <strong>${data.status}</strong>.</p>
    `, getSchoolSupport(school)),
  }),

announcement: (data, context) => {
  // context can be school object OR settings object
  const isSchool = context?.name && context?.adminEmail;
  const schoolName = isSchool ? context.name : 'EduPrime';
  const logo = isSchool ? context.logo : null;
  const support = isSchool ? getSchoolSupport(context) : getAdminSupport(context);

  return {
    subject: `${data.title} — ${schoolName}`,
    html: fullTemplate(schoolName, logo, `
      <h2 style="color:#0d1b2a;">${data.title}</h2>
      <p>${data.content}</p>
      ${data.attachment ? `<p><a href="${data.attachment}" style="color:#f0a500;">Download Attachment</a></p>` : ''}
    `, support),
  };
},

  ptmScheduled: (data, school) => ({
    subject: `Parent-Teacher Meeting — ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#0d1b2a;">PTM Scheduled 👨‍👩‍👧</h2>
      <p>A Parent-Teacher Meeting for <strong>Grade ${data.grade}</strong> is scheduled:</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;border-radius:8px;margin:16px 0;">
        <p style="margin:0;"><strong>Date:</strong> ${data.date}</p>
        <p style="margin:4px 0;"><strong>Time:</strong> ${data.time}</p>
      </div>
      <p>Please book your slot on the portal.</p>
    `, getSchoolSupport(school)),
  }),

  eventReminder: (data, school) => ({
    subject: `Reminder: ${data.eventName} — ${school.name}`,
    html: fullTemplate(school.name, school.logo, `
      <h2 style="color:#0d1b2a;">Event Reminder 📅</h2>
      <p><strong>${data.eventName}</strong> is coming up on <strong>${data.date}</strong>.</p>
      <p>${data.description || ''}</p>
    `, getSchoolSupport(school)),
  }),
};