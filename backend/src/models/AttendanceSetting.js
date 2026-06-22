import mongoose from 'mongoose';

const attendanceSettingSchema = new mongoose.Schema(
  {
    officeLatitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    officeLongitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    allowedRadiusMeters: {
      type: Number,
      required: true,
      min: 1,
      max: 5000,
      default: 100
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    }
  },
  { timestamps: true }
);

attendanceSettingSchema.index({ isActive: 1, updatedAt: -1 });

const AttendanceSetting = mongoose.model('AttendanceSetting', attendanceSettingSchema);

export default AttendanceSetting;
