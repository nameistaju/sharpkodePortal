import * as visitService from '../services/clientVisitService.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const create = catchAsync(async (req, res) => {
  const visit = await visitService.create(req.user, req.body);
  sendSuccess(res, 201, 'Client visit created successfully', { visit });
});

export const history = catchAsync(async (req, res) => {
  const result = await visitService.history(req.user, req.validatedQuery || req.query);
  sendSuccess(res, 200, 'Client visit history fetched successfully', result);
});

export const adminReports = catchAsync(async (req, res) => {
  const result = await visitService.adminReports(req.validatedQuery || req.query);
  sendSuccess(res, 200, 'Client visit admin report fetched successfully', result);
});
