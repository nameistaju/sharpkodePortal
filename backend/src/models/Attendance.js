import mongoose from 'mongoose';

const coordinatesSchema = new mongoose.Schema(
  {
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    distanceFromOfficeMeters: { type: Number, min: 0 }
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    punchIn: {
      time: Date,
      location: coordinatesSchema
    },
    punchOut: {
      time: Date,
      location: coordinatesSchema
    },
    workingHours: {
      type: Number,
      default: 0,
      min: 0
    },
    isAutoClosed: {
      type: Boolean,
      default: false
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, 'punchIn.time': 1 });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
