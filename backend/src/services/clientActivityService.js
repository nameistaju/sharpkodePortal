import Client from '../models/Client.js';
import ClientActivity from '../models/ClientActivity.js';
import AppError from '../utils/AppError.js';
import { paginated } from '../utils/query.js';

const assertClientAccess = async (user, clientId) => {
  const client = await Client.findById(clientId);

  if (!client) throw new AppError('Client not found', 404);

  if (user.role === 'EMPLOYEE' && !client.assignedEmployees.some((id) => id.equals(user._id))) {
    throw new AppError('You are not assigned to this client', 403);
  }

  return client;
};

export const create = async (user, payload) => {
  await assertClientAccess(user, payload.client);

  return ClientActivity.create({
    ...payload,
    employee: user._id
  });
};

export const timeline = async (user, clientId, query) => {
  await assertClientAccess(user, clientId);

  return paginated(ClientActivity, { client: clientId }, query, {
    defaultSort: '-createdAt',
    populate: [
      { path: 'employee', select: 'name email department' },
      { path: 'client', select: 'clientName status' }
    ]
  });
};

export const feed = (user, query) => {
  const filter = {};

  if (query.clientId) filter.client = query.clientId;
  if (query.employeeId && user.role === 'ADMIN') filter.employee = query.employeeId;
  if (query.activityType) filter.activityType = query.activityType;
  if (user.role === 'EMPLOYEE') filter.employee = user._id;

  return paginated(ClientActivity, filter, query, {
    defaultSort: '-createdAt',
    populate: [
      { path: 'employee', select: 'name email department' },
      { path: 'client', select: 'clientName status services' }
    ]
  });
};
