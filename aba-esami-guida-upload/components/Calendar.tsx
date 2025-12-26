import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { daysOfWeek, getDaysInMonth, isSameDay, getDateKey } from '../utils';
import { SessionMap, MonthlyLimitsMap } from '../types';

interface CalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date | null) => void;
  sessions: SessionMap;
  monthlyLimits: MonthlyLimitsMap;
  onMonthlyLimitChange: (monthKey: string, limit: number) => void;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateSelect, sessions, monthlyLimits, onMonthlyLimitChange }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Minimum swipe distance threshold (in pixels)
  const minSwipeDistance = 50;

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const days = getDaysInMonth(year, month);

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  // Touch event handlers for swipe navigation
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setTouchStartY(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchStart || !touchStartY) return;

    const currentX = e.targetTouches[0].clientX;
    const currentY = e.targetTouches[0].clientY;
    const diffX = Math.abs(currentX - touchStart);
    const diffY = Math.abs(currentY - touchStartY);

    // Only handle horizontal swipes
    if (diffX > diffY && diffX > 10) {
      const offset = currentX - touchStart;
      setSwipeOffset(Math.max(-50, Math.min(50, offset * 0.3)));
    }

    setTouchEnd(currentX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setSwipeOffset(0);
      return;
    }

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextMonth(); // Swipe left = next month
    } else if (isRightSwipe) {
      prevMonth(); // Swipe right = previous month
    }

    // Reset states
    setTouchStart(null);
    setTouchStartY(null);
    setTouchEnd(null);
    setSwipeOffset(0);
  };

  const monthName = new Intl.DateTimeFormat('it-IT', { month: 'long' }).format(currentMonth);
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Calculate stats for the current month to show in header
  const examDaysCount = days.filter(day => {
    if (!day) return false;
    const date = new Date(year, month, day);
    const key = getDateKey(date);
    const session = sessions[key];
    return session && (session.turn !== null || session.students.length > 0);
  }).length;

  // Get monthly limit for current month (key format: "YYYY-MM")
  const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
  const currentMonthLimit = monthlyLimits[monthKey] || 0; // 0 means not set

  // Check if max exam sessions reached
  const maxExamsReached = currentMonthLimit > 0 && examDaysCount >= currentMonthLimit;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 sm:p-8 overflow-hidden">
      {/* Header Section - Minimal */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            {capitalizedMonth} <span className="text-gray-300 font-light">{year}</span>
          </h2>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-sm text-blue-500 flex items-center gap-1.5">
              <CalendarIcon size={14} />
              {examDaysCount > 0 ? `${examDaysCount} sessioni programmate` : 'Nessuna sessione'}
            </p>

            {selectedDate && (
              <>
                <span className="text-gray-200">|</span>
                <button
                  onClick={() => onDateSelect(null)}
                  className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                  <X size={14} />
                  Deseleziona
                </button>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
          <button onClick={prevMonth} className="p-2.5 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors active:bg-gray-100">
            <ChevronLeft size={20} />
          </button>
          <div className="w-px h-6 bg-gray-200" />
          <button onClick={nextMonth} className="p-2.5 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors active:bg-gray-100">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Monthly Limit Selector - Compact */}
      <div
        className={`mb-4 px-3 py-2 rounded-xl border ${currentMonthLimit === 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-50/50 border-gray-100'}`}
        data-onboarding="monthly-limit"
      >
        {currentMonthLimit === 0 && (
          <p className="text-[10px] text-amber-600 mb-1.5 flex items-center gap-1">
            <span>⚠️</span>
            Imposta sedute per questo mese
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] text-gray-500 whitespace-nowrap">Sedute:</span>
            {currentMonthLimit > 0 && (
              <span className="text-[11px] text-gray-400">
                {examDaysCount}/{currentMonthLimit}
                {maxExamsReached && <span className="ml-1 text-orange-500 font-medium">• Max</span>}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {[2, 3, 4].map((num) => (
              <button
                key={num}
                onClick={() => onMonthlyLimitChange(monthKey, currentMonthLimit === num ? 0 : num)}
                className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${
                  currentMonthLimit === num
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-500'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Header - Minimal */}
      <div className="grid grid-cols-7 mb-4">
        {daysOfWeek.map((d) => (
          <div key={d} className="text-center text-sm font-bold text-gray-900 uppercase tracking-wide py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Grid Days with swipe support */}
      <div className="relative">
        {/* Swipe indicators */}
        {touchStart && touchEnd && Math.abs(touchStart - touchEnd) > 20 && (
          <div className="absolute inset-y-0 inset-x-0 flex items-center pointer-events-none z-20">
            {touchStart - touchEnd > 20 && (
              <div className="absolute right-0 text-blue-400 animate-pulse bg-white/90 rounded-l-xl py-4 pl-1 pr-2">
                <ChevronRight size={24} />
              </div>
            )}
            {touchStart - touchEnd < -20 && (
              <div className="absolute left-0 text-blue-400 animate-pulse bg-white/90 rounded-r-xl py-4 pr-1 pl-2">
                <ChevronLeft size={24} />
              </div>
            )}
          </div>
        )}

        <div
          className="grid grid-cols-7 gap-1 transition-transform duration-150"
          style={{ transform: `translateX(${swipeOffset}px)` }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
        {days.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} className="aspect-square" />;

          const date = new Date(year, month, day);
          const dateKey = getDateKey(date);

          const isSelected = selectedDate && isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());

          // Check if there is an active session (has turn or students)
          const session = sessions[dateKey];
          const hasSession = session && (session.turn !== null || session.students.length > 0);

          // Gray out non-exam days only when max exams is reached
          const isGrayedOut = maxExamsReached && !hasSession && !isSelected;

          return (
            <div key={day} className="flex justify-center">
              <button
                onClick={() => !isGrayedOut && onDateSelect(isSelected ? null : date)}
                disabled={isGrayedOut}
                className={`
                  relative w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-200
                  ${isSelected
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 scale-105 z-10'
                    : hasSession
                      ? 'text-green-700 border-2 border-green-400 bg-white'
                      : isGrayedOut
                        ? 'text-gray-300 cursor-not-allowed'
                        : isToday
                          ? 'text-blue-500 font-semibold'
                          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <span className={`
                  leading-none text-2xl sm:text-3xl
                  ${isSelected ? 'font-bold' : hasSession ? 'font-bold' : 'font-normal'}
                `}>
                  {day}
                </span>
              </button>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
