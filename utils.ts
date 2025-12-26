export const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

export const getDaysInMonth = (year: number, month: number): (number | null)[] => {
  const date = new Date(year, month, 1);
  const days: (number | null)[] = [];
  
  // Get the day of the week for the first day (0 is Sunday, 1 is Monday)
  let firstDayIndex = date.getDay();
  // Adjust to make Monday 0, Sunday 6
  firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  // Add empty slots for days before the first day of the month
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }

  // Add the days of the month
  while (date.getMonth() === month) {
    days.push(date.getDate());
    date.setDate(date.getDate() + 1);
  }

  return days;
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const formatDateIT = (date: Date): string => {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

export const getDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};