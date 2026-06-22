import mongoose from 'mongoose';
import { ACTIVITY_TYPES } from '../constants/index.js';

const clientActivitySchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true
    },
    activityType: {
      type: String,
      enum: Object.values(ACTIVITY_TYPES),
      required: true,
      index: true
    },
    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 2000
    },
    driveLink: {
      type: String,
      trim: true
    }
  },
  { timestamps: true }
);

clientActivitySchema.index({ client: 1, createdAt: -1 });
clientActivitySchema.index({ employee: 1, createdAt: -1 });

const ClientActivity = mongoose.model('ClientActivity', clientActivitySchema);

export default ClientActivity;
