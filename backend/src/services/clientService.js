import Client from '../models/Client.js';
import Employee from '../models/Employee.js';
import AppError from '../utils/AppError.js';
import { escapeRegex, paginated } from '../utils/query.js';

const syncEmployeeAssignments = async (clientId, assignedEmployees = []) => {
  await Employee.updateMany({ assignedClients: clientId }, { $pull: { assignedClients: clientId } });

  if (assignedEmployees.length) {
    await Employee.updateMany(
      { _id: { $in: assignedEmployees } },
      { $addToSet: { assignedClients: clientId } }
    );
  }
};

export const create = async (payload, actorId) => {
  const client = await Client.create({ ...payload, createdBy: actorId });
  await syncEmployeeAssignments(client._id, payload.assignedEmployees || []);
  return getById(client._id);
};

export const update = async (clientId, payload, actorId) => {
  const client = await Client.findByIdAndUpdate(
    clientId,
    { ...payload, updatedBy: actorId },
    { new: true, runValidators: true }
  );

  if (!client) throw new AppError('Client not found', 404);

  if (payload.assignedEmployees) {
    await syncEmployeeAssignments(client._id, payload.assignedEmployees);
  }

  return getById(client._id);
};

export const remove = async (clientId) => {
  const client = await Client.findByIdAndDelete(clientId);
  if (!client) throw new AppError('Client not found', 404);
  await syncEmployeeAssignments(clientId, []);
};

export const getById = async (clientId) => {
  const client = await Client.findById(clientId)
    .populate('assignedEmployees', 'name email department status')
    .populate('createdBy', 'name email')
    .populate('updatedBy', 'name email');

  if (!client) throw new AppError('Client not found', 404);
  return client;
};

export const list = (requestUser, query) => {
  const filter = {};

  if (requestUser.role === 'EMPLOYEE') filter.assignedEmployees = requestUser._id;
  if (requestUser.role === 'ADMIN' && query.assignedEmployee) filter.assignedEmployees = query.assignedEmployee;
  if (query.status) filter.status = query.status;
  if (query.service) filter.services = new RegExp(escapeRegex(query.service), 'i');
  if (query.search) {
    const regex = new RegExp(escapeRegex(query.search), 'i');
    filter.$or = [{ clientName: regex }, { notes: regex }, { services: regex }];
  }

  return paginated(Client, filter, query, {
    defaultSort: 'clientName',
    populate: [{ path: 'assignedEmployees', select: 'name email department status' }]
  });
};
