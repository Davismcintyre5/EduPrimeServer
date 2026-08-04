const getAdminSupport = (settings) => ({
  email: settings?.support_email || 'support@eduprime.com',
  phone: settings?.support_phone || '+254700000000',
});

const getSchoolSupport = (school) => ({
  email: school?.email || school?.adminEmail || 'support@school.com',
  phone: school?.phone || school?.adminPhone || '',
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

// Helper: Determine if context is a school or platform settings
const getContext = (ctx) => {
  if (!ctx) return { type: 'platform', name: 'EduPrime', logo: null, support: getAdminSupport({}) };
  
  // Platform settings (has support_email key)
  if (ctx.support_email !== undefined || ctx.app_name !== undefined) {
    return {
      type: 'platform',
      name: ctx.app_name || 'EduPrime',
      logo: ctx.logo_url || null,
      support: getAdminSupport(ctx),
    };
  }
  
  // School object (has name and adminEmail)
  return {
    type: 'school',
    name: ctx.name || 'School',
    logo: ctx.logo || null,
    support: getSchoolSupport(ctx),
  };
};

module.exports = {

  // ═══════════════ PLATFORM (Super Admin) ═══════════════

  schoolCreated: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Welcome to EduPrime — ${data.schoolName}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">Congratulations, ${data.adminName}! 🎉</h2>
        <p>Your school <strong>${data.schoolName}</strong> has been created on EduPrime.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>Login URL:</strong> <a href="${data.loginUrl}" style="color:#f0a500;">${data.loginUrl}</a></p>
          <p style="margin:4px 0;"><strong>Email:</strong> ${data.email}</p>
          <p style="margin:4px 0;"><strong>Password:</strong> ${data.password}</p>
        </div>
        <p style="color:#666;font-size:13px;">Please change your password after first login.</p>
      `, support),
    };
  },

  registrationReceived: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Registration Received — ${data.schoolName}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">Thank you, ${data.adminName}!</h2>
        <p>Your registration for <strong>${data.schoolName}</strong> has been received.</p>
        <p>We will review your application and get back to you within <strong>48 hours</strong>.</p>
        <p style="color:#666;font-size:13px;">You'll receive another email once approved.</p>
      `, support),
    };
  },

  registrationApproved: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Registration Approved — ${data.schoolName}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">Good news, ${data.adminName}! ✅</h2>
        <p>Your school <strong>${data.schoolName}</strong> has been approved.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>Login:</strong> <a href="${data.loginUrl}" style="color:#f0a500;">${data.loginUrl}</a></p>
          <p style="margin:4px 0;"><strong>Email:</strong> ${data.email}</p>
        </div>
      `, support),
    };
  },

  registrationRejected: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Registration Update — ${data.schoolName}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">Hello, ${data.adminName}</h2>
        <p>Unfortunately, your registration for <strong>${data.schoolName}</strong> was not approved.</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>Reason:</strong> ${data.reason || 'Contact support for details.'}</p>
        </div>
      `, support),
    };
  },

  schoolSuspended: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `School Suspended — ${data.schoolName}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#dc2626;">Important Notice, ${data.adminName} ⚠️</h2>
        <p>Your school <strong>${data.schoolName}</strong> has been <strong>suspended</strong>.</p>
        <div style="background:#fef2f2;border:1px solid #fecaca;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>Reason:</strong> ${data.reason || 'Contact support for details.'}</p>
        </div>
        <p>Please contact us immediately to resolve this.</p>
      `, support),
    };
  },

  schoolReactivated: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `School Reactivated — ${data.schoolName}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#16a34a;">Good news, ${data.adminName}! 🎉</h2>
        <p>Your school <strong>${data.schoolName}</strong> has been <strong>reactivated</strong>.</p>
        <p>All services are now restored.</p>
        <p><a href="${data.loginUrl}" style="color:#f0a500;">Login here</a></p>
      `, support),
    };
  },

  // ═══════════════ AUTH (Both platform & school) ═══════════════

  passwordReset: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: 'Password Reset — EduPrime',
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">Password Reset Request</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${data.resetUrl}" style="display:inline-block;background:#f0a500;color:#0d1b2a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Reset Password</a>
        <p style="color:#666;font-size:13px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      `, support),
    };
  },

  parentPasswordReset: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: 'Password Reset — Parent Portal',
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">Password Reset Request</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${data.resetUrl}" style="display:inline-block;background:#f0a500;color:#0d1b2a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0;">Reset Password</a>
        <p style="color:#666;font-size:13px;">This link expires in 1 hour.</p>
      `, support),
    };
  },

  // ═══════════════ SCHOOL (Client) ═══════════════

  userAccountCreated: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Welcome to ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">Welcome, ${data.name}! 👋</h2>
        <p>Your account has been created at <strong>${name}</strong>.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>Role:</strong> ${data.role.replace(/_/g, ' ')}</p>
          <p style="margin:4px 0;"><strong>Login:</strong> <a href="${data.loginUrl}" style="color:#f0a500;">${data.loginUrl}</a></p>
          <p style="margin:4px 0;"><strong>Email:</strong> ${data.email}</p>
          <p style="margin:4px 0;"><strong>Password:</strong> ${data.password}</p>
        </div>
      `, support),
    };
  },

  studentAdmission: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Admission Confirmed — ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">Congratulations! 🎓</h2>
        <p><strong>${data.studentName}</strong> has been admitted to <strong>Grade ${data.grade}</strong> at <strong>${name}</strong>.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>Student ID:</strong> ${data.studentId}</p>
          <p style="margin:4px 0;"><strong>Roll Number:</strong> ${data.rollNumber}</p>
        </div>
      `, support),
    };
  },

  studentAbsent: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Absence Alert — ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#dc2626;">Absence Notification</h2>
        <p><strong>${data.studentName}</strong> was marked <strong>absent</strong> on ${data.date}.</p>
        <p style="color:#666;">If you're aware of the reason, please inform the school.</p>
      `, support),
    };
  },

  lowAttendance: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Low Attendance Warning — ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#f59e0b;">Attendance Alert ⚠️</h2>
        <p><strong>${data.studentName}</strong>'s attendance has dropped to <strong>${data.percentage}%</strong>.</p>
        <p>Please contact the school to discuss this matter.</p>
      `, support),
    };
  },

  examSchedule: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Exam Schedule — ${data.examName} | ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">${data.examName}</h2>
        <p>The exam timetable for <strong>Grade ${data.grade}</strong> is now available.</p>
        <p><a href="${data.portalUrl}" style="color:#f0a500;">View on the portal →</a></p>
      `, support),
    };
  },

  welcomeParent: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Welcome to ${name} Parent Portal`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">Welcome, ${data.parentName}! 👋</h2>
        <p>You have been registered on the <strong>${name}</strong> Parent Portal.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>Child:</strong> ${data.studentName} (${data.admissionNumber})</p>
          <p style="margin:4px 0;"><strong>Grade:</strong> ${data.grade} ${data.section}</p>
          <p style="margin:4px 0;"><strong>Login:</strong> <a href="${data.portalUrl}" style="color:#f0a500;">${data.portalUrl}</a></p>
        </div>
        <p style="color:#666;font-size:13px;">Use your email and password to login and view your child's progress.</p>
      `, support),
    };
  },

  resultsPublished: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Results Published — ${data.examName} | ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">Exam Results Available 📊</h2>
        <p>Results for <strong>${data.examName}</strong> have been published.</p>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>${data.studentName}</strong> scored <strong>${data.percentage}%</strong></p>
        </div>
        <p><a href="${data.portalUrl}" style="color:#f0a500;">View full report card →</a></p>
      `, support),
    };
  },

  feeInvoice: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Fee Invoice — ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">Fee Invoice</h2>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>Student:</strong> ${data.studentName}</p>
          <p style="margin:4px 0;"><strong>Invoice:</strong> ${data.invoiceNumber}</p>
          <p style="margin:4px 0;"><strong>Amount:</strong> ${ctx?.currency || 'KES'} ${data.amount}</p>
          <p style="margin:4px 0;"><strong>Due Date:</strong> ${data.dueDate}</p>
        </div>
      `, support),
    };
  },

  feeReceipt: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Payment Receipt — ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#16a34a;">Payment Received ✅</h2>
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>Student:</strong> ${data.studentName}</p>
          <p style="margin:4px 0;"><strong>Invoice:</strong> ${data.invoiceNumber}</p>
          <p style="margin:4px 0;"><strong>Paid:</strong> ${ctx?.currency || 'KES'} ${data.amount}</p>
          <p style="margin:4px 0;"><strong>Date:</strong> ${data.paidDate}</p>
        </div>
      `, support),
    };
  },

  feeReminder: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Fee Reminder — ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#f59e0b;">Payment Reminder ⏰</h2>
        <div style="background:#fffbeb;border:1px solid #fde68a;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>Student:</strong> ${data.studentName}</p>
          <p style="margin:4px 0;"><strong>Due:</strong> ${ctx?.currency || 'KES'} ${data.amount}</p>
          <p style="margin:4px 0;"><strong>Due Date:</strong> ${data.dueDate}</p>
        </div>
        <p>Please make payment to avoid late fines.</p>
      `, support),
    };
  },

  feeOverdue: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Fee Overdue — ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#dc2626;">Overdue Payment ⚠️</h2>
        <div style="background:#fef2f2;border:1px solid #fecaca;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>Student:</strong> ${data.studentName}</p>
          <p style="margin:4px 0;"><strong>Amount:</strong> ${ctx?.currency || 'KES'} ${data.amount}</p>
          <p style="margin:4px 0;"><strong>Late Fine:</strong> ${ctx?.currency || 'KES'} ${data.lateFine}</p>
        </div>
      `, support),
    };
  },

  homeworkAssigned: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `New Homework — ${data.subject} | ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">Homework Assigned 📝</h2>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>Subject:</strong> ${data.subject}</p>
          <p style="margin:4px 0;"><strong>Title:</strong> ${data.title}</p>
          <p style="margin:4px 0;"><strong>Due Date:</strong> ${data.dueDate}</p>
        </div>
      `, support),
    };
  },

  homeworkNotSubmitted: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Homework Not Submitted — ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#dc2626;">Missing Homework ⚠️</h2>
        <p><strong>${data.studentName}</strong> has not submitted <strong>${data.title}</strong> for ${data.subject}.</p>
        <p><strong>Due Date:</strong> ${data.dueDate}</p>
      `, support),
    };
  },

  bookIssued: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Book Issued — ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">Book Issued 📚</h2>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>Book:</strong> ${data.bookTitle}</p>
          <p style="margin:4px 0;"><strong>Issued To:</strong> ${data.borrowerName}</p>
          <p style="margin:4px 0;"><strong>Due Date:</strong> ${data.dueDate}</p>
        </div>
      `, support),
    };
  },

  bookReturnReminder: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Book Return Reminder — ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#f59e0b;">Return Reminder ⏰</h2>
        <p><strong>Book:</strong> ${data.bookTitle}</p>
        <p><strong>Due Date:</strong> ${data.dueDate}</p>
        <p>Please return to avoid fines.</p>
      `, support),
    };
  },

  bookOverdue: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Book Overdue — ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#dc2626;">Overdue Book ⚠️</h2>
        <div style="background:#fef2f2;border:1px solid #fecaca;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>Book:</strong> ${data.bookTitle}</p>
          <p style="margin:4px 0;"><strong>Days Overdue:</strong> ${data.daysOverdue}</p>
          <p style="margin:4px 0;"><strong>Fine:</strong> ${ctx?.currency || 'KES'} ${data.fine}</p>
        </div>
      `, support),
    };
  },

  leaveStatus: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Leave ${data.status} — ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:${data.status === 'approved' ? '#16a34a' : '#dc2626'};">Leave ${data.status === 'approved' ? 'Approved ✅' : 'Rejected ❌'}</h2>
        <p>Your leave from <strong>${data.startDate}</strong> to <strong>${data.endDate}</strong> has been <strong>${data.status}</strong>.</p>
      `, support),
    };
  },

  announcement: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `${data.title} — ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">${data.title}</h2>
        <p>${data.content}</p>
        ${data.attachment ? `<p><a href="${data.attachment}" style="color:#f0a500;">Download Attachment</a></p>` : ''}
      `, support),
    };
  },

  ptmScheduled: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Parent-Teacher Meeting — ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">PTM Scheduled 👨‍👩‍👧</h2>
        <p>A Parent-Teacher Meeting for <strong>Grade ${data.grade}</strong> is scheduled:</p>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;border-radius:8px;margin:16px 0;">
          <p style="margin:0;"><strong>Date:</strong> ${data.date}</p>
          <p style="margin:4px 0;"><strong>Time:</strong> ${data.time}</p>
        </div>
        <p>Please book your slot on the portal.</p>
      `, support),
    };
  },

  eventReminder: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Reminder: ${data.eventName} — ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">Event Reminder 📅</h2>
        <p><strong>${data.eventName}</strong> is coming up on <strong>${data.date}</strong>.</p>
        <p>${data.description || ''}</p>
      `, support),
    };
  },

  purchaseOrder: (data, ctx) => {
    const { name, logo, support } = getContext(ctx);
    return {
      subject: `Purchase Order #${data.poNumber} — ${name}`,
      html: fullTemplate(name, logo, `
        <h2 style="color:#0d1b2a;">Purchase Order #${data.poNumber}</h2>
        <p style="color:#666;font-size:13px;margin:0 0 16px;">
          <strong>Date:</strong> ${data.date}<br>
          ${data.expectedDate ? `<strong>Expected Delivery:</strong> ${data.expectedDate}<br>` : ''}
          <strong>Requested By:</strong> ${data.requestedBy || 'School Administration'}
        </p>
        
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <thead>
            <tr style="background:#0d1b2a;color:#fff;">
              <th style="padding:10px;text-align:left;font-size:11px;">Item</th>
              <th style="padding:10px;text-align:center;font-size:11px;">Qty</th>
              <th style="padding:10px;text-align:right;font-size:11px;">Unit Price</th>
              <th style="padding:10px;text-align:right;font-size:11px;">Total</th>
            </tr>
          </thead>
          <tbody>${data.itemsTable}</tbody>
          <tfoot>
            <tr style="font-weight:bold;background:#f8f9fa;">
              <td colspan="3" style="padding:10px;text-align:right;">TOTAL</td>
              <td style="padding:10px;text-align:right;color:#0d1b2a;">KES ${data.totalAmount}</td>
            </tr>
          </tfoot>
        </table>

        ${data.notes ? `<div style="background:#f8f9fa;padding:12px;border-radius:6px;margin:12px 0;font-size:13px;"><strong>Notes:</strong> ${data.notes}</div>` : ''}
        
        <p style="font-size:13px;color:#333;">Please confirm receipt and provide an estimated delivery date.</p>
      `, support),
    };
  },
};