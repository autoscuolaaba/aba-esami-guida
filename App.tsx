import React, { useState, useEffect } from 'react';
import { Trash2, CalendarDays, X, Zap, HelpCircle } from 'lucide-react';
import Calendar from './components/Calendar';
import TurnSelector from './components/TurnSelector';
import StudentManager from './components/StudentManager';
import WhatsAppHeader from './components/WhatsAppHeader';
import BackupManager from './components/BackupManager';
import NotificationManager from './components/NotificationManager';
import WaitingList from './components/WaitingList';
import BookingsSummary from './components/BookingsSummary';
import StatsDashboard from './components/StatsDashboard';
import ExamDayMode from './components/ExamDayMode';
import ExaminerManager from './components/ExaminerManager';
import OnboardingTutorial from './components/OnboardingTutorial';
import { Student, Turn, SessionMap, ExamSession, StudentStatus, MonthlyLimitsMap, Examiner, WaitingStudent } from './types';
import { getDateKey, formatDateIT } from './utils';

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  // State 1: Selected Date (Temporary navigation state)
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    const saved = localStorage.getItem('selectedDate');
    return saved ? new Date(saved) : null;
  });

  // State 2: All Sessions Data (Map keyed by "YYYY-MM-DD")
  const [sessions, setSessions] = useState<SessionMap>(() => {
    const saved = localStorage.getItem('sessions');
    return saved ? JSON.parse(saved) : {};
  });

  // State 3: Monthly Exam Limits (Map keyed by "YYYY-MM")
  const [monthlyLimits, setMonthlyLimits] = useState<MonthlyLimitsMap>(() => {
    const saved = localStorage.getItem('monthlyLimits');
    return saved ? JSON.parse(saved) : {};
  });

  // State 4: Examiners list
  const [examiners, setExaminers] = useState<Examiner[]>(() => {
    const saved = localStorage.getItem('examiners');
    return saved ? JSON.parse(saved) : [];
  });

  // Derived State: Current Session Data based on Selected Date
  const dateKey = selectedDate ? getDateKey(selectedDate) : null;
  
  // Safe accessor for current session
  const currentSession: ExamSession = (dateKey && sessions[dateKey]) 
    ? sessions[dateKey] 
    : { turn: null, students: [] };

  // Persistence Effects
  useEffect(() => {
    if (selectedDate) {
      localStorage.setItem('selectedDate', selectedDate.toISOString());
    } else {
      localStorage.removeItem('selectedDate');
    }
  }, [selectedDate]);

  useEffect(() => {
    localStorage.setItem('sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Auto-backup versioning: keep last 7 daily backups in localStorage
  useEffect(() => {
    if (Object.keys(sessions).length === 0) return; // Don't backup empty sessions

    const today = new Date().toISOString().split('T')[0];
    const backupKey = `sessions_backup_${today}`;

    // Only backup once per day
    if (localStorage.getItem(backupKey)) return;

    // Get existing backups
    const existingBackups = Object.keys(localStorage)
      .filter(k => k.startsWith('sessions_backup_'))
      .sort();

    // Remove old backups, keep only last 7
    if (existingBackups.length >= 7) {
      existingBackups.slice(0, existingBackups.length - 6).forEach(k => {
        localStorage.removeItem(k);
      });
    }

    // Save today's backup
    localStorage.setItem(backupKey, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('monthlyLimits', JSON.stringify(monthlyLimits));
  }, [monthlyLimits]);

  useEffect(() => {
    localStorage.setItem('examiners', JSON.stringify(examiners));
  }, [examiners]);

  // Handlers
  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleMonthlyLimitChange = (monthKey: string, limit: number) => {
    setMonthlyLimits(prev => ({
      ...prev,
      [monthKey]: limit
    }));
  };

  const updateCurrentSession = (updatedSession: ExamSession) => {
    if (!dateKey) return;
    setSessions(prev => ({
      ...prev,
      [dateKey]: updatedSession
    }));
  };

  const handleTurnSelect = (t: Turn) => {
    updateCurrentSession({ ...currentSession, turn: t });
  };

  const handleExaminerSelect = (examinerId: string | null) => {
    if (!dateKey) return;
    setSessions(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        examinerId: examinerId || undefined
      }
    }));
  };

  const handleRemoveStudent = (id: string) => {
    updateCurrentSession({
      ...currentSession,
      students: currentSession.students.filter(s => s.id !== id)
    });
  };

  const handleUpdateStatus = (id: string, status: StudentStatus) => {
    const updatedStudents = currentSession.students.map(s =>
      s.id === id ? { ...s, status } : s
    );
    updateCurrentSession({ ...currentSession, students: updatedStudents });
  };

  const handleUpdateFailCount = (id: string, failCount: number) => {
    const updatedStudents = currentSession.students.map(s =>
      s.id === id ? { ...s, failCount } : s
    );
    updateCurrentSession({ ...currentSession, students: updatedStudents });
  };

  const handleReschedule = (studentName: string, newDate: Date, failCount: number = 1) => {
    const newDateKey = getDateKey(newDate);
    const newStudent: Student = { id: generateId(), name: studentName, status: 'SCHEDULED', failCount };

    setSessions(prev => {
      const existingSession = prev[newDateKey] || { turn: null, students: [] };
      // Check if student limit is not exceeded
      if (existingSession.students.length >= 7) {
        alert(`La data ${formatDateIT(newDate)} ha già 7 allievi. Scegli un'altra data.`);
        return prev;
      }
      return {
        ...prev,
        [newDateKey]: {
          ...existingSession,
          students: [...existingSession.students, newStudent]
        }
      };
    });
  };

  // Check if student name already exists in any session
  const checkDuplicateStudent = (name: string): { exists: boolean; matches: { date: string; phone?: string }[] } => {
    const normalizedName = name.trim().toLowerCase();
    const matches: { date: string; phone?: string }[] = [];

    Object.entries(sessions).forEach(([dateKey, session]) => {
      session.students.forEach(student => {
        if (student.name.trim().toLowerCase() === normalizedName) {
          const date = new Date(dateKey);
          matches.push({
            date: formatDateIT(date),
            phone: student.phone
          });
        }
      });
    });

    return { exists: matches.length > 0, matches };
  };

  // Book student from waiting list to a specific date
  const handleBookFromWaitingList = (studentName: string, date: Date, phone?: string) => {
    // Check for duplicates first
    const duplicate = checkDuplicateStudent(studentName);
    if (duplicate.exists) {
      const matchDetails = duplicate.matches.map(m =>
        m.phone ? `• ${m.date} (Tel: ${m.phone})` : `• ${m.date}`
      ).join('\n');

      const newStudentPhone = phone ? `\nNuovo allievo: Tel. ${phone}` : '\nNuovo allievo: Nessun telefono';

      const confirmAdd = window.confirm(
        `⚠️ ATTENZIONE POSSIBILE DUPLICATO!\n\n"${studentName}" risulta già prenotato:\n${matchDetails}\n${newStudentPhone}\n\nControlla i numeri di telefono per verificare se è la stessa persona o un omonimo.\n\nVuoi procedere comunque?`
      );
      if (!confirmAdd) return;
    }

    const dateKey = getDateKey(date);
    const newStudent: Student = { id: generateId(), name: studentName, phone, status: 'SCHEDULED', failCount: 0 };

    setSessions(prev => {
      const existingSession = prev[dateKey] || { turn: null, students: [] };
      if (existingSession.students.length >= 7) {
        alert(`La data ${formatDateIT(date)} ha già 7 allievi. Scegli un'altra data.`);
        return prev;
      }
      return {
        ...prev,
        [dateKey]: {
          ...existingSession,
          students: [...existingSession.students, newStudent]
        }
      };
    });
  };

  const handleDeleteSession = () => {
    // Logic specifically using current closure values
    if (!selectedDate) return;
    const keyToDelete = getDateKey(selectedDate);

    // Double check existence in current sessions state
    if (!sessions[keyToDelete]) return;

    if (window.confirm('Sei sicuro di voler eliminare l\'intera sessione di esame per questa data? Tutti i dati inseriti verranno persi.')) {
      const newSessions = { ...sessions };
      delete newSessions[keyToDelete];
      setSessions(newSessions);
    }
  };

  const handleImport = (importedSessions: SessionMap) => {
    setSessions(importedSessions);
  };

  // Add student to waiting list (for 3x failed students)
  const handleAddToWaitingList = (name: string, phone?: string, canBookAfter?: string) => {
    const saved = localStorage.getItem('waitingList');
    const waitingList: WaitingStudent[] = saved ? JSON.parse(saved) : [];

    const newStudent: WaitingStudent = {
      id: generateId(),
      name,
      phone,
      addedAt: new Date().toISOString(),
      canBookAfter,
      failedThreeTimes: !!canBookAfter
    };

    const updatedList = [...waitingList, newStudent];
    localStorage.setItem('waitingList', JSON.stringify(updatedList));

    // Trigger storage event to update WaitingList component
    window.dispatchEvent(new Event('storage'));
  };

  // State for move day modal
  const [moveDayModal, setMoveDayModal] = useState(false);
  const [moveDayDate, setMoveDayDate] = useState('');

  // State for exam day mode
  const [examDayMode, setExamDayMode] = useState(false);

  // State for onboarding tutorial
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboardingCompleted');
  });

  // Check if today is an exam day
  const isTodayExamDay = () => {
    const todayKey = getDateKey(new Date());
    const session = sessions[todayKey];
    return session && session.students.length > 0;
  };

  // Handler for exam day mode - student passed (remove from session)
  const handleExamPassed = (id: string) => {
    const todayKey = getDateKey(new Date());
    const todaySession = sessions[todayKey];
    if (!todaySession) return;

    // Mark as passed and remove from session
    setSessions(prev => ({
      ...prev,
      [todayKey]: {
        ...todaySession,
        students: todaySession.students.filter(s => s.id !== id)
      }
    }));
  };

  // Handler for exam day mode - student failed (remove and reschedule)
  const handleExamFailed = (id: string, studentName: string, newDate: Date, newFailCount: number) => {
    const todayKey = getDateKey(new Date());
    const newDateKey = getDateKey(newDate);

    setSessions(prev => {
      const todaySession = prev[todayKey];
      if (!todaySession) return prev;

      const existingNewSession = prev[newDateKey] || { turn: null, students: [] };

      // Check if new date has space
      if (existingNewSession.students.length >= 7) {
        alert(`La data ${formatDateIT(newDate)} ha già 7 allievi. Scegli un'altra data.`);
        return prev;
      }

      // Create new student entry for the new date
      const newStudent: Student = {
        id: generateId(),
        name: studentName,
        status: 'SCHEDULED',
        failCount: newFailCount
      };

      return {
        ...prev,
        [todayKey]: {
          ...todaySession,
          students: todaySession.students.filter(s => s.id !== id)
        },
        [newDateKey]: {
          ...existingNewSession,
          students: [...existingNewSession.students, newStudent]
        }
      };
    });
  };

  // Handler for exam day mode - remove student (3rd failure)
  const handleExamRemove = (id: string) => {
    const todayKey = getDateKey(new Date());
    const todaySession = sessions[todayKey];
    if (!todaySession) return;

    setSessions(prev => ({
      ...prev,
      [todayKey]: {
        ...todaySession,
        students: todaySession.students.filter(s => s.id !== id)
      }
    }));
  };

  // Handler for exam day mode - student absent (remove and reschedule)
  const handleExamAbsent = (id: string, studentName: string, newDate: Date, failCount: number) => {
    const todayKey = getDateKey(new Date());
    const newDateKey = getDateKey(newDate);

    setSessions(prev => {
      const todaySession = prev[todayKey];
      if (!todaySession) return prev;

      const existingNewSession = prev[newDateKey] || { turn: null, students: [] };

      // Check if new date has space
      if (existingNewSession.students.length >= 7) {
        alert(`La data ${formatDateIT(newDate)} ha già 7 allievi. Scegli un'altra data.`);
        return prev;
      }

      // Create new student entry for the new date (keep same fail count, absence is not a failure)
      const newStudent: Student = {
        id: generateId(),
        name: studentName,
        status: 'SCHEDULED',
        failCount: failCount
      };

      return {
        ...prev,
        [todayKey]: {
          ...todaySession,
          students: todaySession.students.filter(s => s.id !== id)
        },
        [newDateKey]: {
          ...existingNewSession,
          students: [...existingNewSession.students, newStudent]
        }
      };
    });
  };

  const handleMoveStudent = (studentId: string, studentName: string, newDate: Date) => {
    if (!dateKey) return;
    const newDateKey = getDateKey(newDate);

    // Find the student to move
    const studentToMove = currentSession.students.find(s => s.id === studentId);
    if (!studentToMove) return;

    setSessions(prev => {
      const existingSession = prev[newDateKey] || { turn: null, students: [] };

      // Check if student limit is not exceeded
      if (existingSession.students.length >= 7) {
        alert(`La data ${formatDateIT(newDate)} ha già 7 allievi. Scegli un'altra data.`);
        return prev;
      }

      // Create new student entry with new ID
      const newStudent: Student = { id: generateId(), name: studentName, status: 'SCHEDULED' };

      // Remove from current session and add to new session
      const currentStudents = prev[dateKey]?.students.filter(s => s.id !== studentId) || [];

      return {
        ...prev,
        [dateKey]: {
          ...prev[dateKey],
          students: currentStudents
        },
        [newDateKey]: {
          ...existingSession,
          students: [...existingSession.students, newStudent]
        }
      };
    });
  };

  const handleMoveEntireDay = () => {
    if (!selectedDate || !dateKey || !moveDayDate) return;

    const newDate = new Date(moveDayDate);
    const newDateKey = getDateKey(newDate);

    // Can't move to same date
    if (newDateKey === dateKey) {
      alert('La data di destinazione è la stessa della data attuale.');
      return;
    }

    setSessions(prev => {
      const existingDestSession = prev[newDateKey] || { turn: null, students: [] };
      const currentSessionData = prev[dateKey];

      if (!currentSessionData) return prev;

      // Check total students won't exceed 7
      const totalStudents = existingDestSession.students.length + currentSessionData.students.length;
      if (totalStudents > 7) {
        alert(`La data ${formatDateIT(newDate)} ha già ${existingDestSession.students.length} allievi. Non c'è spazio per tutti i ${currentSessionData.students.length} allievi.`);
        return prev;
      }

      // Create new sessions object
      const newSessions = { ...prev };

      // Remove current date session
      delete newSessions[dateKey];

      // Merge into destination
      newSessions[newDateKey] = {
        turn: existingDestSession.turn || currentSessionData.turn,
        students: [...existingDestSession.students, ...currentSessionData.students]
      };

      return newSessions;
    });

    setMoveDayModal(false);
    setMoveDayDate('');
    // Navigate to the new date
    setSelectedDate(new Date(moveDayDate));
  };

  const hasSessionContent = currentSession.turn !== null || currentSession.students.length > 0;

  return (
    <>
      <div className="min-h-screen bg-[#f8fafc] pb-8 pt-32 sm:pt-36 transition-all">
        <WhatsAppHeader>
          <div className="flex items-center gap-2 bg-gray-100/60 rounded-xl px-2 py-1" data-onboarding="utility-buttons">
            <div data-onboarding="notifications">
              <NotificationManager sessions={sessions} />
            </div>
            <div className="w-px h-5 bg-gray-300" />
            <div data-onboarding="backup">
              <BackupManager sessions={sessions} examiners={examiners} onImport={handleImport} onImportExaminers={setExaminers} />
            </div>
            <div className="w-px h-5 bg-gray-300" />
            <button
              onClick={() => {
                localStorage.removeItem('onboardingCompleted');
                localStorage.removeItem('onboardingCurrentStep');
                setShowOnboarding(true);
              }}
              className="w-9 h-9 rounded-xl bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-all active:scale-95"
              title="Rivedi Tutorial"
            >
              <HelpCircle size={16} className="text-gray-600" />
            </button>
          </div>
        </WhatsAppHeader>

      <div className="max-w-md mx-auto px-4 space-y-6">

        {/* Exam Day Mode Button - Only visible if today is exam day */}
        {isTodayExamDay() && (
          <section className="animate-fade-in-up">
            <button
              onClick={() => setExamDayMode(true)}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:from-red-600 hover:to-orange-600 transition-all active:scale-[0.98] flex items-center justify-center gap-3 animate-pulse"
            >
              <Zap size={24} />
              MODALITA' ESAME OGGI
            </button>
          </section>
        )}

        {/* Waiting List Section - Always Visible */}
        <section className="animate-fade-in-up" style={{ animationDelay: '50ms' }} data-onboarding="waiting-list">
          <WaitingList sessions={sessions} examiners={examiners} onBookStudent={handleBookFromWaitingList} />
        </section>

        {/* Bookings Summary Section - Always Visible */}
        <section className="animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <BookingsSummary sessions={sessions} examiners={examiners} />
        </section>

        {/* Stats Dashboard Section - Always Visible */}
        <section className="animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <StatsDashboard sessions={sessions} examiners={examiners} />
        </section>

        {/* Calendar Section - Always Visible */}
        <section className="animate-fade-in-up" style={{ animationDelay: '250ms' }} data-onboarding="calendar">
          <Calendar
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            sessions={sessions}
            monthlyLimits={monthlyLimits}
            onMonthlyLimitChange={handleMonthlyLimitChange}
          />
        </section>

        {/* Unified Details Section - Only Visible when a date is selected */}
        {selectedDate && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 animate-fade-in-up" style={{ animationDuration: '300ms' }}>
            
            <div className="flex flex-col items-center mb-8 pb-4 border-b border-gray-100">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-2xl shadow-lg text-center">
                <span className="block text-xs font-medium text-blue-100 mb-1">DATA SELEZIONATA</span>
                <h2 className="text-2xl font-black capitalize tracking-tight">
                  {formatDateIT(selectedDate)}
                </h2>
              </div>

              {hasSessionContent && (
                <div className="flex items-center gap-1 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setMoveDayDate(tomorrow.toISOString().split('T')[0]);
                      setMoveDayModal(true);
                    }}
                    className="relative z-10 group flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                    title="Sposta intera sessione"
                  >
                    <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block pointer-events-none">Sposta</span>
                    <div className="bg-blue-50 p-1.5 rounded-lg group-hover:bg-blue-100 transition-colors pointer-events-none">
                      <CalendarDays size={18} />
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSession}
                    className="relative z-10 group flex items-center gap-2 px-2 sm:px-3 py-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                    title="Elimina intera sessione"
                  >
                    <span className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block pointer-events-none">Elimina</span>
                    <div className="bg-red-50 p-1.5 rounded-lg group-hover:bg-red-100 transition-colors pointer-events-none">
                      <Trash2 size={18} />
                    </div>
                  </button>
                </div>
              )}
            </div>

            <div data-onboarding="turn-selector">
              <TurnSelector
                turn={currentSession.turn}
                onSelect={handleTurnSelect}
              />
            </div>

            <div className="my-6 h-px bg-gray-100"></div>

            <div data-onboarding="examiner">
              <ExaminerManager
                examiners={examiners}
                selectedExaminerId={currentSession.examinerId || null}
                currentTurn={currentSession.turn}
                onSelectExaminer={handleExaminerSelect}
                onUpdateExaminers={setExaminers}
              />
            </div>

            <div className="my-6 h-px bg-gray-100"></div>

            <div data-onboarding="student-manager">
              <StudentManager
                students={currentSession.students}
                examDate={selectedDate}
                sessions={sessions}
                onRemove={handleRemoveStudent}
                onUpdateStatus={handleUpdateStatus}
                onUpdateFailCount={handleUpdateFailCount}
                onReschedule={handleReschedule}
                onMoveStudent={handleMoveStudent}
                onAddToWaitingList={handleAddToWaitingList}
              />
            </div>
          </div>
        )}

        {!selectedDate && (
          <div className="text-center py-12 px-6">
            <p className="text-gray-400 text-sm">Seleziona una data dal calendario per gestire gli esami.</p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-gray-200">
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-400">
              © 2026 ABA Autoscuole - Tutti i diritti riservati
            </p>
            <p className="text-[10px] text-gray-300">
              Software gestionale per prenotazione esami guida
            </p>
          </div>
        </footer>

      </div>

      {/* Move Day Modal */}
      {moveDayModal && selectedDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Sposta Sessione</h3>
              <button
                onClick={() => setMoveDayModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600">
              Sposta tutti gli allievi del <span className="font-semibold text-gray-900">{formatDateIT(selectedDate)}</span> ({currentSession.students.length} allievi) a una nuova data.
            </p>

            <div className="space-y-3">
              <input
                type="date"
                value={moveDayDate}
                onChange={(e) => setMoveDayDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                onClick={handleMoveEntireDay}
                disabled={!moveDayDate}
                className="w-full py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <CalendarDays size={18} />
                Sposta Sessione
              </button>
            </div>

            <button
              onClick={() => setMoveDayModal(false)}
              className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Exam Day Mode */}
      {examDayMode && (
        <ExamDayMode
          session={sessions[getDateKey(new Date())] || { turn: null, students: [] }}
          examDate={new Date()}
          onPassed={handleExamPassed}
          onFailed={handleExamFailed}
          onAbsent={handleExamAbsent}
          onRemove={handleExamRemove}
          onClose={() => setExamDayMode(false)}
        />
      )}

      {/* Onboarding Tutorial */}
      {showOnboarding && (
        <OnboardingTutorial
          onComplete={() => setShowOnboarding(false)}
          onDateSelect={handleDateSelect}
        />
      )}
      </div>
    </>
  );
};

export default App;