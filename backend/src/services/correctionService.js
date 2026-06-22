import Attendance from '../models/Attendance.js';
import AttendanceCorrection from '../models/AttendanceCorrection.js';
import { ATTENDANCE_CORRECTION_TYPES, REQUEST_STATUS } from '../constants/index.js';
import AppError from '../utils/AppError.js';
import { startOfDay } from '../utils/date.js';
import { paginated } from '../utils/query.js';

const recalculateHours = (attendance) => {
  if (attendance.punchIn?.time && attendance.punchOut?.time) {
    attendance.workingHours = Number(
      ((attendance.punchOut.time.getTime() - attendance.punchIn.time.getTime()) / (1000 * 60 * 60)).toFixed(2)
    );
  }
};

export const createRequest = (employeeId, payload) =>
  AttendanceCorrection.create({
    ...payload,
    employee: employeeId,
    date: startOfDay(payload.date)
  });

export const history = (requestUser, query) => {
  const filter = {};

  if (requestUser.role === 'EMPLOYEE') filter.employee = requestUser._id;
  if (requestUser.role === 'ADMIN' && query.employeeId) filter.employee = query.employeeId;
  if (query.status) filter.status = query.status;

  return paginated(AttendanceCorrection, filter, query, {
    defaultSort: '-createdAt',
    populate: [
      { path: 'employee', select: 'name email department' },
      { path: 'attendance' },
      { path: 'reviewedBy', select: 'name email' }
    ]
  });
};

export const approve = async (correctionId, adminId, remarks) => {
  const correction = await AttendanceCorrection.findById(correctionId);

  if (!correction) throw new AppError('Correction request not found', 404);
  if (correction.status !== REQUEST_STATUS.PENDING) throw new AppError('Correction request already reviewed', 409);

  let attendance =
    correction.attendance && (await Attendance.findById(correction.attendance));

  if (!attendance) {
    attendance = await Attendance.findOne({
      employee: correction.employee,
      date: startOfDay(correction.date)
    });
  }

  if (!attendance) {
    attendance = new Attendance({ employee: correction.employee, date: startOfDay(correction.date) });
  }

  if (
    correction.correctionType === ATTENDANCE_CORRECTION_TYPES.PUNCH_IN ||
    correction.correctionType === ATTENDANCE_CORRECTION_TYPES.BOTH
  ) {
    attendance.punchIn = { ...(attendance.punchIn || {}), time: correction.requestedPunchIn };
  }

  if (
    correction.correctionType === ATTENDANCE_CORRECTION_TYPES.PUNCH_OUT ||
    correction.correctionType === ATTENDANCE_CORRECTION_TYPES.BOTH
  ) {
    attendance.punchOut = { ...(attendance.punchOut || {}), time: correction.requestedPunchOut };
  }

  recalculateHours(attendance);
  await attendance.save();

  correction.attendance = attendance._id;
  correction.status = REQUEST_STATUS.APPROVED;
  correction.reviewedBy = adminId;
  correction.reviewedAt = new Date();
  correction.reviewRemarks = remarks;
  await correction.save();

  return correction.populate([
    { path: 'employee', select: 'name email department' },
    { path: 'attendance' },
    { path: 'reviewedBy', select: 'name email' }
  ]);
};

export const reject = async (correctionId, adminId, remarks) => {
  const correction = await AttendanceCorrection.findById(correctionId);

  if (!correction) throw new AppError('Correction request not found', 404);
  if (correction.status !== REQUEST_STATUS.PENDING) throw new AppError('Correction request already reviewed', 409);

  correction.status = REQUEST_STATUS.REJECTED;
  correction.reviewedBy = adminId;
  correction.reviewedAt = new Date();
  correction.reviewRemarks = remarks;

  await correction.save();

  return correction.populate([
    { path: 'employee', select: 'name email department' },
    { path: 'reviewedBy', select: 'name email' }
  ]);
};
