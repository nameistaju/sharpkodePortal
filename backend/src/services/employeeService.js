import Client from '../models/Client.js';
import Employee from '../models/Employee.js';
import { EMPLOYEE_STATUS } from '../constants/index.js';
import AppError from '../utils/AppError.js';
import { escapeRegex, paginated } from '../utils/query.js';
import { uploadImageBuffer } from './uploadService.js';

const publicFields = '-password -passwordResetToken -passwordResetExpires -tokenVersion';

const syncClientAssignments = async (employeeId, assignedClients = []) => {
  await Client.updateMany({ assignedEmployees: employeeId }, { $pull: { assignedEmployees: employeeId } });

  if (assignedClients.length) {
    await Client.updateMany(
      { _id: { $in: assignedClients } },
      { $addToSet: { assignedEmployees: employeeId } }
    );
  }
};

export const createEmployee = async (payload, actorId, file) => {
  const existing = await Employee.findOne({ email: payload.email });

  if (existing) {
    throw new AppError('Employee with this email already exists', 409);
  }

  const profilePhoto = file ? await uploadImageBuffer(file) : payload.profilePhoto;

  const employee = await Employee.create({
    ...payload,
    profilePhoto,
    forcePasswordChange: true,
    mustChangePassword: true,
    createdBy: actorId
  });

  await syncClientAssignments(employee._id, payload.assignedClients || []);

  return { employee };
};

export const getEmployees = async (query) => {
  const filter = {};

  if (query.department) filter.department = query.department;
  if (query.status) filter.status = query.status;
  if (query.role) filter.role = query.role;
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }, { department: regex }];
  }

  return paginated(Employee, filter, query, {
    projection: publicFields,
    defaultSort: 'name',
    populate: [{ path: 'assignedClients', select: 'clientName status services' }]
  });
};

export const getEmployeeById = async (employeeId) => {
  const reqStart = performance.now();
  const employee = await Employee.findById(employeeId)
    .select(publicFields)
    .populate('assignedClients', 'clientName status services');
  const reqEnd = performance.now();

  console.log(`[PERF_AUDIT] GET /employees/me/profile:
  - total_duration: ${(reqEnd - reqStart).toFixed(2)}ms
  - db_query_duration: ${(reqEnd - reqStart).toFixed(2)}ms`);

  if (!employee) throw new AppError('Employee not found', 404);

  return employee;
};

export const updateEmployee = async (employeeId, payload, actorId, file) => {
  const employee = await Employee.findById(employeeId);

  if (!employee) throw new AppError('Employee not found', 404);

  const profilePhoto = file ? await uploadImageBuffer(file) : payload.profilePhoto;
  const assignedClients = payload.assignedClients;
  delete payload.assignedClients;

  Object.assign(employee, payload, {
    ...(profilePhoto ? { profilePhoto } : {}),
    updatedBy: actorId
  });

  await employee.save();

  if (assignedClients) {
    employee.assignedClients = assignedClients;
    await employee.save();
    await syncClientAssignments(employee._id, assignedClients);
  }

  return getEmployeeById(employee._id);
};

export const setEmployeeStatus = async (employeeId, status, actorId) => {
  const employee = await Employee.findByIdAndUpdate(
    employeeId,
    { status, updatedBy: actorId },
    { new: true, runValidators: true }
  ).select(publicFields);

  if (!employee) throw new AppError('Employee not found', 404);

  return employee;
};

export const deactivateEmployee = (employeeId, actorId) =>
  setEmployeeStatus(employeeId, EMPLOYEE_STATUS.INACTIVE, actorId);

export const activateEmployee = (employeeId, actorId) =>
  setEmployeeStatus(employeeId, EMPLOYEE_STATUS.ACTIVE, actorId);

export const getProfile = (employeeId) => getEmployeeById(employeeId);

export const updateProfile = async (employeeId, payload, file) => {
  const employee = await Employee.findById(employeeId);

  if (!employee) throw new AppError('Employee not found', 404);

  const profilePhoto = file ? await uploadImageBuffer(file) : payload.profilePhoto;

  Object.assign(employee, payload, {
    ...(profilePhoto ? { profilePhoto } : {})
  });

  await employee.save();

  return getEmployeeById(employee._id);
};
