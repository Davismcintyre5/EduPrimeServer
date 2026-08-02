const User = require('../../models/client/User');
const SalaryStructure = require('../../models/client/SalaryStructure');
const Payroll = require('../../models/client/Payroll');
const CasualStaff = require('../../models/client/CasualStaff');
const AuditLog = require('../../models/client/Log');
const { success, error, paginated } = require('../../utils/apiResponse');
const asyncHandler = require('../../utils/asyncHandler');
const paginate = require('../../utils/pagination');
const logger = require('../../utils/logger');

const isAdmin = (role) => role === 'school_admin';

// ═══════════ SALARY STRUCTURES ═══════════
const getSalaryStructures = asyncHandler(async (req, res) => {
  const structures = await SalaryStructure.find({ schoolId: req.schoolId, isActive: true })
    .populate('staffId', 'name email phone role tscNumber');
  return success(res, structures);
});

const getSalaryStructure = asyncHandler(async (req, res) => {
  const structure = await SalaryStructure.findOne({ _id: req.params.id, schoolId: req.schoolId })
    .populate('staffId', 'name email phone role tscNumber');
  if (!structure) return error(res, 'Not found', 404);
  return success(res, structure);
});

const createSalaryStructure = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user.role)) return error(res, 'Access denied', 403);
  const exists = await SalaryStructure.findOne({ staffId: req.body.staffId, schoolId: req.schoolId });
  if (exists) return error(res, 'Salary structure already exists', 400);
  const structure = await SalaryStructure.create({ ...req.body, schoolId: req.schoolId });
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'salary_structure_created', details: `Staff: ${req.body.staffId}`, ip: req.ip });
  return success(res, structure, 'Created', 201);
});

const updateSalaryStructure = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user.role)) return error(res, 'Access denied', 403);
  const structure = await SalaryStructure.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, req.body, { new: true });
  if (!structure) return error(res, 'Not found', 404);
  return success(res, structure, 'Updated');
});

const deleteSalaryStructure = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user.role)) return error(res, 'Access denied', 403);
  await SalaryStructure.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
  return success(res, null, 'Deleted');
});

const calculatePayroll = (structure) => {
  const a = structure.allowances || {};
  const d = structure.deductions || {};
  const totalAllowances = (a.housing || 0) + (a.transport || 0) + (a.medical || 0) + (a.responsibility || 0) + (a.other || 0);
  const grossPay = (structure.basicSalary || 0) + totalAllowances;
  const totalDeductions = (d.nhif || 0) + (d.nssf || 0) + (d.paye || 0) + (d.loan || 0) + (d.other || 0);
  return { grossPay, totalAllowances, totalDeductions, netPay: grossPay - totalDeductions };
};

// ═══════════ PAYROLL ═══════════
const getPayrolls = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const filter = { schoolId: req.schoolId };
  if (req.query.month) filter.month = parseInt(req.query.month);
  if (req.query.year) filter.year = parseInt(req.query.year);
  if (req.query.status) filter.status = req.query.status;

  const payrolls = await Payroll.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
    .populate('staffId', 'name email tscNumber')
    .populate('casualStaffId', 'name role wage')
    .populate('generatedBy', 'name');
  return paginated(res, payrolls, await Payroll.countDocuments(filter), page, limit, 'Payrolls fetched');
});

