export const startOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

export const endOfDay = (date = new Date()) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

export const getMonthRange = (year, month) => {
  const monthIndex = Number(month) - 1;
  const start = new Date(Number(year), monthIndex, 1, 0, 0, 0, 0);
  const end = new Date(Number(year), monthIndex + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

export const calculateDaysInclusive = (startDate, endDate) => {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  const diff = end.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
};
