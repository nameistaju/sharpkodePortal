import Employee from '../models/Employee.js';
import Leave from '../models/Leave.js';
import { LEAVE_TYPES, REQUEST_STATUS } from '../constants/index.js';
import AppError from '../utils/AppError.js';
import { calculateDaysInclusive } from '../utils/date.js';
import { paginated } from '../utils/query.js';
import logger from '../utils/logger.js';

const adjustBalance = async (employeeId, leaveType, days) => {
  await Employee.updateOne(
    { _id: employeeId, 'leaveBalances.type': leaveType },
    { $inc: { 'leaveBalances.$.used': days } }
  );
};

export const apply = async (employeeId, payload) => {
  const { leaveType, startDate, endDate, reason } = payload;

  // 1. Employee existence check
  if (!employeeId) {
    logger.error('Leave application validation failed: employeeId is missing');
    throw new AppError('User context is missing', 401);
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    logger.error('Leave application validation failed: Employee not found', { employeeId });
    throw new AppError('Employee not found', 404);
  }

  // 2. Leave type enum validation
  if (!Object.values(LEAVE_TYPES).includes(leaveType)) {
    logger.error('Leave application validation failed: Invalid leaveType', {
      employeeId,
      leaveType,
      allowedTypes: Object.values(LEAVE_TYPES)
    });
    throw new AppError(`Invalid leave type: ${leaveType}`, 400);
  }

  // 3. Valid date formatting and ranges
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    logger.error('Leave application validation failed: Invalid date formats', {
      employeeId,
      startDate,
      endDate
    });
    throw new AppError('Invalid start date or end date format', 400);
  }

  if (end < start) {
    logger.error('Leave application validation failed: End date is before start date', {
      employeeId,
      startDate,
      endDate
    });
    throw new AppError('End date must be greater than or equal to start date', 400);
  }

  // 4. Leave balances existence check
  if (!employee.leaveBalances || !Array.isArray(employee.leaveBalances)) {
    logger.error('Leave application validation failed: leaveBalances array is missing', { employeeId });
    throw new AppError('Leave balances not initialized for this employee', 400);
  }

  const balance = employee.leaveBalances.find((b) => b.type === leaveType);
  if (!balance) {
    logger.error('Leave application validation failed: leave balance for type not found', {
      employeeId,
      leaveType
    });
    throw new AppError(`Leave balance for type ${leaveType} not found`, 400);
  }

  const totalDays = calculateDaysInclusive(startDate, endDate);

  // 5. Sufficient balance check
  const remaining = balance.allocated - balance.used;
  if (remaining < totalDays) {
    logger.error('Leave application validation failed: Insufficient leave balance', {
      employeeId,
      leaveType,
      requestedDays: totalDays,
      availableDays: remaining
    });
    throw new AppError(`Insufficient leave balance. Requested: ${totalDays}, Available: ${remaining}`, 400);
  }

  // 6. Overlapping request check
  const overlapping = await Leave.findOne({
    employee: employeeId,
    status: { $in: [REQUEST_STATUS.PENDING, REQUEST_STATUS.APPROVED] },
    $or: [
      { startDate: { $lte: end }, endDate: { $gte: start } }
    ]
  });

  if (overlapping) {
    logger.error('Leave application validation failed: Overlapping request exists', {
      employeeId,
      startDate,
      endDate,
      overlappingLeaveId: overlapping._id
    });
    throw new AppError('Leave request overlaps with an existing pending or approved request', 400);
  }

  try {
    const leave = await Leave.create({
      ...payload,
      employee: employeeId,
      totalDays
    });

    logger.info('Leave request created successfully', {
      leaveId: leave._id,
      employeeId,
      leaveType,
      totalDays
    });

    return leave;
  } catch (error) {
    logger.error('Leave model validation or creation failed', {
      employeeId,
      payload,
      error: error.message,
      stack: error.stack
    });

    if (error.name === 'ValidationError') {
      throw error; // normalizeError will format it and set status 400
    }
    throw new AppError(error.message, 400);
  }
};

export const cancel = async (leaveId, employeeId, reason) => {
  const leave = await Leave.findOne({ _id: leaveId, employee: employeeId });

  if (!leave) throw new AppError('Leave request not found', 404);
  if (leave.status !== REQUEST_STATUS.PENDING) throw new AppError('Only pending leave can be cancelled', 409);

  leave.status = REQUEST_STATUS.CANCELLED;
  leave.cancelledAt = new Date();
  leave.cancellationReason = reason;

  await leave.save();
  return leave;
};

export const history = (requestUser, query) => {
  const filter = {};

  if (requestUser.role === 'EMPLOYEE') filter.employee = requestUser._id;
  if (requestUser.role === 'ADMIN' && query.employeeId) filter.employee = query.employeeId;
  if (query.status) filter.status = query.status;
  if (query.leaveType) filter.leaveType = query.leaveType;
  if (query.from || query.to) {
    filter.startDate = {};
    if (query.from) filter.startDate.$gte = query.from;
    if (query.to) filter.startDate.$lte = query.to;
  }

  return paginated(Leave, filter, query, {
    defaultSort: '-startDate',
    populate: [
      { path: 'employee', select: 'name email department leaveBalances' },
      { path: 'reviewedBy', select: 'name email' }
    ]
  });
};

export const approve = async (leaveId, adminId, remarks) => {
  const leave = await Leave.findById(leaveId);

  if (!leave) throw new AppError('Leave request not found', 404);
  if (leave.status !== REQUEST_STATUS.PENDING) throw new AppError('Leave request already reviewed', 409);

  leave.status = REQUEST_STATUS.APPROVED;
  leave.reviewedBy = adminId;
  leave.reviewedAt = new Date();
  leave.reviewRemarks = remarks;

  await leave.save();
  await adjustBalance(leave.employee, leave.leaveType, leave.totalDays);

  return leave.populate([
    { path: 'employee', select: 'name email department leaveBalances' },
    { path: 'reviewedBy', select: 'name email' }
  ]);
};

export const reject = async (leaveId, adminId, remarks) => {
  const leave = await Leave.findById(leaveId);

  if (!leave) throw new AppError('Leave request not found', 404);
  if (leave.status !== REQUEST_STATUS.PENDING) throw new AppError('Leave request already reviewed', 409);

  leave.status = REQUEST_STATUS.REJECTED;
  leave.reviewedBy = adminId;
  leave.reviewedAt = new Date();
  leave.reviewRemarks = remarks;

  await leave.save();

  return leave.populate([
    { path: 'employee', select: 'name email department leaveBalances' },
    { path: 'reviewedBy', select: 'name email' }
  ]);
};
