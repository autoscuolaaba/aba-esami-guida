import React, { useState, useMemo } from 'react';
import { BarChart3, X, Calendar, Users, TrendingUp, Target, UserCheck } from 'lucide-react';
import { SessionMap, Examiner } from '../types';

interface StatsDashboardProps {
  sessions: SessionMap;
  examiners: Examiner[];
}

interface MonthlyData {
  month: string;
  passed: number;
  failed: number;
}

interface ExaminerStats {
  id: string;
  name: string;
  count: number;
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ sessions, examiners }) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Get available years from sessions
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(currentYear); // Always include current year

    Object.keys(sessions).forEach(dateKey => {
      const year = parseInt(dateKey.split('-')[0]);
      if (!isNaN(year)) {
        years.add(year);
      }
    });

    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [sessions, currentYear]);

  // Calculate examiner statistics for selected year
  const examinerStats = useMemo((): ExaminerStats[] => {
    const yearStr = selectedYear.toString();
    const counts: Record<string, number> = {};

    Object.entries(sessions).forEach(([dateKey, session]) => {
      // Only count sessions from selected year
      if (dateKey.startsWith(yearStr) && session.examinerId) {
        counts[session.examinerId] = (counts[session.examinerId] || 0) + 1;
      }
    });

    return examiners
      .map(e => ({
        id: e.id,
        name: e.name,
        count: counts[e.id] || 0
      }))
      .filter(e => e.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [sessions, examiners, selectedYear]);

  // Calculate all statistics
  const stats = useMemo(() => {
    let totalExams = 0;
    let totalStudents = 0;
    let passedStudents = 0;
    let failedStudents = 0;
    let scheduledStudents = 0;

    Object.values(sessions).forEach((session) => {
      if (session.students.length > 0) {
        totalExams++;
        session.students.forEach((student) => {
          totalStudents++;
          if (student.status === 'PASSED') passedStudents++;
          else if (student.status === 'FAILED') failedStudents++;
          else if (student.status === 'SCHEDULED') scheduledStudents++;
        });
      }
    });

    const completedExams = passedStudents + failedStudents;
    const passRate = completedExams > 0 ? (passedStudents / completedExams) * 100 : null;
    const failRate = completedExams > 0 ? (failedStudents / completedExams) * 100 : null;
    const avgStudentsPerSession = totalExams > 0 ? totalStudents / totalExams : 0;

    return {
      totalExams,
      totalStudents,
      passedStudents,
      failedStudents,
      scheduledStudents,
      passRate,
      failRate,
      avgStudentsPerSession,
      completedExams,
    };
  }, [sessions]);

  // Calculate monthly stats for the last 6 months
  const monthlyData = useMemo((): MonthlyData[] => {
    const now = new Date();
    const months: MonthlyData[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('it-IT', { month: 'short' });

      let passed = 0;
      let failed = 0;

      Object.entries(sessions).forEach(([dateKey, session]) => {
        if (dateKey.startsWith(monthKey)) {
          session.students.forEach((s) => {
            if (s.status === 'PASSED') passed++;
            if (s.status === 'FAILED') failed++;
          });
        }
      });

      months.push({ month: monthName.charAt(0).toUpperCase() + monthName.slice(1), passed, failed });
    }

    return months;
  }, [sessions]);

  // Chart calculations
  const maxValue = Math.max(...monthlyData.map((m) => Math.max(m.passed, m.failed)), 1);
  const chartHeight = 120;
  const barWidth = 16;
  const gap = 4;
  const monthWidth = 50;

  return (
    <>
      {/* Compact Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-gradient-to-r from-[#006D5B] to-[#004D40] text-white rounded-2xl shadow-lg hover:shadow-xl hover:from-[#005D4B] hover:to-[#003D30] transition-all active:scale-[0.98] p-4 flex items-center justify-center gap-3"
      >
        <BarChart3 size={22} />
        <span className="font-semibold">Statistiche</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden animate-fade-in-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#006D5B] to-[#004D40] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="text-white/90" size={24} />
                <h2 className="text-lg font-bold text-white">Dashboard Statistiche</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(90vh-80px)]">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Total Exams */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-500 rounded-lg">
                      <Calendar size={14} className="text-white" />
                    </div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Esami Totali</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalExams}</p>
                </div>

                {/* Total Students */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-green-500 rounded-lg">
                      <Users size={14} className="text-white" />
                    </div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Allievi Totali</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600">{stats.totalStudents}</p>
                </div>

                {/* Pass Rate */}
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-emerald-500 rounded-lg">
                      <TrendingUp size={14} className="text-white" />
                    </div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Tasso Promozione</span>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600">
                    {stats.passRate !== null ? `${stats.passRate.toFixed(0)}%` : 'N/D'}
                  </p>
                </div>

                {/* Average per Session */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-amber-500 rounded-lg">
                      <Target size={14} className="text-white" />
                    </div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Media/Sessione</span>
                  </div>
                  <p className="text-3xl font-bold text-amber-600">
                    {stats.avgStudentsPerSession.toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Results Detail */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Dettaglio Esiti</h3>
                {stats.completedExams > 0 ? (
                  <>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden flex">
                      <div
                        className="bg-gradient-to-r from-green-400 to-green-500 h-full transition-all duration-500"
                        style={{ width: `${stats.passRate}%` }}
                      />
                      <div
                        className="bg-gradient-to-r from-red-400 to-red-500 h-full transition-all duration-500"
                        style={{ width: `${stats.failRate}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      <span className="text-green-600 font-semibold">{stats.passedStudents} promossi</span>
                      {' • '}
                      <span className="text-red-600 font-semibold">{stats.failedStudents} bocciati</span>
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">Nessun esame completato</p>
                )}
              </div>

              {/* Monthly Trend Chart */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Trend Ultimi 6 Mesi</h3>
                <svg
                  width="100%"
                  height="170"
                  viewBox={`0 0 ${monthWidth * 6} 170`}
                  className="overflow-visible"
                >
                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={10 + chartHeight * (1 - ratio)}
                      x2={monthWidth * 6}
                      y2={10 + chartHeight * (1 - ratio)}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      strokeDasharray={i === 0 ? "0" : "4"}
                    />
                  ))}

                  {monthlyData.map((data, index) => {
                    const x = index * monthWidth + monthWidth / 2;
                    const passedHeight = (data.passed / maxValue) * chartHeight;
                    const failedHeight = (data.failed / maxValue) * chartHeight;

                    return (
                      <g key={index}>
                        {/* Passed bar */}
                        <rect
                          x={x - barWidth - gap / 2}
                          y={10 + chartHeight - passedHeight}
                          width={barWidth}
                          height={passedHeight}
                          rx="4"
                          className="fill-green-400 hover:fill-green-500 transition-colors"
                        >
                          <title>Promossi: {data.passed}</title>
                        </rect>

                        {/* Failed bar */}
                        <rect
                          x={x + gap / 2}
                          y={10 + chartHeight - failedHeight}
                          width={barWidth}
                          height={failedHeight}
                          rx="4"
                          className="fill-red-400 hover:fill-red-500 transition-colors"
                        >
                          <title>Bocciati: {data.failed}</title>
                        </rect>

                        {/* Month label */}
                        <text
                          x={x}
                          y="155"
                          textAnchor="middle"
                          className="fill-gray-500 text-[10px] font-medium"
                        >
                          {data.month}
                        </text>
                      </g>
                    );
                  })}

                  {/* Y-axis max value */}
                  <text x="4" y="18" className="fill-gray-400 text-[9px]">
                    {maxValue}
                  </text>
                  <text x="4" y={10 + chartHeight + 4} className="fill-gray-400 text-[9px]">
                    0
                  </text>
                </svg>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-green-400 rounded" />
                    <span className="text-xs text-gray-500">Promossi</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-red-400 rounded" />
                    <span className="text-xs text-gray-500">Bocciati</span>
                  </div>
                </div>
              </div>

              {/* Examiner Statistics */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck size={16} className="text-purple-500" />
                    <h3 className="text-sm font-semibold text-gray-700">Esaminatori</h3>
                  </div>
                  {/* Year selector */}
                  <div className="flex items-center gap-1">
                    {availableYears.map(year => (
                      <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          selectedYear === year
                            ? 'bg-purple-500 text-white shadow-md'
                            : 'bg-white text-gray-500 hover:bg-purple-100 hover:text-purple-600 border border-gray-200'
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
                {examinerStats.length > 0 ? (
                  <div className="space-y-2">
                    {examinerStats.map((examiner, index) => (
                      <div
                        key={examiner.id}
                        className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white ${
                            index === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                            index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                            'bg-gradient-to-br from-purple-400 to-purple-500'
                          }`}>
                            {examiner.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{examiner.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-purple-600">{examiner.count}</span>
                          <span className="text-xs text-gray-400">
                            {examiner.count === 1 ? 'esame' : 'esami'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">
                    Nessun esaminatore assegnato nel {selectedYear}
                  </p>
                )}
              </div>

              {/* Scheduled info */}
              {stats.scheduledStudents > 0 && (
                <p className="text-xs text-gray-400 text-center">
                  {stats.scheduledStudents} allievi in attesa di esame
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StatsDashboard;
