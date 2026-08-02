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

    // Fees due in 3 days
    const upcomingDue = new Date(today);
    upcomingDue.setDate(upcomingDue.getDate() + 3);

    const upcomingTransactions = await FeeTransaction.find({
      status: 'pending',
      dueDate: { $lte: upcomingDue, $gte: today },
    }).populate('studentId');

    for (const txn of upcomingTransactions) {
      const student = txn.studentId;
      const parent = await Parent.findOne({ _id: student.parentId });
      const school = await School.findById(txn.schoolId).lean();

      if (parent) {
        const data = {
          studentName: `${student.firstName} ${student.lastName}`,
          invoiceNumber: txn.invoiceNumber,
          amount: txn.amount,
          currency: school.currency,
          dueDate: formatDate(txn.dueDate),
          schoolName: school.name,
        };

        await sendEmail(parent.email, 'feeReminder', data, school._id);
        await sendSMS(parent.phone, 'feeReminder', data);
      }
    }

    // Overdue fees
    const overdueTransactions = await FeeTransaction.find({
      status: { $in: ['pending', 'overdue'] },
      dueDate: { $lt: today },
    }).populate('studentId');

    for (const txn of overdueTransactions) {
      txn.status = 'overdue';
      await txn.save();

      const student = txn.studentId;
      const parent = await Parent.findOne({ _id: student.parentId });
      const school = await School.findById(txn.schoolId).lean();

      if (parent) {
        const lateFine = 50 * Math.ceil((today - txn.dueDate) / (1000 * 60 * 60 * 24));

        const data = {
          studentName: `${student.firstName} ${student.lastName}`,
          invoiceNumber: txn.invoiceNumber,
          amount: txn.amount,
          lateFine,
          currency: school.currency,
          schoolName: school.name,
        };

        await sendEmail(parent.email, 'feeOverdue', data, school._id);
        await sendSMS(parent.phone, 'feeOverdue', data);
      }
    }

    logger.info(`✅ Fee reminders sent: ${upcomingTransactions.length} upcoming, ${overdueTransactions.length} overdue`);
  } catch (err) {
    logger.error(`❌ Fee reminder scheduler failed: ${err.message}`);
  }
};

module.exports = { runFeeReminders };