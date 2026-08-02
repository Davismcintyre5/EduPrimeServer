const Student = require('../../models/client/Student');
const Parent = require('../../models/client/Parent');
const FeeStructure = require('../../models/client/FeeStructure');
const FeeTransaction = require('../../models/client/FeeTransaction');
const Payment = require('../../models/client/Payment');
const AuditLog = require('../../models/client/Log');
const { success, error, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');
const { generateStudentId, generateRollNumber, generateAdmissionNumber, generateInvoiceNumber } = require('../../utils/helpers');
const logger = require('../../utils/logger');

// GET /api/school/students/next-adm
const getNextAdmissionNumber = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  const SchoolSetting = require('../../models/client/Setting');
  const settings = await SchoolSetting.find({ schoolId: req.schoolId });
  const config = {};
  settings.forEach((s) => { config[s.key] = s.value; });

  const prefix = config.admissionPrefix || '';
  const start = parseInt(config.admissionStartNumber) || 1;
  const padding = parseInt(config.admissionPadding) || 4;
  const year = new Date().getFullYear();

  const students = await Student.find({ schoolId: req.schoolId }).select('admissionNumber');

  let maxNumber = start - 1;
  students.forEach((s) => {
    if (s.admissionNumber) {
      const match = s.admissionNumber.match(/(\d+)$/);
      if (match) { const num = parseInt(match[1]); if (num > maxNumber) maxNumber = num; }
    }
  });

  const nextNumber = maxNumber + 1;
  const padded = String(nextNumber).padStart(padding, '0');
  const nextAdm = prefix ? `${prefix}-${year}-${padded}` : padded;

  logger.info(`🔢 Next ADM: ${nextAdm}`);
  return success(res, { nextAdmissionNumber: nextAdm });
});

// GET /api/school/students
const getStudents = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { search, grade, section, status } = req.query;
  const filter = { schoolId: req.schoolId };

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
      { admissionNumber: { $regex: search, $options: 'i' } },
    ];
  }
  if (grade) filter.grade = grade;
  if (section) filter.section = section;
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  const students = await Student.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('parentId', 'name email phone');
  const total = await Student.countDocuments(filter);
  return paginated(res, students, total, page, limit, 'Students fetched');
});

// GET /api/school/students/:id
const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, schoolId: req.schoolId }).populate('parentId', 'name email phone');
  if (!student) return error(res, 'Student not found', 404);
  return success(res, student);
});