const generatePayroll = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user.role)) return error(res, 'Access denied', 403);
  const { month, year } = req.body;
  if (!month || !year) return error(res, 'Month and year required', 400);

  const filter = { schoolId: req.schoolId, isActive: true };
  const structures = await SalaryStructure.find(filter).populate('staffId', 'name');
  const casuals = await CasualStaff.find({ schoolId: req.schoolId, isActive: true });

  const payrolls = [];

  // Regular staff from salary structures
  for (const structure of structures) {
    const existing = await Payroll.findOne({ schoolId: req.schoolId, staffId: structure.staffId, month, year });
    if (existing) continue;
    const calc = calculatePayroll(structure);
    const payroll = await Payroll.create({
      schoolId: req.schoolId, staffId: structure.staffId, month, year,
      basicSalary: structure.basicSalary, allowances: structure.allowances,
      totalAllowances: calc.totalAllowances, grossPay: calc.grossPay,
      deductions: structure.deductions, totalDeductions: calc.totalDeductions,
      netPay: calc.netPay, status: 'draft', generatedBy: req.user.id,
    });
    payrolls.push(payroll);
  }

  // Casual staff
  for (const casual of casuals) {
    const existing = await Payroll.findOne({ schoolId: req.schoolId, casualStaffId: casual._id, month, year });
    if (existing) continue;
    if (!casual.wage || casual.wage <= 0) continue;
    const payroll = await Payroll.create({
      schoolId: req.schoolId, casualStaffId: casual._id, month, year,
      basicSalary: casual.wage, grossPay: casual.wage, netPay: casual.wage,
      totalAllowances: 0, totalDeductions: 0,
      status: 'draft', generatedBy: req.user.id,
      paymentMethod: casual.paymentMethod || 'cash',
    });
    payrolls.push(payroll);
  }

  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'payroll_generated', details: `${payrolls.length} staff - ${month}/${year}`, ip: req.ip });
  return success(res, { count: payrolls.length }, `Generated ${payrolls.length} payrolls`, 201);
});

const updatePayrollStatus = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user.role)) return error(res, 'Access denied', 403);
  const { status } = req.body;
  const payroll = await Payroll.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, { status }, { new: true });
  if (!payroll) return error(res, 'Not found', 404);
  return success(res, payroll, 'Status updated');
});

const deletePayroll = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user.role)) return error(res, 'Access denied', 403);
  await Payroll.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
  return success(res, null, 'Deleted');
});

const getPayrollStats = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const filter = { schoolId: req.schoolId };
  if (month) filter.month = parseInt(month);
  if (year) filter.year = parseInt(year);

  const payrolls = await Payroll.find(filter);
  return success(res, {
    totalStaff: payrolls.length,
    totalGrossPay: payrolls.reduce((s, p) => s + p.grossPay, 0),
    totalNetPay: payrolls.reduce((s, p) => s + p.netPay, 0),
    totalDeductions: payrolls.reduce((s, p) => s + p.totalDeductions, 0),
  });
});

// ═══════════ CASUAL STAFF ═══════════
const getCasualStaff = asyncHandler(async (req, res) => {
  const staff = await CasualStaff.find({ schoolId: req.schoolId }).sort({ name: 1 });
  return success(res, staff);
});

const createCasualStaff = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user.role)) return error(res, 'Access denied', 403);
  const { name, role } = req.body;
  if (!name || !role) return error(res, 'Name and role required', 400);
  const staff = await CasualStaff.create({ ...req.body, schoolId: req.schoolId });
  await AuditLog.create({ schoolId: req.schoolId, userId: req.user.id, action: 'casual_staff_created', details: name, ip: req.ip });
  return success(res, staff, 'Created', 201);
});

const updateCasualStaff = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user.role)) return error(res, 'Access denied', 403);
  const staff = await CasualStaff.findOneAndUpdate({ _id: req.params.id, schoolId: req.schoolId }, req.body, { new: true });
  if (!staff) return error(res, 'Not found', 404);
  return success(res, staff, 'Updated');
});

const deleteCasualStaff = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user.role)) return error(res, 'Access denied', 403);
  await CasualStaff.findOneAndDelete({ _id: req.params.id, schoolId: req.schoolId });
  return success(res, null, 'Deleted');
});

const toggleCasualStaff = asyncHandler(async (req, res) => {
  const staff = await CasualStaff.findOne({ _id: req.params.id, schoolId: req.schoolId });
  if (!staff) return error(res, 'Not found', 404);
  staff.isActive = !staff.isActive;
  await staff.save();
  return success(res, null, `Staff ${staff.isActive ? 'activated' : 'deactivated'}`);
});

module.exports = {
  getSalaryStructures, getSalaryStructure, createSalaryStructure, updateSalaryStructure, deleteSalaryStructure,
  getPayrolls, generatePayroll, updatePayrollStatus, deletePayroll, getPayrollStats,
  getCasualStaff, createCasualStaff, updateCasualStaff, deleteCasualStaff, toggleCasualStaff,
};