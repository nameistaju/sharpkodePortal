import Attendance from '../models/Attendance.js';
import Client from '../models/Client.js';
import ClientActivity from '../models/ClientActivity.js';
import Employee from '../models/Employee.js';
import Leave from '../models/Leave.js';
import { CLIENT_STATUS, EMPLOYEE_STATUS, REQUEST_STATUS } from '../constants/index.js';
import { endOfDay, startOfDay } from '../utils/date.js';
import { todayStatus } from './attendanceService.js';

export const adminDashboard = async () => {
  const reqStart = performance.now();
  const today = startOfDay();
  const todayEnd = endOfDay(today);

  const [totalEmployees, presentToday, onLeave, activeClients] = await Promise.all([
    Employee.countDocuments({ status: EMPLOYEE_STATUS.ACTIVE }),
    Attendance.countDocuments({ date: today, 'punchIn.time': { $exists: true } }),
    Leave.countDocuments({
      status: REQUEST_STATUS.APPROVED,
      startDate: { $lte: todayEnd },
      endDate: { $gte: today }
    }),
    Client.countDocuments({ status: CLIENT_STATUS.ACTIVE })
  ]);
  const reqEnd = performance.now();

  console.log(`[PERF_AUDIT] GET /dashboard/admin:
  - total_duration: ${(reqEnd - reqStart).toFixed(2)}ms
  - db_query_duration: ${(reqEnd - reqStart).toFixed(2)}ms`);

  return {
    totalEmployees,
    presentToday,
    absentToday: Math.max(totalEmployees - presentToday - onLeave, 0),
    onLeave,
    activeClients
  };
};

export const employeeDashboard = async (employeeId) => {
  const [status, employee, assignedClients, recentActivities] = await Promise.all([
    todayStatus(employeeId),
    Employee.findById(employeeId).select('leaveBalances'),
    Client.find({ assignedEmployees: employeeId }).select('clientName status services').limit(10),
    ClientActivity.find({ employee: employeeId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('client', 'clientName status')
  ]);

  return {
    attendanceStatus: {
      punchedIn: Boolean(status.attendance?.punchIn?.time),
      punchedOut: Boolean(status.attendance?.punchOut?.time),
      onLeave: status.onLeave,
      attendance: status.attendance
    },
    leaveBalance: employee?.leaveBalances || [],
    assignedClients,
    recentActivities
  };
};
