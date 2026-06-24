import Attendance from '../models/Attendance.js';
import Client from '../models/Client.js';
import ClientActivity from '../models/ClientActivity.js';
import Employee from '../models/Employee.js';
import Leave from '../models/Leave.js';
import AttendanceCorrection from '../models/AttendanceCorrection.js';
import { CLIENT_STATUS, EMPLOYEE_STATUS, REQUEST_STATUS } from '../constants/index.js';
import { endOfDay, startOfDay } from '../utils/date.js';
import { todayStatus } from './attendanceService.js';

// Helper to fetch and merge chronological activity feed
const getRecentActivities = async (employeeId = null) => {
  const query = employeeId ? { employee: employeeId } : {};

  const [attendances, leaves, corrections, clientActivities] = await Promise.all([
    Attendance.find(query)
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('employee', 'name email department'),
    Leave.find(query)
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('employee', 'name email department'),
    AttendanceCorrection.find(query)
      .sort({ updatedAt: -1 })
      .limit(10)
      .populate('employee', 'name email department'),
    ClientActivity.find(employeeId ? { employee: employeeId } : {})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('employee', 'name email department')
      .populate('client', 'clientName')
  ]);

  const activities = [];

  // Format Attendances
  attendances.forEach(a => {
    if (a.punchIn?.time) {
      activities.push({
        id: `punch-in-${a._id}`,
        type: 'PUNCH_IN',
        employee: a.employee,
        title: 'Clocked In',
        desc: `${a.employee?.name || 'Employee'} punched in at ${new Date(a.punchIn.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        timestamp: a.punchIn.time,
        status: 'success'
      });
    }
    if (a.punchOut?.time) {
      activities.push({
        id: `punch-out-${a._id}`,
        type: 'PUNCH_OUT',
        employee: a.employee,
        title: 'Clocked Out',
        desc: `${a.employee?.name || 'Employee'} punched out at ${new Date(a.punchOut.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${a.workingHours.toFixed(2)} hrs)`,
        timestamp: a.punchOut.time,
        status: 'info'
      });
    }
  });

  // Format Leaves
  leaves.forEach(l => {
    activities.push({
      id: `leave-${l._id}`,
      type: 'LEAVE',
      employee: l.employee,
      title: `Leave Request: ${l.leaveType}`,
      desc: `${l.employee?.name || 'Employee'} requested leave from ${new Date(l.startDate).toLocaleDateString()} to ${new Date(l.endDate).toLocaleDateString()}`,
      timestamp: l.updatedAt || l.createdAt,
      status: l.status.toLowerCase()
    });
  });

  // Format Corrections
  corrections.forEach(c => {
    activities.push({
      id: `correction-${c._id}`,
      type: 'CORRECTION',
      employee: c.employee,
      title: 'Attendance Correction',
      desc: `${c.employee?.name || 'Employee'} requested correction for ${new Date(c.date).toLocaleDateString()}`,
      timestamp: c.updatedAt || c.createdAt,
      status: c.status.toLowerCase()
    });
  });

  // Format Client Activities
  clientActivities.forEach(ca => {
    activities.push({
      id: `client-act-${ca._id}`,
      type: 'CLIENT_ACTIVITY',
      employee: ca.employee,
      title: 'Client Activity Logged',
      desc: `${ca.employee?.name || 'Employee'} logged activity for client ${ca.client?.clientName || 'Unknown'}`,
      timestamp: ca.createdAt,
      status: 'warning'
    });
  });

  // Sort and slice
  return activities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);
};

// Helper for employee streak & month percentage
const getEmployeeStreakAndStats = async (employeeId) => {
  const today = startOfDay();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  const startLimit = startOfDay(startDate);

  const [attendances, leaves] = await Promise.all([
    Attendance.find({
      employee: employeeId,
      date: { $gte: startLimit },
      'punchIn.time': { $exists: true }
    }).select('date'),
    Leave.find({
      employee: employeeId,
      status: REQUEST_STATUS.APPROVED,
      startDate: { $lte: today },
      endDate: { $gte: startLimit }
    }).select('startDate endDate')
  ]);

  const presentDates = new Set(attendances.map(a => startOfDay(a.date).toDateString()));

  const isLeaveDate = (date) => {
    return leaves.some(l => {
      const start = startOfDay(l.startDate);
      const end = endOfDay(l.endDate);
      return date >= start && date <= end;
    });
  };

  let streak = 0;
  let checkDate = new Date(today);
  const todayStr = today.toDateString();
  const hasPunchedInToday = presentDates.has(todayStr);

  if (!hasPunchedInToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  for (let i = 0; i < 30; i++) {
    const checkDateStr = checkDate.toDateString();
    const dayOfWeek = checkDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    if (presentDates.has(checkDateStr)) {
      streak++;
    } else if (isWeekend || isLeaveDate(checkDate)) {
      // Skip weekends/leaves without breaking streak
    } else {
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Attendance rate for current month
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const presentThisMonth = attendances.filter(a => a.date >= currentMonthStart).length;

  let totalDaysThisMonth = 0;
  let tempDate = new Date(currentMonthStart);
  while (tempDate <= today) {
    const day = tempDate.getDay();
    if (day !== 0 && day !== 6) {
      totalDaysThisMonth++;
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }

  if (totalDaysThisMonth === 0) totalDaysThisMonth = 1;
  const attendancePercentage = Math.round((presentThisMonth / totalDaysThisMonth) * 100);

  return {
    streak,
    attendancePercentage: Math.min(attendancePercentage, 100),
    presentThisMonth
  };
};

export const adminDashboard = async () => {
  const reqStart = performance.now();
  const today = startOfDay();
  const todayEnd = endOfDay(today);

  const [totalEmployees, presentToday, onLeave, activeClients, pendingCorrections, todayRecords] = await Promise.all([
    Employee.countDocuments({ status: EMPLOYEE_STATUS.ACTIVE }),
    Attendance.countDocuments({ date: today, 'punchIn.time': { $exists: true } }),
    Leave.countDocuments({
      status: REQUEST_STATUS.APPROVED,
      startDate: { $lte: todayEnd },
      endDate: { $gte: today }
    }),
    Client.countDocuments({ status: CLIENT_STATUS.ACTIVE }),
    AttendanceCorrection.countDocuments({ status: REQUEST_STATUS.PENDING }),
    Attendance.find({ date: today }).populate('employee', 'name email department status')
  ]);

  // Calculate late arrivals (after 9:30 AM)
  const lateArrivals = todayRecords.filter(r => {
    if (!r.punchIn?.time) return false;
    const time = new Date(r.punchIn.time);
    return time.getHours() > 9 || (time.getHours() === 9 && time.getMinutes() > 30);
  }).length;

  // Department split
  const departmentSplitRaw = await Employee.aggregate([
    { $match: { status: EMPLOYEE_STATUS.ACTIVE } },
    { $group: { _id: '$department', value: { $sum: 1 } } }
  ]);
  const departmentSplit = departmentSplitRaw.map(d => ({
    name: d._id || 'Unassigned',
    value: d.value
  }));

  // 7-day attendance trends
  const last7DaysStart = startOfDay();
  last7DaysStart.setDate(last7DaysStart.getDate() - 6);

  const [last7DaysAttendances, last7DaysLeaves] = await Promise.all([
    Attendance.find({ date: { $gte: last7DaysStart, $lte: todayEnd } }),
    Leave.find({
      status: REQUEST_STATUS.APPROVED,
      startDate: { $lte: todayEnd },
      endDate: { $gte: last7DaysStart }
    })
  ]);

  const attendanceTrend = [];
  let tempDate = new Date(last7DaysStart);
  while (tempDate <= today) {
    const checkDateStr = tempDate.toDateString();
    const dayStart = startOfDay(tempDate);

    const present = last7DaysAttendances.filter(a => startOfDay(a.date).toDateString() === checkDateStr && a.punchIn?.time).length;

    const leave = last7DaysLeaves.filter(l => {
      const lStart = startOfDay(l.startDate);
      const lEnd = endOfDay(l.endDate);
      return dayStart >= lStart && dayStart <= lEnd;
    }).length;

    const absent = Math.max(totalEmployees - present - leave, 0);

    attendanceTrend.push({
      name: tempDate.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      Present: present,
      Absent: absent,
      Leave: leave
    });

    tempDate.setDate(tempDate.getDate() + 1);
  }

  // Today's attendance list
  const activeEmployees = await Employee.find({ status: EMPLOYEE_STATUS.ACTIVE }).select('name email department');
  const todayAttendance = activeEmployees.map(emp => {
    const record = todayRecords.find(r => r.employee?._id?.toString() === emp._id.toString());

    let status = 'ABSENT';
    if (record) {
      if (record.punchOut?.time) {
        status = 'PUNCHED_OUT';
      } else if (record.punchIn?.time) {
        status = 'PUNCHED_IN';
      }
    }

    return {
      employee: {
        _id: emp._id,
        name: emp.name,
        email: emp.email,
        department: emp.department
      },
      punchIn: record?.punchIn?.time || null,
      punchOut: record?.punchOut?.time || null,
      workingHours: record?.workingHours || 0,
      status
    };
  });

  const recentActivities = await getRecentActivities();

  const reqEnd = performance.now();
  console.log(`[PERF_AUDIT] GET /dashboard/admin:
  - total_duration: ${(reqEnd - reqStart).toFixed(2)}ms`);

  return {
    totalEmployees,
    presentToday,
    absentToday: Math.max(totalEmployees - presentToday - onLeave, 0),
    onLeave,
    activeClients,
    lateArrivals,
    pendingCorrections,
    attendanceTrend,
    departmentSplit,
    todayAttendance,
    recentActivities
  };
};

export const employeeDashboard = async (employeeId) => {
  const [status, employee, assignedClients, recentActivities, streakStats] = await Promise.all([
    todayStatus(employeeId),
    Employee.findById(employeeId).select('leaveBalances'),
    Client.find({ assignedEmployees: employeeId }).select('clientName status services').limit(10),
    getRecentActivities(employeeId),
    getEmployeeStreakAndStats(employeeId)
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
    recentActivities,
    streak: streakStats.streak,
    attendancePercentage: streakStats.attendancePercentage,
    presentThisMonth: streakStats.presentThisMonth
  };
};
