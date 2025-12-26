import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Calendar, AlertCircle, UserX } from 'lucide-react';
import { ExamSession, Student, StudentStatus } from '../types';
import { formatDateIT } from '../utils';

interface ExamDayModeProps {
  session: ExamSession;
  examDate: Date;
  onPassed: (id: string) => void;
  onFailed: (id: string, studentName: string, newDate: Date, newFailCount: number) => void;
  onAbsent: (id: string, studentName: string, newDate: Date, failCount: number) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

interface ExamStudentCardProps {
  student: Student;
  index: number;
  onPassed: (id: string) => void;
  onFailed: (student: Student) => void;
  onAbsent: (student: Student) => void;
}

const ExamStudentCard: React.FC<ExamStudentCardProps> = ({ student, index, onPassed, onFailed, onAbsent }) => {
  const isPassed = student.status === 'PASSED';
  const isFailed = student.status === 'FAILED';
  const isAbsent = student.status === 'ABSENT';
  const isProcessed = isPassed || isFailed || isAbsent;

  return (
    <div
      className={`
        rounded-2xl p-4 transition-all duration-300
        ${isPassed
          ? 'bg-green-500/20 border-2 border-green-500'
          : isFailed
            ? 'bg-red-500/20 border-2 border-red-500'
            : isAbsent
              ? 'bg-orange-500/20 border-2 border-orange-500'
              : 'bg-gray-800 border-2 border-gray-700'}
      `}
    >
      {/* Header with number and name */}
      <div className="flex items-center gap-3 mb-4">
        <span className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold text-lg">
          {index + 1}
        </span>
        <span className="text-white text-xl font-semibold flex-1 truncate">{student.name}</span>
        {(student.failCount ?? 0) > 0 && (
          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${
            student.failCount === 2 ? 'bg-red-500/30 text-red-300' : 'bg-orange-500/30 text-orange-300'
          }`}>
            {student.failCount}/3
          </span>
        )}
      </div>

      {/* Large action buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onPassed(student.id)}
          disabled={isProcessed}
          className={`
            py-3 rounded-xl font-bold text-sm transition-all flex flex-col items-center justify-center gap-1
            ${isPassed
              ? 'bg-green-500 text-white'
              : isProcessed
                ? 'bg-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-gray-300 hover:bg-green-500/50 hover:text-white active:scale-95'}
          `}
        >
          <CheckCircle size={22} />
          <span className="text-xs">PROMOSSO</span>
        </button>

        <button
          onClick={() => onFailed(student)}
          disabled={isProcessed}
          className={`
            py-3 rounded-xl font-bold text-sm transition-all flex flex-col items-center justify-center gap-1
            ${isFailed
              ? 'bg-red-500 text-white'
              : isProcessed
                ? 'bg-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-gray-300 hover:bg-red-500/50 hover:text-white active:scale-95'}
          `}
        >
          <XCircle size={22} />
          <span className="text-xs">BOCCIATO</span>
        </button>

        <button
          onClick={() => onAbsent(student)}
          disabled={isProcessed}
          className={`
            py-3 rounded-xl font-bold text-sm transition-all flex flex-col items-center justify-center gap-1
            ${isAbsent
              ? 'bg-orange-500 text-white'
              : isProcessed
                ? 'bg-gray-600 text-gray-500 cursor-not-allowed'
                : 'bg-gray-700 text-gray-300 hover:bg-orange-500/50 hover:text-white active:scale-95'}
          `}
        >
          <UserX size={22} />
          <span className="text-xs">ASSENTE</span>
        </button>
      </div>

      {/* Status indicator */}
      {isProcessed && (
        <div className={`mt-3 text-center text-sm font-medium ${
          isPassed ? 'text-green-400' : isFailed ? 'text-red-400' : 'text-orange-400'
        }`}>
          {isPassed ? '✓ Esito registrato: PROMOSSO' : isFailed ? '✗ Esito registrato: BOCCIATO' : '⊘ Esito registrato: ASSENTE'}
        </div>
      )}
    </div>
  );
};

const ExamDayMode: React.FC<ExamDayModeProps> = ({ session, examDate, onPassed, onFailed, onAbsent, onRemove, onClose }) => {
  const [rescheduleModal, setRescheduleModal] = useState<Student | null>(null);
  const [absentModal, setAbsentModal] = useState<Student | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [absentDate, setAbsentDate] = useState('');

  // Calculate stats
  const total = session.students.length;
  const passed = session.students.filter(s => s.status === 'PASSED').length;
  const failed = session.students.filter(s => s.status === 'FAILED').length;
  const absent = session.students.filter(s => s.status === 'ABSENT').length;
  const pending = session.students.filter(s => s.status === 'SCHEDULED').length;

  const turnLabel = session.turn === 'MATTINA' ? 'Mattina' : session.turn === 'POMERIGGIO' ? 'Pomeriggio' : 'Turno N/D';

  // Get minimum date (1 month from exam date) - for failed
  const getMinDate = () => {
    const minDate = new Date(examDate);
    minDate.setMonth(minDate.getMonth() + 1);
    return minDate.toISOString().split('T')[0];
  };

  // Get default date (1 month from exam date) - for failed
  const getDefaultDate = () => {
    const defaultDate = new Date(examDate);
    defaultDate.setMonth(defaultDate.getMonth() + 1);
    return defaultDate;
  };

  // Get 15 days later date (for absent)
  const get15DaysLaterDate = () => {
    const date = new Date(examDate);
    date.setDate(date.getDate() + 15);
    return date;
  };

  const get15DaysLaterString = () => {
    return get15DaysLaterDate().toISOString().split('T')[0];
  };

  const handleFailedClick = (student: Student) => {
    setRescheduleModal(student);
    setCustomDate(getMinDate());
  };

  const handleAbsentClick = (student: Student) => {
    setAbsentModal(student);
    setAbsentDate(get15DaysLaterString());
  };

  const handleRescheduleConfirm = () => {
    if (rescheduleModal && customDate) {
      const newDate = new Date(customDate);
      const newFailCount = (rescheduleModal.failCount || 0) + 1;

      // Check if this is the 3rd failure
      if (newFailCount >= 3) {
        alert(`${rescheduleModal.name} ha raggiunto 3 bocciature. Foglio rosa scaduto - allievo rimosso.`);
        onRemove(rescheduleModal.id);
      } else {
        onFailed(rescheduleModal.id, rescheduleModal.name, newDate, newFailCount);
      }

      setRescheduleModal(null);
      setCustomDate('');
    }
  };

  const handleRescheduleCancel = () => {
    if (rescheduleModal) {
      // Just remove without rescheduling
      onRemove(rescheduleModal.id);
      setRescheduleModal(null);
      setCustomDate('');
    }
  };

  const handleAbsentConfirm = () => {
    if (absentModal && absentDate) {
      const newDate = new Date(absentDate);
      // Keep same fail count - absence is not a failure
      const failCount = absentModal.failCount || 0;
      onAbsent(absentModal.id, absentModal.name, newDate, failCount);
      setAbsentModal(null);
      setAbsentDate('');
    }
  };

  const handleAbsentCancel = () => {
    // Just close the modal, keep student in place
    setAbsentModal(null);
    setAbsentDate('');
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col">
      {/* Compact header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 pt-safe">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={24} />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">Esame in Corso</h1>
            <p className="text-sm text-white/80">{formatDateIT(examDate)} • {turnLabel}</p>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Student list with large buttons */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {session.students.map((student, index) => (
          <ExamStudentCard
            key={student.id}
            student={student}
            index={index}
            onPassed={onPassed}
            onFailed={handleFailedClick}
            onAbsent={handleAbsentClick}
          />
        ))}

        {session.students.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <p className="text-lg">Tutti gli esami completati!</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold"
            >
              Chiudi
            </button>
          </div>
        )}
      </div>

      {/* Footer with summary */}
      <div className="bg-gray-800 p-4 pb-safe">
        <div className="flex justify-around text-center">
          <div>
            <p className="text-xl font-bold text-white">{total}</p>
            <p className="text-xs text-gray-400">Totale</p>
          </div>
          <div>
            <p className="text-xl font-bold text-green-400">{passed}</p>
            <p className="text-xs text-gray-400">Promossi</p>
          </div>
          <div>
            <p className="text-xl font-bold text-red-400">{failed}</p>
            <p className="text-xs text-gray-400">Bocciati</p>
          </div>
          <div>
            <p className="text-xl font-bold text-orange-400">{absent}</p>
            <p className="text-xs text-gray-400">Assenti</p>
          </div>
          <div>
            <p className="text-xl font-bold text-yellow-400">{pending}</p>
            <p className="text-xs text-gray-400">In attesa</p>
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden flex">
            <div
              className="bg-green-500 transition-all duration-300"
              style={{ width: `${(passed / total) * 100}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-300"
              style={{ width: `${(failed / total) * 100}%` }}
            />
            <div
              className="bg-orange-500 transition-all duration-300"
              style={{ width: `${(absent / total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Riprogramma Esame</h3>
              <button
                onClick={() => {
                  setRescheduleModal(null);
                  setCustomDate('');
                }}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-300">
              <span className="font-semibold text-white">{rescheduleModal.name}</span> è stato bocciato. Scegli la nuova data (minimo 1 mese).
            </p>

            {/* Warning for fail count */}
            {(rescheduleModal.failCount ?? 0) >= 1 && (
              <div className={`flex items-center gap-2 p-3 rounded-xl ${
                (rescheduleModal.failCount ?? 0) >= 2
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-orange-500/20 text-orange-300'
              }`}>
                <AlertCircle size={18} />
                <span className="text-sm font-medium">
                  {(rescheduleModal.failCount ?? 0) >= 2
                    ? 'Attenzione: 3ª bocciatura! L\'allievo verrà rimosso.'
                    : `Questa è la ${(rescheduleModal.failCount ?? 0) + 1}ª bocciatura su 3.`
                  }
                </span>
              </div>
            )}

            <div className="space-y-3">
              {/* Quick option: 1 month later */}
              <button
                onClick={() => {
                  setCustomDate(getMinDate());
                  handleRescheduleConfirm();
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-blue-500/50 bg-blue-500/20 hover:bg-blue-500/30 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="font-semibold text-white">Tra 1 mese</p>
                  <p className="text-sm text-gray-400">{formatDateIT(getDefaultDate())}</p>
                </div>
              </button>

              {/* Custom date */}
              <div className="p-4 rounded-xl border-2 border-gray-600 bg-gray-700/50 space-y-3">
                <p className="font-semibold text-white">Oppure scegli data</p>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={getMinDate()}
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-600 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  onClick={handleRescheduleConfirm}
                  disabled={!customDate}
                  className="w-full py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Conferma data
                </button>
              </div>
            </div>

            <button
              onClick={handleRescheduleCancel}
              className="w-full py-3 text-red-400 hover:text-red-300 font-medium transition-colors"
            >
              Non riprogrammare (rimuovi allievo)
            </button>
          </div>
        </div>
      )}

      {/* Absent Modal */}
      {absentModal && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5 border border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Allievo Assente</h3>
              <button
                onClick={() => {
                  setAbsentModal(null);
                  setAbsentDate('');
                }}
                className="text-gray-400 hover:text-white p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-500/20 text-orange-300">
              <UserX size={24} />
              <p>
                <span className="font-semibold text-white">{absentModal.name}</span> era assente. Vuoi riprogrammare?
              </p>
            </div>

            <div className="space-y-3">
              {/* Quick option: 15 days later */}
              <button
                onClick={() => {
                  setAbsentDate(get15DaysLaterString());
                  handleAbsentConfirm();
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-orange-500/50 bg-orange-500/20 hover:bg-orange-500/30 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="font-semibold text-white">Tra 15 giorni</p>
                  <p className="text-sm text-gray-400">{formatDateIT(get15DaysLaterDate())}</p>
                </div>
              </button>

              {/* Custom date */}
              <div className="p-4 rounded-xl border-2 border-gray-600 bg-gray-700/50 space-y-3">
                <p className="font-semibold text-white">Oppure scegli data</p>
                <input
                  type="date"
                  value={absentDate}
                  onChange={(e) => setAbsentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-600 text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
                <button
                  onClick={handleAbsentConfirm}
                  disabled={!absentDate}
                  className="w-full py-3 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Conferma data
                </button>
              </div>
            </div>

            <button
              onClick={handleAbsentCancel}
              className="w-full py-3 text-gray-400 hover:text-gray-300 font-medium transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamDayMode;
