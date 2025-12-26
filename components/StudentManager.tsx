import React, { useState, useRef } from 'react';
import { Student, StudentStatus, SessionMap } from '../types';
import { Trash2, Users, CheckCircle, XCircle, Car, Calendar, X, MoveRight, UserX, Phone, AlertCircle, History } from 'lucide-react';

// WhatsApp official icon component
const WhatsAppIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
import { formatDateIT, getDateKey } from '../utils';

interface StudentManagerProps {
  students: Student[];
  examDate: Date;
  sessions: SessionMap;
  onRemove: (id: string) => void;
  onUpdateStatus: (id: string, status: StudentStatus) => void;
  onUpdateFailCount: (id: string, failCount: number) => void;
  onReschedule: (studentName: string, newDate: Date, failCount: number) => void;
  onMoveStudent: (studentId: string, studentName: string, newDate: Date) => void;
  onAddToWaitingList: (name: string, phone?: string, canBookAfter?: string) => void;
}

const StudentManager: React.FC<StudentManagerProps> = ({ students, examDate, sessions, onRemove, onUpdateStatus, onUpdateFailCount, onReschedule, onMoveStudent, onAddToWaitingList }) => {
  const [rescheduleModal, setRescheduleModal] = useState<{ studentId: string; studentName: string; currentFailCount: number } | null>(null);
  const [absentModal, setAbsentModal] = useState<{ studentId: string; studentName: string } | null>(null);
  const [moveModal, setMoveModal] = useState<{ studentId: string; studentName: string } | null>(null);
  const [customDate, setCustomDate] = useState('');
  const [absentDate, setAbsentDate] = useState('');
  const [selectedMoveDate, setSelectedMoveDate] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    studentId: string;
    studentName: string;
    x: number;
    y: number;
  } | null>(null);
  const [longPressActive, setLongPressActive] = useState<string | null>(null);
  const [whatsappModal, setWhatsappModal] = useState(false);
  const [failCountModal, setFailCountModal] = useState<{ studentId: string; studentName: string; currentFailCount: number } | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Format exam date for WhatsApp message
  const examDateFormatted = examDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Send individual WhatsApp message to a student
  const sendWhatsAppToStudent = (student: Student) => {
    // Nome è la seconda parola (formato: Cognome Nome)
    const nameParts = student.name.split(' ');
    const firstName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
    const message = `Ciao ${firstName}! Sei prenotato/a per l'esame di guida del ${examDateFormatted}.\n\nFammi sapere se sei disponibile! Grazie`;

    if (student.phone) {
      // Clean phone number
      const cleanPhone = student.phone.replace(/[\s\-\(\)]/g, '');
      const fullPhone = cleanPhone.startsWith('+') ? cleanPhone : `+39${cleanPhone}`;
      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/${fullPhone.replace('+', '')}?text=${encoded}`, '_blank');
    } else {
      // No phone - use share API
      if (navigator.share) {
        navigator.share({ text: message });
      } else {
        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
      }
    }
  };

  // Get available exam dates (excluding current date) that have space
  const currentDateKey = getDateKey(examDate);
  const availableExamDates = Object.entries(sessions)
    .filter(([dateKey, session]) => {
      // Exclude current date
      if (dateKey === currentDateKey) return false;
      // Only include dates with sessions that have space (< 7 students)
      return session && session.students.length < 7;
    })
    .map(([dateKey, session]) => ({
      dateKey,
      date: new Date(dateKey),
      studentCount: session.students.length
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate date 1 month after exam date
  const getOneMonthLater = () => {
    const date = new Date(examDate);
    date.setMonth(date.getMonth() + 1);
    return date;
  };

  // Calculate date 15 days after exam date (for absent students)
  const getFifteenDaysLater = () => {
    const date = new Date(examDate);
    date.setDate(date.getDate() + 15);
    return date;
  };

  const handleStatusChange = (studentId: string, studentName: string, newStatus: StudentStatus) => {
    if (newStatus === 'PASSED') {
      // PASSED: remove student completely
      onRemove(studentId);
    } else if (newStatus === 'FAILED') {
      // FAILED: show reschedule dialog
      const student = students.find(s => s.id === studentId);
      const currentFailCount = student?.failCount || 0;
      setRescheduleModal({ studentId, studentName, currentFailCount });
      // Set default custom date to 1 month later
      const oneMonthLater = getOneMonthLater();
      setCustomDate(oneMonthLater.toISOString().split('T')[0]);
    } else if (newStatus === 'ABSENT') {
      // ABSENT: show reschedule dialog for 15 days later
      setAbsentModal({ studentId, studentName });
      // Set default date to 15 days later
      const fifteenDaysLater = getFifteenDaysLater();
      setAbsentDate(fifteenDaysLater.toISOString().split('T')[0]);
    } else {
      onUpdateStatus(studentId, newStatus);
    }
  };

  const handleRescheduleOneMonth = () => {
    if (rescheduleModal) {
      const newFailCount = rescheduleModal.currentFailCount + 1;
      const student = students.find(s => s.id === rescheduleModal.studentId);

      // If 3rd failure, move to waiting list with 1 month cooldown from exam date
      if (newFailCount >= 3) {
        const oneMonthAfterExam = new Date(examDate);
        oneMonthAfterExam.setMonth(oneMonthAfterExam.getMonth() + 1);
        const canBookAfter = oneMonthAfterExam.toISOString();

        onAddToWaitingList(rescheduleModal.studentName, student?.phone, canBookAfter);
        onRemove(rescheduleModal.studentId);
        setRescheduleModal(null);
        alert(`${rescheduleModal.studentName} ha raggiunto 3 bocciature. Spostato in Lista Allievi - potrà essere prenotato dopo 1 mese dalla data dell'esame.`);
        return;
      }

      const newDate = getOneMonthLater();
      onReschedule(rescheduleModal.studentName, newDate, newFailCount);
      onRemove(rescheduleModal.studentId);
      setRescheduleModal(null);
    }
  };

  const handleRescheduleCustomDate = () => {
    if (rescheduleModal && customDate) {
      const newFailCount = rescheduleModal.currentFailCount + 1;
      const student = students.find(s => s.id === rescheduleModal.studentId);

      // If 3rd failure, move to waiting list with 1 month cooldown from exam date
      if (newFailCount >= 3) {
        const oneMonthAfterExam = new Date(examDate);
        oneMonthAfterExam.setMonth(oneMonthAfterExam.getMonth() + 1);
        const canBookAfter = oneMonthAfterExam.toISOString();

        onAddToWaitingList(rescheduleModal.studentName, student?.phone, canBookAfter);
        onRemove(rescheduleModal.studentId);
        setRescheduleModal(null);
        alert(`${rescheduleModal.studentName} ha raggiunto 3 bocciature. Spostato in Lista Allievi - potrà essere prenotato dopo 1 mese dalla data dell'esame.`);
        return;
      }

      const newDate = new Date(customDate);
      onReschedule(rescheduleModal.studentName, newDate, newFailCount);
      onRemove(rescheduleModal.studentId);
      setRescheduleModal(null);
    }
  };

  const handleCancelReschedule = () => {
    // Just close the modal, keep student unchanged (user may have clicked by mistake)
    setRescheduleModal(null);
  };

  // Absent handlers
  const handleAbsentReschedule15Days = () => {
    if (absentModal) {
      const newDate = getFifteenDaysLater();
      // Reschedule without incrementing fail count (absent is not a failure)
      const student = students.find(s => s.id === absentModal.studentId);
      const currentFailCount = student?.failCount || 0;
      onReschedule(absentModal.studentName, newDate, currentFailCount);
      onRemove(absentModal.studentId);
      setAbsentModal(null);
      setAbsentDate('');
    }
  };

  const handleAbsentRescheduleCustomDate = () => {
    if (absentModal && absentDate) {
      const newDate = new Date(absentDate);
      // Reschedule without incrementing fail count (absent is not a failure)
      const student = students.find(s => s.id === absentModal.studentId);
      const currentFailCount = student?.failCount || 0;
      onReschedule(absentModal.studentName, newDate, currentFailCount);
      onRemove(absentModal.studentId);
      setAbsentModal(null);
      setAbsentDate('');
    }
  };

  const handleCancelAbsent = () => {
    // Just close the modal, keep student in place
    setAbsentModal(null);
    setAbsentDate('');
  };

  const handleOpenMoveModal = (studentId: string, studentName: string) => {
    setMoveModal({ studentId, studentName });
    setSelectedMoveDate(null);
  };

  const handleMoveConfirm = () => {
    if (moveModal && selectedMoveDate) {
      const newDate = new Date(selectedMoveDate);
      onMoveStudent(moveModal.studentId, moveModal.studentName, newDate);
      setMoveModal(null);
      setSelectedMoveDate(null);
    }
  };

  // Long press handler for context menu
  const openContextMenu = (student: Student, x: number, y: number) => {
    // Vibrazione feedback su mobile (se supportato)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    setContextMenu({
      studentId: student.id,
      studentName: student.name,
      x,
      y
    });
    setLongPressActive(null);
  };

  // Create long press handlers for each student
  const createLongPressHandler = (student: Student) => {
    return {
      onTouchStart: (e: React.TouchEvent) => {
        setLongPressActive(student.id);
        longPressTimerRef.current = setTimeout(() => {
          const touch = e.touches[0];
          openContextMenu(student, touch.clientX, touch.clientY);
        }, 500);
      },
      onTouchEnd: () => {
        setLongPressActive(null);
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
        }
      },
      onTouchMove: () => {
        setLongPressActive(null);
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
        }
      },
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        openContextMenu(student, e.clientX, e.clientY);
      }
    };
  };

  const isFull = students.length >= 7;

  const getStatusConfig = (status: StudentStatus = 'SCHEDULED') => {
    switch (status) {
      case 'PASSED':
        return {
          icon: CheckCircle,
          label: 'Promosso',
          className: 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200'
        };
      case 'FAILED':
        return {
          icon: XCircle,
          label: 'Bocciato',
          className: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200'
        };
      case 'ABSENT':
        return {
          icon: UserX,
          label: 'Assente',
          className: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200'
        };
      case 'SCHEDULED':
      default:
        return {
          icon: Car,
          label: 'In attesa esame',
          className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
        };
    }
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-gray-900 text-2xl font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          Allievi iscritti
        </h3>
        <div className={`px-3 py-1.5 rounded-full text-sm font-semibold ${isFull ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
          {students.length}/7 Slot
        </div>
      </div>

      {/* WhatsApp Button */}
      {students.length > 0 && (
        <button
          onClick={() => setWhatsappModal(true)}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-green-500 text-white font-semibold hover:bg-green-600 shadow-lg shadow-green-200 transition-all active:scale-[0.98]"
        >
          <WhatsAppIcon size={22} />
          <span>Invia messaggio ad Allievi</span>
        </button>
      )}

      <div className="space-y-3">
        {students.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <Users className="mx-auto mb-3 opacity-50" size={32} />
            <p className="text-base font-medium">Nessun allievo inserito</p>
          </div>
        ) : (
          students.map((student, index) => {
            const statusConfig = getStatusConfig(student.status);
            const StatusIcon = statusConfig.icon;

            // Color schemes for each position
            const colorSchemes = [
              { bg: 'from-violet-500 to-purple-600', glow: 'violet', particle: 'bg-violet-300' },
              { bg: 'from-blue-500 to-cyan-500', glow: 'blue', particle: 'bg-blue-300' },
              { bg: 'from-emerald-500 to-teal-500', glow: 'emerald', particle: 'bg-emerald-300' },
              { bg: 'from-amber-500 to-orange-500', glow: 'amber', particle: 'bg-amber-300' },
              { bg: 'from-rose-500 to-pink-500', glow: 'rose', particle: 'bg-rose-300' },
              { bg: 'from-indigo-500 to-blue-600', glow: 'indigo', particle: 'bg-indigo-300' },
              { bg: 'from-fuchsia-500 to-purple-600', glow: 'fuchsia', particle: 'bg-fuchsia-300' },
            ];
            const scheme = colorSchemes[index % 7];

            const longPressHandlers = createLongPressHandler(student);

            return (
              <div
                key={student.id}
                className={`group relative p-4 sm:p-5 rounded-2xl bg-white border border-gray-100 hover:border-transparent hover:shadow-xl transition-all duration-500 student-card overflow-hidden ${longPressActive === student.id ? 'scale-[0.98]' : ''}`}
                style={{ animationDelay: `${index * 100}ms` }}
                {...longPressHandlers}
              >
                {/* Long press indicator */}
                {longPressActive === student.id && (
                  <div className="absolute inset-0 rounded-2xl border-2 border-blue-400 pointer-events-none animate-pulse" />
                )}

                {/* Animated gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r ${scheme.bg} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}></div>

                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden rounded-2xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                </div>

                {/* Floating particles on hover */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className={`absolute w-2 h-2 ${scheme.particle} rounded-full opacity-0 group-hover:opacity-60 blur-[1px] particle-1`}></div>
                  <div className={`absolute w-1.5 h-1.5 ${scheme.particle} rounded-full opacity-0 group-hover:opacity-40 blur-[1px] particle-2`}></div>
                  <div className={`absolute w-1 h-1 ${scheme.particle} rounded-full opacity-0 group-hover:opacity-50 blur-[1px] particle-3`}></div>
                </div>

                {/* Card content: number, name, status badge */}
                <div className="relative flex items-center gap-3 sm:gap-4">
                  {/* Animated number badge */}
                  <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${scheme.bg} text-white flex items-center justify-center text-lg sm:text-xl font-bold shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 number-badge`}>
                    {/* Glow effect */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${scheme.bg} opacity-0 group-hover:opacity-50 blur-md transition-opacity duration-300`}></div>
                    <span className="relative z-10">{index + 1}</span>
                    {/* Sparkle */}
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                  </div>

                  {/* Name and badges */}
                  <div className="flex-1 min-w-0">
                    <span className="block text-xl sm:text-2xl font-bold text-gray-800 truncate group-hover:text-gray-900 transition-colors">{student.name}</span>

                    {/* Phone number for identification */}
                    {student.phone && (
                      <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone size={10} />
                        {student.phone}
                      </span>
                    )}

                    {/* Status and fail count badges */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${statusConfig.className}`}>
                        <StatusIcon size={12} />
                        <span>{statusConfig.label}</span>
                      </div>

                      {/* Fail count badge */}
                      {(student.failCount ?? 0) > 0 && (
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                          student.failCount === 3
                            ? 'bg-red-100 text-red-600'
                            : student.failCount === 2
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-yellow-100 text-yellow-600'
                        }`}>
                          <XCircle size={12} />
                          <span>{student.failCount}/3</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Riprogramma Esame</h3>
              <button
                onClick={() => setRescheduleModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600">
              <span className="font-semibold text-gray-900">{rescheduleModal.studentName}</span> è stato bocciato. Vuoi riprogrammare l'esame?
            </p>

            {/* Warning for fail count */}
            {rescheduleModal.currentFailCount >= 1 && (
              <div className={`flex items-center gap-2 p-3 rounded-xl ${
                rescheduleModal.currentFailCount >= 2
                  ? 'bg-red-100 text-red-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                <AlertCircle size={18} />
                <span className="text-sm font-medium">
                  {rescheduleModal.currentFailCount >= 2
                    ? 'Attenzione: 3ª bocciatura! L\'allievo verrà rimosso automaticamente.'
                    : `Attenzione: questa è la 2ª bocciatura su 3.`
                  }
                </span>
              </div>
            )}

            <div className="space-y-3">
              {/* Option 1: 1 month later */}
              <button
                onClick={handleRescheduleOneMonth}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-blue-100 bg-blue-50 hover:border-blue-300 hover:bg-blue-100 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Tra 1 mese</p>
                  <p className="text-sm text-gray-500">{formatDateIT(getOneMonthLater())}</p>
                </div>
              </button>

              {/* Option 2: Custom date */}
              <div className="p-4 rounded-xl border-2 border-gray-100 bg-gray-50 space-y-3">
                <p className="font-semibold text-gray-900">Scegli data</p>
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <button
                  onClick={handleRescheduleCustomDate}
                  disabled={!customDate}
                  className="w-full py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Conferma data
                </button>
              </div>
            </div>

            <button
              onClick={handleCancelReschedule}
              className="w-full py-3 text-gray-500 hover:text-red-500 font-medium transition-colors"
            >
              Non riprogrammare
            </button>
          </div>
        </div>
      )}

      {/* Move Student Modal */}
      {moveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Sposta Allievo</h3>
              <button
                onClick={() => setMoveModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600">
              Seleziona la data d'esame per <span className="font-semibold text-gray-900">{moveModal.studentName}</span>
            </p>

            {availableExamDates.length === 0 ? (
              <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <Calendar className="mx-auto mb-2 opacity-50" size={24} />
                <p className="text-sm font-medium">Nessuna altra data d'esame disponibile</p>
                <p className="text-xs mt-1">Crea prima una nuova sessione d'esame</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableExamDates.map(({ dateKey, date, studentCount }) => (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedMoveDate(dateKey)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                      selectedMoveDate === dateKey
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-100 bg-gray-50 hover:border-blue-200 hover:bg-blue-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        selectedMoveDate === dateKey ? 'bg-blue-500 text-white' : 'bg-white text-blue-500 border border-blue-200'
                      }`}>
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 capitalize">{formatDateIT(date)}</p>
                        <p className="text-xs text-gray-500">{studentCount}/7 allievi</p>
                      </div>
                    </div>
                    {selectedMoveDate === dateKey && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <CheckCircle size={14} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {availableExamDates.length > 0 && (
              <button
                onClick={handleMoveConfirm}
                disabled={!selectedMoveDate}
                className="w-full py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <MoveRight size={18} />
                Sposta
              </button>
            )}

            <button
              onClick={() => setMoveModal(null)}
              className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Absent Modal */}
      {absentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Allievo Assente</h3>
              <button
                onClick={() => {
                  setAbsentModal(null);
                  setAbsentDate('');
                }}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 text-orange-700">
              <UserX size={24} />
              <p>
                <span className="font-semibold">{absentModal.studentName}</span> era assente all'esame. Vuoi riprogrammare?
              </p>
            </div>

            <div className="space-y-3">
              {/* Option 1: 15 days later */}
              <button
                onClick={handleAbsentReschedule15Days}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-orange-100 bg-orange-50 hover:border-orange-300 hover:bg-orange-100 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Tra 15 giorni</p>
                  <p className="text-sm text-gray-500">{formatDateIT(getFifteenDaysLater())}</p>
                </div>
              </button>

              {/* Option 2: Custom date */}
              <div className="p-4 rounded-xl border-2 border-gray-100 bg-gray-50 space-y-3">
                <p className="font-semibold text-gray-900">Scegli data</p>
                <input
                  type="date"
                  value={absentDate}
                  onChange={(e) => setAbsentDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                />
                <button
                  onClick={handleAbsentRescheduleCustomDate}
                  disabled={!absentDate}
                  className="w-full py-3 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Conferma data
                </button>
              </div>
            </div>

            <button
              onClick={handleCancelAbsent}
              className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Group Modal */}
      {whatsappModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <WhatsAppIcon size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Invia su WhatsApp</h3>
                  <p className="text-sm text-green-600 font-medium">Esame {examDateFormatted}</p>
                </div>
              </div>
              <button
                onClick={() => setWhatsappModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Info message */}
              <p className="text-sm text-gray-500 text-center">
                Invia un messaggio individuale a ogni allievo
              </p>

              {/* Students list */}
              <div className="space-y-2">
                {students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => sendWhatsAppToStudent(student)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="font-medium text-gray-900 truncate">{student.name}</p>
                        {student.phone ? (
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone size={10} />
                            {student.phone}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">Nessun numero</p>
                        )}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-green-500 text-white shrink-0">
                      <WhatsAppIcon size={18} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setWhatsappModal(false)}
                className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fail Count Modal */}
      {failCountModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Bocciature Precedenti</h3>
              <button
                onClick={() => setFailCountModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-gray-600">
              Imposta il numero di bocciature per <span className="font-semibold text-gray-900">{failCountModal.studentName}</span>
            </p>

            <div className="flex gap-3">
              {[0, 1, 2].map((count) => (
                <button
                  key={count}
                  onClick={() => {
                    onUpdateFailCount(failCountModal.studentId, count);
                    setFailCountModal(null);
                  }}
                  className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                    failCountModal.currentFailCount === count
                      ? count === 0
                        ? 'bg-green-500 text-white'
                        : count === 1
                          ? 'bg-yellow-500 text-white'
                          : 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>

            <p className="text-xs text-gray-400 text-center">
              Seleziona quante volte l'allievo è stato bocciato in precedenza
            </p>

            <button
              onClick={() => setFailCountModal(null)}
              className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <>
          {/* Overlay per chiudere */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
            onTouchStart={() => setContextMenu(null)}
          />

          {/* Menu */}
          <div
            className="fixed z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden min-w-[200px] animate-scale-in"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 220),
              top: contextMenu.y > window.innerHeight - 400
                ? Math.max(10, contextMenu.y - 380)
                : contextMenu.y,
            }}
          >
            {/* Header con nome */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="font-semibold text-gray-900 truncate">{contextMenu.studentName}</p>
            </div>

            {/* Azioni */}
            <div className="py-2">
              {/* Sposta ad altra data */}
              <button
                onClick={() => {
                  handleOpenMoveModal(contextMenu.studentId, contextMenu.studentName);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <MoveRight size={16} className="text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Sposta ad altra data</span>
              </button>

              {/* Segna come Promosso */}
              <button
                onClick={() => {
                  handleStatusChange(contextMenu.studentId, contextMenu.studentName, 'PASSED');
                  setContextMenu(null);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-green-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle size={16} className="text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Segna Promosso</span>
              </button>

              {/* Segna come Bocciato */}
              <button
                onClick={() => {
                  handleStatusChange(contextMenu.studentId, contextMenu.studentName, 'FAILED');
                  setContextMenu(null);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <XCircle size={16} className="text-red-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Segna Bocciato</span>
              </button>

              {/* Segna come Assente */}
              <button
                onClick={() => {
                  handleStatusChange(contextMenu.studentId, contextMenu.studentName, 'ABSENT');
                  setContextMenu(null);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-orange-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <UserX size={16} className="text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Segna Assente</span>
              </button>

              <div className="my-2 h-px bg-gray-100 mx-4" />

              {/* Imposta bocciature precedenti */}
              <button
                onClick={() => {
                  const student = students.find(s => s.id === contextMenu.studentId);
                  setFailCountModal({
                    studentId: contextMenu.studentId,
                    studentName: contextMenu.studentName,
                    currentFailCount: student?.failCount || 0
                  });
                  setContextMenu(null);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-purple-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <History size={16} className="text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Bocciature precedenti</span>
              </button>

              <div className="my-2 h-px bg-gray-100 mx-4" />

              {/* Elimina */}
              <button
                onClick={() => {
                  if (window.confirm(`Rimuovere ${contextMenu.studentName} dalla lista?`)) {
                    onRemove(contextMenu.studentId);
                  }
                  setContextMenu(null);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                  <Trash2 size={16} className="text-red-600" />
                </div>
                <span className="text-sm font-medium text-red-600">Rimuovi</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Custom Animations for Students */}
      <style>{`
        @keyframes float-particle-1 {
          0%, 100% { transform: translate(10%, 80%) scale(1); }
          25% { transform: translate(30%, 20%) scale(1.2); }
          50% { transform: translate(70%, 60%) scale(0.8); }
          75% { transform: translate(50%, 30%) scale(1.1); }
        }
        @keyframes float-particle-2 {
          0%, 100% { transform: translate(80%, 70%) scale(1); }
          33% { transform: translate(20%, 40%) scale(1.3); }
          66% { transform: translate(60%, 20%) scale(0.9); }
        }
        @keyframes float-particle-3 {
          0%, 100% { transform: translate(50%, 90%) scale(1); }
          50% { transform: translate(40%, 10%) scale(1.2); }
        }
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes pulse-badge {
          0%, 100% { box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
          50% { box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2); }
        }
        .student-card {
          animation: slide-in 0.4s ease-out forwards;
        }
        .particle-1 {
          animation: float-particle-1 4s ease-in-out infinite;
        }
        .particle-2 {
          animation: float-particle-2 5s ease-in-out infinite 0.5s;
        }
        .particle-3 {
          animation: float-particle-3 3s ease-in-out infinite 1s;
        }
        .number-badge {
          animation: pulse-badge 2s ease-in-out infinite;
        }
        .group:hover .number-badge {
          animation: none;
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.15s ease-out;
        }
      `}</style>
    </div>
  );
};

export default StudentManager;