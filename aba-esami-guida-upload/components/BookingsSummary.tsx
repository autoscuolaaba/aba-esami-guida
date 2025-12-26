import React, { useState } from 'react';
import { ClipboardList, X, Users, UserCheck } from 'lucide-react';
import { SessionMap, Examiner } from '../types';
import { formatDateIT } from '../utils';

interface BookingsSummaryProps {
  sessions: SessionMap;
  examiners: Examiner[];
}

const BookingsSummary: React.FC<BookingsSummaryProps> = ({ sessions, examiners }) => {
  const [showModal, setShowModal] = useState(false);

  // Get all sessions with students and sort by date
  const sessionsWithStudents = Object.entries(sessions)
    .filter(([_, session]) => session.students.length > 0)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([dateKey, session]) => ({
      dateKey,
      date: new Date(dateKey),
      session
    }));

  const totalStudents = sessionsWithStudents.reduce(
    (sum, { session }) => sum + session.students.length,
    0
  );

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-2xl shadow-lg shadow-blue-200 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
      >
        <ClipboardList size={22} />
        <span>Riepilogo Prenotazioni</span>
        {totalStudents > 0 && (
          <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold">
            {totalStudents}
          </span>
        )}
      </button>

      {/* Summary Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full my-8 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
                    <ClipboardList size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Riepilogo Prenotazioni</h3>
                    <p className="text-sm text-white/80 mt-0.5">
                      {sessionsWithStudents.length} {sessionsWithStudents.length === 1 ? 'sessione' : 'sessioni'} • {totalStudents} {totalStudents === 1 ? 'allievo' : 'allievi'} totali
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 space-y-4">
              {sessionsWithStudents.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users size={32} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm">Nessuna prenotazione presente</p>
                </div>
              ) : (
                sessionsWithStudents.map(({ dateKey, date, session }) => (
                  <div
                    key={dateKey}
                    className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-5 border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    {/* Date Header */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 capitalize">
                          {formatDateIT(date)}
                        </h4>
                        {session.turn && (
                          <p className="text-xs font-medium text-gray-500 mt-1">
                            Turno: {session.turn === 'MATTINA' ? 'Mattina' : 'Pomeriggio'}
                          </p>
                        )}
                        {session.examinerId && (
                          <p className="text-xs text-purple-600 font-medium mt-0.5 flex items-center gap-1">
                            <UserCheck size={12} />
                            {examiners.find(e => e.id === session.examinerId)?.name || 'Esaminatore'}
                          </p>
                        )}
                      </div>
                      <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-xs font-bold">
                        {session.students.length} {session.students.length === 1 ? 'allievo' : 'allievi'}
                      </div>
                    </div>

                    {/* Students List */}
                    <div className="space-y-2">
                      {session.students.map((student, index) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 text-xs font-bold">
                              {index + 1}
                            </span>
                            <span className="font-medium text-gray-900">{student.name}</span>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              student.status === 'PASSED'
                                ? 'bg-green-100 text-green-700'
                                : student.status === 'FAILED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {student.status === 'PASSED'
                              ? 'Promosso'
                              : student.status === 'FAILED'
                              ? 'Bocciato'
                              : 'Programmato'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="w-full py-3 text-gray-600 hover:text-gray-900 font-semibold transition-colors rounded-xl hover:bg-white"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookingsSummary;