const createStudent = asyncHandler(async (req, res) => {
  if (!['school_admin', 'principal', 'deputy_principal'].includes(req.user.role)) {
    return error(res, 'Access denied. Only admin, principal or deputy can add students.', 403);
  }

  const { 
    firstName, lastName, gender, dob, grade, section, type, 
    admissionNumber, dateJoined, term, initialPayment, generateInvoices, 
    previousBalance, paymentMethod, accountId,
    parentName, parentEmail, parentPhone 
  } = req.body;

  if (!firstName || !lastName || !grade || !section) {
    return error(res, 'First name, last name, grade and section are required', 400);
  }

  // Parent
  let parentId = null;
  if (parentEmail) {
    let parent = await Parent.findOne({ email: parentEmail, schoolId: req.schoolId });
    if (!parent && parentName) {
      const { hashPassword } = require('../../utils/hashPassword');
      parent = await Parent.create({ 
        schoolId: req.schoolId, name: parentName, email: parentEmail, 
        phone: parentPhone || '', password: await hashPassword('Parent@123') 
      });
    }
    if (parent) parentId = parent._id;
  }

  // Admission Number
  const admNumber = (type === 'existing' && admissionNumber) 
    ? admissionNumber 
    : await generateAdmissionNumber(req.schoolId);

  // Date Joined
  const joined = (type === 'existing' && dateJoined) ? new Date(dateJoined) : new Date();

  // Roll Number
  const count = await Student.countDocuments({ schoolId: req.schoolId, grade, section });

  const student = await Student.create({
    schoolId: req.schoolId,
    studentId: generateStudentId(req.schoolId.toString().slice(-4).toUpperCase()),
    rollNumber: generateRollNumber(grade, section, count),
    admissionNumber: admNumber,
    dateJoined: joined,
    firstName, lastName, 
    gender: gender || '', 
    dob: dob || null, 
    grade, section,
    parentId: parentId || null,
  });

  if (parentId) {
    await Parent.findByIdAndUpdate(parentId, { $addToSet: { children: student._id } });
  }

  const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  // Generate invoices for new admission
  if (type === 'new' && generateInvoices !== false) {
    const t = term || 'term1';
    const feeStructures = await FeeStructure.find({ 
      schoolId: req.schoolId, term: t, academicYear, isActive: true 
    });
    const applicableFees = feeStructures.filter(
      f => !f.gradeId || String(f.gradeId) === String(grade)
    );

    for (const fee of applicableFees) {
      await FeeTransaction.create({
        schoolId: req.schoolId, studentId: student._id, feeStructureId: fee._id,
        invoiceNumber: generateInvoiceNumber('INV'), amount: fee.amount,
        dueDate: fee.dueDate || new Date(), term: t, academicYear,
        status: 'pending', recordedBy: req.user.id,
      });
    }

    // Record initial payment
    if (initialPayment && parseFloat(initialPayment) > 0) {
      const amt = parseFloat(initialPayment);
      const invoice = await FeeTransaction.findOne({ 
        studentId: student._id, term: t 
      }).sort({ createdAt: 1 });

      await Payment.create({
        schoolId: req.schoolId,
        studentId: student._id,
        invoiceId: invoice?._id,
        receiptNumber: generateInvoiceNumber('RCT'),
        amount: amt,
        paymentMethod: paymentMethod || 'cash',
        accountId: accountId || null,
        recordedBy: req.user.id,
      });

      if (invoice) {
        invoice.paidAmount += amt;
        invoice.status = invoice.paidAmount >= invoice.amount ? 'paid' : 'partial';
        invoice.paidDate = new Date();
        invoice.paymentMethod = paymentMethod || 'cash';
        await invoice.save();
      }

      // Add to account balance
      if (accountId) {
        const Account = require('../../models/client/Account');
        await Account.findByIdAndUpdate(accountId, { $inc: { balance: amt } });
      }
    }
  }

  // Previous balance for existing student
  if (type === 'existing' && previousBalance && parseFloat(previousBalance) > 0) {
    await FeeTransaction.create({
      schoolId: req.schoolId, studentId: student._id,
      invoiceNumber: generateInvoiceNumber('INV'), amount: parseFloat(previousBalance),
      dueDate: new Date(), term: 'arrears', academicYear,
      status: 'pending', recordedBy: req.user.id,
    });
  }

  await AuditLog.create({ 
    schoolId: req.schoolId, userId: req.user.id, 
    action: 'student_created', 
    details: `${firstName} ${lastName} — ${admNumber}`, 
    ip: req.ip 
  });

  logger.info(`🎓 Student created: ${firstName} ${lastName} | ADM: ${admNumber}`);
  return success(res, student, 'Student created', 201);
});

// PUT /api/school/students/:id
const updateStudent = asyncHandler(async (req, res) => {
if (!['school_admin', 'principal', 'deputy_principal'].includes(req.user.role)) {
  return error(res, 'Access denied', 403);
}

  const allowed = ['firstName', 'lastName', 'gender', 'dob', 'grade', 'section', 'photo', 'documents', 'admissionNumber', 'dateJoined'];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const student = await Student.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, updates, { new: true });
  if (!student) return error(res, 'Student not found', 404);

  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'student_updated', details: `${student.firstName} ${student.lastName}`, ip: req.ip });
  return success(res, student, 'Student updated');
});

// DELETE /api/school/students/:id
const deleteStudent = asyncHandler(async (req, res) => {
  if (!['school_admin'].includes(req.user.role)) {
  return error(res, 'Access denied', 403);
}

  const student = await Student.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
  if (!student) return error(res, 'Student not found', 404);

  if (student.parentId) await Parent.findByIdAndUpdate(student.parentId, { $pull: { children: student._id } });

  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'student_deleted', details: `${student.firstName} ${student.lastName}`, ip: req.ip });
  return success(res, null, 'Student deleted');
});

// PATCH /api/school/students/:id/toggle
const toggleStudent = asyncHandler(async (req, res) => {
  if (!['school_admin'].includes(req.user.role)) {
  return error(res, 'Access denied', 403);
}

  const student = await Student.findOne({ _id: req.params.id, schoolId: req.schoolId });
  if (!student) return error(res, 'Student not found', 404);

  student.isActive = !student.isActive;
  await student.save();

  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'student_toggled', details: `${student.firstName} ${student.lastName} ${student.isActive ? 'activated' : 'deactivated'}`, ip: req.ip });
  return success(res, null, `Student ${student.isActive ? 'activated' : 'deactivated'}`);
});

module.exports = { getNextAdmissionNumber, getStudents, getStudent, createStudent, updateStudent, deleteStudent, toggleStudent };