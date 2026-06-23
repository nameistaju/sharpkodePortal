import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    employeeEmail: {
      type: String,
      required: true,
      trim: true
    },
    action: {
      type: String,
      required: true,
      default: 'Password Reset'
    },
    adminEmail: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    }
  },
  { timestamps: true }
);

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
