import Employee from '../models/Employee.js';
import Leave from '../models/Leave.js';
import { REQUEST_STATUS } from '../constants/index.js';
import AppError from '../utils/AppError.js';
import { calculateDaysInclusive } from '../utils/date.js';
import { paginated } from '../utils/query.js';

const adjustBalance = async (employeeId, leaveType, days) => {
  await Employee.updateOne(
    { _id: employeeId, 'leaveBalances.type': leaveType },
    { $inc: { 'leaveBalances.$.used': days } }
  );
};

export const apply = async (employeeId, payload) => {
  const totalDays = calculateDaysInclusive(payload.startDate, payload.endDate);

  return Leave.create({
    ...payload,
    employee: employeeId,
    totalDays
  });
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
