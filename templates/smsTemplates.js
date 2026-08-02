module.exports = {

  // ═══════════════ PLATFORM ═══════════════

  schoolCreated: (data) => `EduPrime: Welcome! ${data.schoolName} is ready. Login: ${data.loginUrl}`,
  
  registrationReceived: (data) => `EduPrime: Registration received for ${data.schoolName}. We'll review within 48hrs.`,
  
  registrationApproved: (data) => `EduPrime: ${data.schoolName} approved! Login: ${data.loginUrl}`,
  
  registrationRejected: (data) => `EduPrime: ${data.schoolName} registration not approved. ${data.reason || 'Contact support.'}`,

  schoolSuspended: (data) => `EduPrime: ${data.schoolName} suspended. Reason: ${data.reason || 'Contact support.'}`,
  
  schoolReactivated: (data) => `EduPrime: ${data.schoolName} reactivated! Welcome back. Login: ${data.loginUrl}`,

  // ═══════════════ SCHOOL ═══════════════

  studentAbsent: (data) => `${data.schoolName}: ${data.studentName} is absent today (${data.date}).`,

  lowAttendance: (data) => `${data.schoolName}: ${data.studentName} attendance at ${data.percentage}%. Contact school.`,

  examSchedule: (data) => `${data.schoolName}: ${data.examName} schedule for Grade ${data.grade} is out. View portal.`,

  resultsPublished: (data) => `${data.schoolName}: ${data.studentName} scored ${data.percentage}% in ${data.examName}.`,

  feeInvoice: (data) => `${data.schoolName}: Fee invoice ${data.invoiceNumber} - ${data.currency} ${data.amount}. Due: ${data.dueDate}`,

  feeReceipt: (data) => `${data.schoolName}: Payment received ${data.currency} ${data.amount}. Receipt: ${data.invoiceNumber}`,

  feeReminder: (data) => `${data.schoolName}: Reminder - Fee ${data.currency} ${data.amount} due ${data.dueDate} for ${data.studentName}.`,

  feeOverdue: (data) => `${data.schoolName}: OVERDUE - ${data.currency} ${data.amount} + fine ${data.currency} ${data.lateFine}. Pay now.`,

  bookReturnReminder: (data) => `${data.schoolName}: Return '${data.bookTitle}' by ${data.dueDate} to avoid fine.`,

  bookOverdue: (data) => `${data.schoolName}: '${data.bookTitle}' overdue. Fine: ${data.currency} ${data.fine}.`,

  leaveStatus: (data) => `${data.schoolName}: Leave ${data.startDate}-${data.endDate} ${data.status}.`,

  announcement: (data) => `${data.schoolName}: ${data.title}`,

  ptmScheduled: (data) => `${data.schoolName}: PTM Grade ${data.grade} on ${data.date} at ${data.time}. Book slot.`,

  eventReminder: (data) => `${data.schoolName}: Reminder - ${data.eventName} on ${data.date}.`,
};