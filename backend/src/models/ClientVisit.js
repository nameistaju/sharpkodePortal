import mongoose from 'mongoose';
import { VISIT_OUTCOMES } from '../constants/index.js';

const visitLocationSchema = new mongoose.Schema(
  {
    address: { type: String, trim: true, maxlength: 500 },
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 }
  },
  { _id: false }
);

const clientVisitSchema = new mongoose.Schema(
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
    visitDate: {
      type: Date,
      required: true,
      index: true
    },
    meetingNotes: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 3000
    },
    outcome: {
      type: String,
      enum: Object.values(VISIT_OUTCOMES),
      required: true,
      index: true
    },
    followUpDate: Date,
    location: visitLocationSchema
  },
  { timestamps: true }
);

clientVisitSchema.index({ client: 1, visitDate: -1 });
clientVisitSchema.index({ employee: 1, visitDate: -1 });

const ClientVisit = mongoose.model('ClientVisit', clientVisitSchema);

export default ClientVisit;
