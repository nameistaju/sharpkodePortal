import ClientVisit from '../models/ClientVisit.js';
import Client from '../models/Client.js';
import { DEPARTMENTS } from '../constants/index.js';
import AppError from '../utils/AppError.js';
import { paginated } from '../utils/query.js';

const assertMarketingEmployee = (user) => {
  if (user.department !== DEPARTMENTS.MARKETING) {
    throw new AppError('Only marketing employees can create client visits', 403);
  }
};

export const create = async (user, payload) => {
  assertMarketingEmployee(user);

  const client = await Client.findById(payload.client);
  if (!client) throw new AppError('Client not found', 404);

  if (user.role === 'EMPLOYEE' && !client.assignedEmployees.some((id) => id.equals(user._id))) {
    throw new AppError('You are not assigned to this client', 403);
  }

  return ClientVisit.create({ ...payload, employee: user._id });
};

export const history = (user, query) => {
  const filter = {};

  if (user.role === 'EMPLOYEE') filter.employee = user._id;
  if (user.role === 'ADMIN' && query.employeeId) filter.employee = query.employeeId;
  if (query.clientId) filter.client = query.clientId;
  if (query.outcome) filter.outcome = query.outcome;
  if (query.from || query.to) {
    filter.visitDate = {};
    if (query.from) filter.visitDate.$gte = query.from;
    if (query.to) filter.visitDate.$lte = query.to;
  }

  return paginated(ClientVisit, filter, query, {
    defaultSort: '-visitDate',
    populate: [
      { path: 'employee', select: 'name email department' },
      { path: 'client', select: 'clientName status services' }
    ]
  });
};

export const adminReports = (query) => history({ role: 'ADMIN' }, query);
