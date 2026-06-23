import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import Leave from '../models/Leave.js';
import mongoose from 'mongoose';
import { REQUEST_STATUS } from '../constants/index.js';
import AppError from '../utils/AppError.js';
import { endOfDay, getMonthRange, startOfDay } from '../utils/date.js';
import { isInsideRadius } from '../utils/location.js';
import { paginated } from '../utils/query.js';
import { OFFICE_LOCATION } from '../config/attendanceConfig.js';

const validateLocation = async ({ latitude, longitude }) => {
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    throw new AppError('GPS location unavailable', 400);
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
    throw new AppError('GPS location unavailable', 400);
  }

  const result = isInsideRadius(
    { latitude: lat, longitude: lng },
    { latitude: OFFICE_LOCATION.latitude, longitude: OFFICE_LOCATION.longitude },
    OFFICE_LOCATION.radiusMeters
  );

  if (!result.isInside) {
    throw new AppError('User is outside office radius', 400, {
      distanceFromOfficeMeters: result.distanceFromOfficeMeters,
      allowedRadiusMeters: OFFICE_LOCATION.radiusMeters
    });
  }

  return result.distanceFromOfficeMeters;
};

export const configureOffice = async (payload, actorId) => {
  return {
    officeLatitude: OFFICE_LOCATION.latitude,
    officeLongitude: OFFICE_LOCATION.longitude,
    allowedRadiusMeters: OFFICE_LOCATION.radiusMeters
  };
};

export const getOfficeSetting = async () => {
  return {
    officeLatitude: OFFICE_LOCATION.latitude,
    officeLongitude: OFFICE_LOCATION.longitude,
    allowedRadiusMeters: OFFICE_LOCATION.radiusMeters
  };
};

export const punchIn = async (employeeId, payload) => {
  const date = startOfDay();
  const existing = await Attendance.findOne({ employee: employeeId, date });

  if (existing?.punchIn?.time) {
    throw new AppError('Already punched in today', 400);
  }

  const distanceFromOfficeMeters = await validateLocation(payload);
  const attendance =
    existing ||
    new Attendance({
      employee: employeeId,
      date
    });

  attendance.punchIn = {
    time: new Date(),
    location: {
      latitude: payload.latitude,
      longitude: payload.longitude,
      distanceFromOfficeMeters
    }
  };
  attendance.notes = payload.notes;

  await attendance.save();

  return attendance;
};

export const punchOut = async (employeeId, payload) => {
  const date = startOfDay();
  const attendance = await Attendance.findOne({ employee: employeeId, date });

  if (!attendance?.punchIn?.time) {
    throw new AppError('Punch in is required before punch out', 400);
  }

  if (attendance.punchOut?.time) {
    throw new AppError('Already punched out today', 400);
  }

  const distanceFromOfficeMeters = await validateLocation(payload);
  const punchOutTime = new Date();

  attendance.punchOut = {
    time: punchOutTime,
    location: {
      latitude: payload.latitude,
      longitude: payload.longitude,
      distanceFromOfficeMeters
    }
  };
  attendance.workingHours = Number(
    ((punchOutTime.getTime() - attendance.punchIn.time.getTime()) / (1000 * 60 * 60)).toFixed(2)
  );
  attendance.notes = payload.notes || attendance.notes;

  await attendance.save();

  return attendance;
};

export const history = async (requestUser, query) => {
  const filter = {};

  if (requestUser.role === 'EMPLOYEE') filter.employee = requestUser._id;
  if (requestUser.role === 'ADMIN' && query.employeeId) filter.employee = query.employeeId;
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = startOfDay(query.from);
    if (query.to) filter.date.$lte = endOfDay(query.to);
  }

  return paginated(Attendance, filter, query, {
    defaultSort: '-date',
    populate: [{ path: 'employee', select: 'name email department' }]
  });
};

export const monthlySummary = async (requestUser, query) => {
  const employeeId =
    requestUser.role === 'ADMIN' && query.employeeId
      ? new mongoose.Types.ObjectId(query.employeeId)
      : requestUser._id;
  const { start, end } = getMonthRange(query.year, query.month);

  const [summary] = await Attendance.aggregate([
    { $match: { employee: employeeId, date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: '$employee',
        presentDays: { $sum: { $cond: [{ $ifNull: ['$punchIn.time', false] }, 1, 0] } },
        totalWorkingHours: { $sum: '$workingHours' },
        completeDays: { $sum: { $cond: [{ $ifNull: ['$punchOut.time', false] }, 1, 0] } }
      }
    }
  ]);

  return {
    employee: await Employee.findById(employeeId).select('name email department'),
    presentDays: summary?.presentDays || 0,
    completeDays: summary?.completeDays || 0,
    totalWorkingHours: Number((summary?.totalWorkingHours || 0).toFixed(2)),
    range: { start, end }
  };
};

export const todayStatus = async (employeeId) => {
  const today = startOfDay();
  const attendance = await Attendance.findOne({ employee: employeeId, date: today });
  const leave = await Leave.findOne({
    employee: employeeId,
    status: REQUEST_STATUS.APPROVED,
    startDate: { $lte: endOfDay(today) },
    endDate: { $gte: today }
  });

  return {
    attendance,
    onLeave: Boolean(leave)
  };
};
