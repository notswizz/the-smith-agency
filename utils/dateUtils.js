import { format, parse, isSameDay, isWithinInterval, addDays, eachDayOfInterval } from 'date-fns';

// Format a date string to display format
export const formatDate = (dateString, formatStr = 'MMM d, yyyy') => {
  if (!dateString) return '';
  let date = typeof dateString === 'string' 
    ? parse(dateString, 'yyyy-MM-dd', new Date()) 
    : dateString;
  // If parse failed, date will be Invalid Date
  if (!(date instanceof Date) || isNaN(date)) return '';
  
  // Adjust the date to handle timezone offset
  const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  
  try {
    return format(adjustedDate, formatStr);
  } catch (e) {
    return '';
  }
};

// Generate an array of dates between start and end dates
export const getDatesBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return [];
  
  const start = typeof startDate === 'string' 
    ? parse(startDate, 'yyyy-MM-dd', new Date()) 
    : startDate;
  
  const end = typeof endDate === 'string' 
    ? parse(endDate, 'yyyy-MM-dd', new Date()) 
    : endDate;
  
  // Adjust for timezone offset
  const adjustedStart = new Date(start.getTime() + start.getTimezoneOffset() * 60000);
  const adjustedEnd = new Date(end.getTime() + end.getTimezoneOffset() * 60000);
  
  return eachDayOfInterval({ start: adjustedStart, end: adjustedEnd }).map(date => 
    format(date, 'yyyy-MM-dd')
  );
};

// Check if a date is within a range
export const isDateWithinRange = (date, startDate, endDate) => {
  const checkDate = typeof date === 'string' 
    ? parse(date, 'yyyy-MM-dd', new Date()) 
    : date;
  
  const start = typeof startDate === 'string' 
    ? parse(startDate, 'yyyy-MM-dd', new Date()) 
    : startDate;
  
  const end = typeof endDate === 'string' 
    ? parse(endDate, 'yyyy-MM-dd', new Date()) 
    : endDate;
  
  // Adjust for timezone offset
  const adjustedCheckDate = new Date(checkDate.getTime() + checkDate.getTimezoneOffset() * 60000);
  const adjustedStart = new Date(start.getTime() + start.getTimezoneOffset() * 60000);
  const adjustedEnd = new Date(end.getTime() + end.getTimezoneOffset() * 60000);
  
  return isWithinInterval(adjustedCheckDate, { start: adjustedStart, end: adjustedEnd });
};

// Group dates by month for calendar view
export const groupDatesByMonth = (dates) => {
  const grouped = {};
  
  dates.forEach(dateStr => {
    // Parse with timezone adjustment
    const date = parse(dateStr, 'yyyy-MM-dd', new Date());
    const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    const monthKey = format(adjustedDate, 'yyyy-MM');
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    
    grouped[monthKey].push(dateStr);
  });
  
  return grouped;
};

// Get upcoming dates from today
export const getUpcomingDates = (dates, count = 5) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return dates
    .filter(dateStr => {
      const date = parse(dateStr, 'yyyy-MM-dd', new Date());
      // Adjust for timezone offset
      const adjustedDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
      return adjustedDate >= today;
    })
    .sort((a, b) => {
      const dateA = parse(a, 'yyyy-MM-dd', new Date());
      const dateB = parse(b, 'yyyy-MM-dd', new Date());
      // Adjust for timezone offset
      const adjustedDateA = new Date(dateA.getTime() + dateA.getTimezoneOffset() * 60000);
      const adjustedDateB = new Date(dateB.getTime() + dateB.getTimezoneOffset() * 60000);
      return adjustedDateA - adjustedDateB;
    })
    .slice(0, count);
}; 