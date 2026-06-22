import * as activityService from '../services/clientActivityService.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const create = catchAsync(async (req, res) => {
  const activity = await activityService.create(req.user, req.body);
  sendSuccess(res, 201, 'Client activity created successfully', { activity });
});

export const timeline = catchAsync(async (req, res) => {
  const result = await activityService.timeline(req.user, req.params.clientId, req.validatedQuery || req.query);
  sendSuccess(res, 200, 'Client activity timeline fetched successfully', result);
});

export const feed = catchAsync(async (req, res) => {
  const result = await activityService.feed(req.user, req.validatedQuery || req.query);
  sendSuccess(res, 200, 'Recent client activity feed fetched successfully', result);
});
