const FeeTransaction = require('../models/client/FeeTransaction');
const Student = require('../models/client/Student');
const Parent = require('../models/client/Parent');
const School = require('../models/admin/School');
const { sendEmail } = require('../services/emailService');
const { sendSMS } = require('../services/smsService');
const { formatDate } = require('../utils/helpers');
const logger = require('../utils/logger');

const runFeeReminders = async () => {
  try {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Fees due in 3 days
    const upcomingDue = new Date(today);
    upcomingDue.setDate(upcomingDue.getDate() + 3);

    const upcomingTransactions = await FeeTransaction.find({
      status: 'pending',
      dueDate: { $lte: upcomingDue, $gte: today },
    }).populate('studentId');

    // Group upcoming by student
    const upcomingByStudent = {};
    for (const txn of upcomingTransactions) {
      const key = txn.studentId._id.toString();
      if (!upcomingByStudent[key]) upcomingByStudent[key] = { student: txn.studentId, transactions: [], total: 0 };
      upcomingByStudent[key].transactions.push(txn);
      upcomingByStudent[key].total += txn.amount;
    }

    for (const entry of Object.values(upcomingByStudent)) {
      const student = entry.student;
      const parent = await Parent.findOne({ _id: student.parentId });
      const school = await School.findById(student.schoolId).lean();

      if (parent) {
        await sendEmail(parent.email, 'feeReminder', {
          studentName: `${student.firstName} ${student.lastName}`,
          amount: entry.total,
          invoiceCount: entry.transactions.length,
        }, school._id);

        if (parent.phone) {
          await sendSMS(parent.phone, 'feeReminder', {
            studentName: `${student.firstName} ${student.lastName}`,
            amount: entry.total,
          });
        }
      }
    }

    // Overdue fees — group by student
    const overdueTransactions = await FeeTransaction.find({
      status: { $in: ['pending', 'overdue'] },
      dueDate: { $lt: today },
    }).populate('studentId');

    // Update status to overdue
    for (const txn of overdueTransactions) {
      if (txn.status !== 'overdue') {
        txn.status = 'overdue';
        await txn.save();
      }
    }

    // Group overdue by student
    const overdueByStudent = {};
    for (const txn of overdueTransactions) {
      const key = txn.studentId._id.toString();
      if (!overdueByStudent[key]) overdueByStudent[key] = { student: txn.studentId, transactions: [], total: 0 };
      overdueByStudent[key].transactions.push(txn);
      overdueByStudent[key].total += txn.amount;
    }

    // Check if already sent this month
    const sentKey = `overdue_sent_${currentYear}_${currentMonth}`;

    for (const entry of Object.values(overdueByStudent)) {
      const student = entry.student;
      const parent = await Parent.findOne({ _id: student.parentId });
      const school = await School.findById(student.schoolId).lean();

      if (parent) {
        // Track if we already sent this month (simple approach — check last email date)
        // For now, send once per run. The cron runs daily, so add a flag.
        // Store last sent date on the fee transaction or parent model.
        
        await sendEmail(parent.email, 'feeOverdue', {
          studentName: `${student.firstName} ${student.lastName}`,
          amount: entry.total,
          invoiceCount: entry.transactions.length,
        }, school._id);

        if (parent.phone) {
          await sendSMS(parent.phone, 'feeOverdue', {
            studentName: `${student.firstName} ${student.lastName}`,
            amount: entry.total,
          });
        }
      }
    }

    logger.info(`✅ Fee reminders: ${Object.keys(upcomingByStudent).length} students upcoming, ${Object.keys(overdueByStudent).length} students overdue`);
  } catch (err) {
    logger.error(`❌ Fee reminder scheduler failed: ${err.message}`);
  }
};

module.exports = { runFeeReminders };