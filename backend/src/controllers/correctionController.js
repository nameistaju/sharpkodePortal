import * as correctionService from '../services/correctionService.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const createRequest = catchAsync(async (req, res) => {
  const correction = await correctionService.createRequest(req.user._id, req.body);
  sendSuccess(res, 201, 'Attendance correction request submitted successfully', { correction });
});

export const history = catchAsync(async (req, res) => {
  const result = await correctionService.history(req.user, req.validatedQuery || req.query);
  sendSuccess(res, 200, 'Attendance correction history fetched successfully', result);
});

export const approve = catchAsync(async (req, res) => {
  const correction = await correctionService.approve(
    req.params.correctionId,
    req.user._id,
    req.body.reviewRemarks
  );
  sendSuccess(res, 200, 'Attendance correction approved successfully', { correction });
});

export const reject = catchAsync(async (req, res) => {
  const correction = await correctionService.reject(
    req.params.correctionId,
    req.user._id,
    req.body.reviewRemarks
  );
  sendSuccess(res, 200, 'Attendance correction rejected successfully', { correction });
});
