const crypto = require('crypto');

const generateStudentId = (schoolCode) => {
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `STU-${schoolCode}-${rand}`;
};

const generateRollNumber = (grade, section, count) => {
  return `${grade}-${section}-${String(count + 1).padStart(3, '0')}`;
};

const generateInvoiceNumber = (prefix = 'INV') => {
  const timestamp = Date.now().toString().slice(-8);
  const rand = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}${rand}`;
};

const generateStaffId = (schoolCode) => {
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `STF-${schoolCode}-${rand}`;
};

const generateAdmissionNumber = async (schoolId) => {
  const SchoolSetting = require('../models/client/Setting');
  const settings = await SchoolSetting.find({ schoolId });
  const config = {};
  settings.forEach((s) => { config[s.key] = s.value; });
  const prefix = config.admissionPrefix || '';
  const start = parseInt(config.admissionStartNumber) || 1;
  const padding = parseInt(config.admissionPadding) || 4;
  const Student = require('../models/client/Student');
  const students = await Student.find({ schoolId }).select('admissionNumber');
  let maxNumber = start - 1;
  students.forEach((s) => {
    if (s.admissionNumber) {
      const match = s.admissionNumber.match(/(\d+)$/);
      if (match) { const num = parseInt(match[1]); if (num > maxNumber) maxNumber = num; }
    }
  });
  const nextNumber = maxNumber + 1;
  const padded = String(nextNumber).padStart(padding, '0');
  if (prefix && prefix.trim() !== '') { const year = new Date().getFullYear(); return `${prefix}-${year}-${padded}`; }
  return padded;
};

const calculateLateFee = (dueDate, amount, dailyRate = 50) => {
  const today = new Date();
  const due = new Date(dueDate);
  if (today <= due) return 0;
  const daysLate = Math.ceil((today - due) / (1000 * 60 * 60 * 24));
  return daysLate * dailyRate;
};

const calculateAttendancePercentage = (present, total) => {
  if (total === 0) return 100;
  return parseFloat(((present / total) * 100).toFixed(2));
};

const calculateGrade = (marks, total) => {
  const percentage = (marks / total) * 100;
  if (percentage >= 80) return 'A';
  if (percentage >= 65) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'E';
};

const getCBCRemark = (marks, total) => {
  const percentage = (marks / total) * 100;
  if (percentage >= 80) return 'Exceeding Expectations';
  if (percentage >= 65) return 'Meeting Expectations';
  if (percentage >= 50) return 'Approaching Expectations';
  if (percentage >= 40) return 'Below Expectations';
  return 'Needs Improvement';
};

const getCBCGradeAndRemark = (marks, total) => {
  const percentage = (marks / total) * 100;
  if (percentage >= 80) return { grade: 'A', remark: 'Exceeding Expectations' };
  if (percentage >= 65) return { grade: 'B', remark: 'Meeting Expectations' };
  if (percentage >= 50) return { grade: 'C', remark: 'Approaching Expectations' };
  if (percentage >= 40) return { grade: 'D', remark: 'Below Expectations' };
  return { grade: 'E', remark: 'Needs Improvement' };
};

const calculateAge = (dob) => {
  const today = new Date();
  const birth = new Date(dob);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const stripHtml = (html) => html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
const formatCurrency = (amount, currency = 'KES') => `${currency} ${Number(amount).toLocaleString()}`;
const formatDate = (date, format = 'short') => { const d = new Date(date); if (format === 'short') return d.toLocaleDateString('en-KE'); if (format === 'long') return d.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); return d.toISOString().split('T')[0]; };
const maskEmail = (email) => { const [name, domain] = email.split('@'); return `${name[0]}***@${domain}`; };
const maskPhone = (phone) => { if (!phone || phone.length < 6) return phone; return phone.slice(0, 3) + '****' + phone.slice(-3); };
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone) => /^\+?[\d]{10,15}$/.test(phone);
const getAcademicYear = () => { const today = new Date(); const year = today.getFullYear(); return today.getMonth() < 6 ? `${year - 1}-${year}` : `${year}-${year + 1}`; };
const getCurrentTerm = () => { const month = new Date().getMonth() + 1; if (month >= 1 && month <= 4) return 'Term 1'; if (month >= 5 && month <= 8) return 'Term 2'; return 'Term 3'; };

module.exports = {
  generateStudentId, generateRollNumber, generateInvoiceNumber, generateStaffId, generateAdmissionNumber,
  calculateLateFee, calculateAttendancePercentage, calculateGrade, getCBCRemark, getCBCGradeAndRemark,
  calculateAge, stripHtml, formatCurrency, formatDate, maskEmail, maskPhone, isValidEmail, isValidPhone,
  getAcademicYear, getCurrentTerm,
};