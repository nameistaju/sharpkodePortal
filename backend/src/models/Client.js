import mongoose from 'mongoose';
import { CLIENT_STATUS } from '../constants/index.js';

const contactPersonSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 30 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid contact email']
    },
    designation: { type: String, trim: true, maxlength: 120 }
  },
  { _id: false }
);

const clientSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 180,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(CLIENT_STATUS),
      default: CLIENT_STATUS.ACTIVE,
      index: true
    },
    services: {
      type: [String],
      default: [],
      validate: {
        validator: (services) => services.every((service) => service.trim().length > 0),
        message: 'Services cannot contain empty values'
      }
    },
    driveLink: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 3000
    },
    contactPerson: contactPersonSchema,
    assignedEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee'
      }
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    }
  },
  { timestamps: true }
);

clientSchema.index({ clientName: 'text', services: 'text', notes: 'text' });
clientSchema.index({ status: 1, clientName: 1 });
clientSchema.index({ assignedEmployees: 1, status: 1 });

const Client = mongoose.model('Client', clientSchema);

export default Client;
