const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  phone: { type: String },
  role: { 
    type: String, 
    enum: ['school_admin', 'principal', 'deputy_principal', 'teacher', 'librarian', 'accountant', 'store_manager'], 
    required: true 
  },
  photo: { type: String },

  // Teacher-specific
  tscNumber: { type: String },
  employmentType: { type: String, enum: ['BOM', 'government', 'PTA', 'contract'], default: 'BOM' },
  gender: { type: String, enum: ['male', 'female', 'other'] },
  dob: { type: Date },
  subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
  qualification: { type: String },
  yearJoined: { type: Number },
  nationalId: { type: String },
  kraPin: { type: String }, 
  address: { type: String },
  emergencyContact: { type: String },
  emergencyPhone: { type: String },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);