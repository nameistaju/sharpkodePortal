import mongoose from 'mongoose';
import { ATTENDANCE_CORRECTION_TYPES, REQUEST_STATUS } from '../constants/index.js';

const attendanceCorrectionSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    attendance: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance'
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    correctionType: {
      type: String,
      enum: Object.values(ATTENDANCE_CORRECTION_TYPES),
      required: true
    },
    requestedPunchIn: Date,
    requestedPunchOut: Date,
    reason: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 1000
    },
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.PENDING,
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    reviewedAt: Date,
    reviewRemarks: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  { timestamps: true }
);

attendanceCorrectionSchema.index({ employee: 1, date: -1 });
attendanceCorrectionSchema.index({ status: 1, createdAt: -1 });

const AttendanceCorrection = mongoose.model('AttendanceCorrection', attendanceCorrectionSchema);

export default AttendanceCorrection;
