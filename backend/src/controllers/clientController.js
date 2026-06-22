import * as clientService from '../services/clientService.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const create = catchAsync(async (req, res) => {
  const client = await clientService.create(req.body, req.user._id);
  sendSuccess(res, 201, 'Client created successfully', { client });
});

export const update = catchAsync(async (req, res) => {
  const client = await clientService.update(req.params.clientId, req.body, req.user._id);
  sendSuccess(res, 200, 'Client updated successfully', { client });
});

export const remove = catchAsync(async (req, res) => {
  await clientService.remove(req.params.clientId);
  sendSuccess(res, 200, 'Client deleted successfully');
});

export const getById = catchAsync(async (req, res) => {
  const client = await clientService.getById(req.params.clientId);
  sendSuccess(res, 200, 'Client fetched successfully', { client });
});

export const list = catchAsync(async (req, res) => {
  const result = await clientService.list(req.user, req.validatedQuery || req.query);
  sendSuccess(res, 200, 'Clients fetched successfully', result);
});
