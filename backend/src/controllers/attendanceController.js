import * as attendanceService from '../services/attendanceService.js';
import catchAsync from '../utils/catchAsync.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const configureOffice = catchAsync(async (req, res) => {
  const setting = await attendanceService.configureOffice(req.body, req.user._id);
  sendSuccess(res, 200, 'Attendance office settings updated successfully', { setting });
});

export const getOfficeSetting = catchAsync(async (_req, res) => {
  const setting = await attendanceService.getOfficeSetting();
  sendSuccess(res, 200, 'Attendance office settings fetched successfully', { setting });
});

export const punchIn = catchAsync(async (req, res) => {
  const attendance = await attendanceService.punchIn(req.user._id, req.body);
  sendSuccess(res, 201, 'Punch in recorded successfully', { attendance });
});

export const punchOut = catchAsync(async (req, res) => {
  const attendance = await attendanceService.punchOut(req.user._id, req.body);
  sendSuccess(res, 200, 'Punch out recorded successfully', { attendance });
});

export const getTodayStatus = catchAsync(async (req, res) => {
  const status = await attendanceService.todayStatus(req.user._id);
  sendSuccess(res, 200, 'Today\'s attendance status fetched successfully', { status });
});

export const history = catchAsync(async (req, res) => {
  const result = await attendanceService.history(req.user, req.validatedQuery || req.query);
  sendSuccess(res, 200, 'Attendance history fetched successfully', result);
});

export const monthlySummary = catchAsync(async (req, res) => {
  const summary = await attendanceService.monthlySummary(req.user, req.validatedQuery || req.query);
  sendSuccess(res, 200, 'Attendance monthly summary fetched successfully', { summary });
});
