const mongoose = require('mongoose');
const Student = require('../../models/client/Student');
const User = require('../../models/client/User');
const FeeTransaction = require('../../models/client/FeeTransaction');
const Attendance = require('../../models/client/Attendance');
const Book = require('../../models/client/Book');
const BookTransaction = require('../../models/client/BookTransaction');
const InventoryItem = require('../../models/client/InventoryItem');
const Homework = require('../../models/client/Homework');
const Announcement = require('../../models/client/Announcement');
const { success } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');

// GET /api/school/dashboard/stats
const getStats = asyncHandler(async (req, res) => {
  const schoolId = req.schoolId;
  const role = req.user.role;

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const baseStats = {
    totalStudents: 0, totalStaff: 0,
    feeCollected: 0, monthlyFeeCollected: 0, pendingFees: 0,
    attendanceRate: 0, todayPresent: 0, todayTotal: 0,
  };

  const [totalStudents, totalStaff] = await Promise.all([
    Student.countDocuments({ schoolId, isActive: true }),
    User.countDocuments({ schoolId, isActive: true }),
  ]);
  baseStats.totalStudents = totalStudents;
  baseStats.totalStaff = totalStaff;

  if (['school_admin', 'principal'].includes(role)) {
    const [feeCollected, monthlyFees, pendingFees, todayPresent, todayTotal] = await Promise.all([
      FeeTransaction.aggregate([
        { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), status: { $in: ['paid', 'partial'] } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      FeeTransaction.aggregate([
        { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), status: { $in: ['paid', 'partial'] }, paidDate: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      FeeTransaction.countDocuments({ schoolId, status: { $in: ['pending', 'overdue'] } }),
      Attendance.distinct('studentId', { 
  schoolId, 
  date: { $gte: startOfDay, $lt: endOfDay }, 
  status: 'present' 
}).then(ids => ids.length),
      Student.countDocuments({ schoolId, isActive: true }),
    ]);

    baseStats.feeCollected = feeCollected[0]?.total || 0;
    baseStats.monthlyFeeCollected = monthlyFees[0]?.total || 0;
    baseStats.pendingFees = pendingFees;
    baseStats.todayPresent = todayPresent;
    baseStats.todayTotal = todayTotal;
    baseStats.attendanceRate = todayTotal > 0 ? ((todayPresent / todayTotal) * 100).toFixed(1) : 0;
  }

  if (role === 'accountant') {
    const [feeCollected, monthlyFees, pendingFees] = await Promise.all([
      FeeTransaction.aggregate([
        { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), status: { $in: ['paid', 'partial'] } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      FeeTransaction.aggregate([
        { $match: { schoolId: new mongoose.Types.ObjectId(schoolId), status: { $in: ['paid', 'partial'] }, paidDate: { $gte: new Date(today.getFullYear(), today.getMonth(), 1) } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      FeeTransaction.countDocuments({ schoolId, status: { $in: ['pending', 'overdue'] } }),
    ]);
    baseStats.feeCollected = feeCollected[0]?.total || 0;
    baseStats.monthlyFeeCollected = monthlyFees[0]?.total || 0;
    baseStats.pendingFees = pendingFees;
  }

  if (role === 'teacher') {
    const [todayPresent, todayTotal, pendingHomework] = await Promise.all([
     Attendance.distinct('studentId', { 
  schoolId, 
  date: { $gte: startOfDay, $lt: endOfDay }, 
  status: 'present' 
}).then(ids => ids.length),
      Student.countDocuments({ schoolId, isActive: true }),
      Homework.countDocuments({ schoolId, assignedBy: req.user.id }),
    ]);
    baseStats.todayPresent = todayPresent;
    baseStats.todayTotal = todayTotal;
    baseStats.attendanceRate = todayTotal > 0 ? ((todayPresent / todayTotal) * 100).toFixed(1) : 0;
    baseStats.pendingHomework = pendingHomework;
  }

  if (role === 'librarian') {
    const [totalBooks, booksIssued, overdueBooks] = await Promise.all([
      Book.countDocuments({ schoolId }),
      BookTransaction.countDocuments({ schoolId, status: 'issued' }),
      BookTransaction.countDocuments({ schoolId, status: 'overdue' }),
    ]);
    baseStats.totalBooks = totalBooks;
    baseStats.booksIssued = booksIssued;
    baseStats.overdueBooks = overdueBooks;
  }

  if (role === 'store_manager') {
    const [totalItems, lowStock] = await Promise.all([
      InventoryItem.countDocuments({ schoolId }),
      InventoryItem.countDocuments({ schoolId, $expr: { $lte: ['$quantity', '$reorderLevel'] } }),
    ]);
    baseStats.totalItems = totalItems;
    baseStats.lowStock = lowStock;
  }

  return success(res, baseStats);
});

// GET /api/school/dashboard/recent-activities
const getRecentActivities = asyncHandler(async (req, res) => {
  const AuditLog = require('../../models/client/Log');
  const logs = await AuditLog.find({ schoolId: req.schoolId }).sort({ createdAt: -1 }).limit(10);
  return success(res, logs);
});

// GET /api/school/dashboard/announcements
const getAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find({ schoolId: req.schoolId }).sort({ createdAt: -1 }).limit(5);
  return success(res, announcements);
});

module.exports = { getStats, getRecentActivities, getAnnouncements };