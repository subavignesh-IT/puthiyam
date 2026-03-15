// Order ID Format: MonthCode + DayOfWeekCode + Date + BillNumber
// Example: AC0103 = January (A), Wednesday (C), 01st date, 03rd order of the day

const MONTH_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
// A=Jan(1), B=Feb(2), C=Mar(3), ... L=Dec(12)

const DAY_CODES = ['G', 'A', 'B', 'C', 'D', 'E', 'F'];
// JS getDay(): 0=Sun→G, 1=Mon→A, 2=Tue→B, 3=Wed→C, 4=Thu→D, 5=Fri→E, 6=Sat→F
// So: Monday=A, Tuesday=B, Wednesday=C, Thursday=D, Friday=E, Saturday=F, Sunday=G

export const generateOrderId = (existingOrdersToday: number = 0): string => {
  const now = new Date();
  
  const monthCode = MONTH_CODES[now.getMonth()]; // 0-11 -> A-L
  const dayOfWeekCode = DAY_CODES[now.getDay()]; // Mon=A, Tue=B, ... Sun=G
  const date = String(now.getDate()).padStart(2, '0'); // 01-31
  const billNumber = String(existingOrdersToday + 1).padStart(2, '0'); // 01, 02, ...

  return `${monthCode}${dayOfWeekCode}${date}${billNumber}`;
};

export const parseOrderId = (orderId: string): {
  month: string;
  dayOfWeek: string;
  date: string;
  billNumber: string;
} | null => {
  if (orderId.length < 6) return null;
  
  const monthIndex = MONTH_CODES.indexOf(orderId[0]);
  const dayIndex = DAY_CODES.indexOf(orderId[1]);
  
  if (monthIndex === -1 || dayIndex === -1) return null;
  
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return {
    month: months[monthIndex],
    dayOfWeek: days[dayIndex],
    date: orderId.slice(2, 4),
    billNumber: orderId.slice(4),
  };
};

export const getOrderIdForDisplay = (orderId: string): string => {
  // If it's our custom format (6 chars), return as-is
  if (orderId.length === 6 && /^[A-L][A-G]\d{4}$/.test(orderId)) {
    return orderId;
  }
  // Otherwise, it's a UUID - return first 8 chars uppercase
  return orderId.slice(0, 8).toUpperCase();
};
