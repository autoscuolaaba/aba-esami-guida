import React, { useState, useRef, useEffect } from 'react';
import { ClipboardList, Plus, Trash2, Calendar, X, ChevronRight, FileUp, Contact, BookUser, Smartphone, Phone, Clock, Send } from 'lucide-react';
import { SessionMap, WaitingStudent, ExamSession, Examiner } from '../types';
import { formatDateIT, getDateKey } from '../utils';

interface WaitingListProps {
  sessions: SessionMap;
  examiners: Examiner[];
  onBookStudent: (studentName: string, date: Date, phone?: string) => void;
}

// Contact Picker API types
interface ContactAddress {
  city?: string;
  country?: string;
  postalCode?: string;
  region?: string;
  streetAddress?: string;
}

interface ContactInfo {
  name?: string[];
  email?: string[];
  tel?: string[];
  address?: ContactAddress[];
  icon?: Blob[];
}

interface ContactsManager {
  select(properties: string[], options?: { multiple?: boolean }): Promise<ContactInfo[]>;
  getProperties(): Promise<string[]>;
}

declare global {
  interface Navigator {
    contacts?: ContactsManager;
  }
}

const WaitingList: React.FC<WaitingListProps> = ({ sessions, examiners, onBookStudent }) => {
  const [waitingStudents, setWaitingStudents] = useState<WaitingStudent[]>(() => {
    const saved = localStorage.getItem('waitingList');
    return saved ? JSON.parse(saved) : [];
  });
  const [showMainModal, setShowMainModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showBookModal, setShowBookModal] = useState<WaitingStudent | null>(null);
  const [singleName, setSingleName] = useState('');
  const [hasContactPicker, setHasContactPicker] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const vcfInputRef = useRef<HTMLInputElement>(null);

  // Check for Contact Picker API support
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    setHasContactPicker('contacts' in navigator && 'ContactsManager' in window);
  }, []);

  // Listen for storage events (for backup import refresh)
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('waitingList');
      setWaitingStudents(saved ? JSON.parse(saved) : []);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Save to localStorage whenever list changes
  const saveList = (list: WaitingStudent[]) => {
    setWaitingStudents(list);
    localStorage.setItem('waitingList', JSON.stringify(list));
  };

  // Add single student
  const handleAddSingle = () => {
    if (!singleName.trim()) return;

    const newStudent: WaitingStudent = {
      id: Math.random().toString(36).substr(2, 9),
      name: singleName.trim(),
      addedAt: new Date().toISOString()
    };

    saveList([...waitingStudents, newStudent]);
    setSingleName('');
  };

  // Parse vCard to extract names and phone numbers
  const parseVCard = (vcfContent: string): { name: string; phone?: string }[] => {
    const contacts: { name: string; phone?: string }[] = [];
    const vcards = vcfContent.split('BEGIN:VCARD');

    vcards.forEach(vcard => {
      if (!vcard.trim()) return;

      let name = '';
      let phone: string | undefined;

      // Try to get FN (Full Name) first
      const fnMatch = vcard.match(/FN[;:]([^\r\n]+)/i);
      if (fnMatch) {
        name = fnMatch[1].replace(/^:/, '').trim();
      }

      // Fallback to N (Name) field if FN not found
      if (!name) {
        const nMatch = vcard.match(/N[;:]([^\r\n]+)/i);
        if (nMatch) {
          const parts = nMatch[1].replace(/^:/, '').split(';');
          const lastName = parts[0]?.trim() || '';
          const firstName = parts[1]?.trim() || '';
          name = `${firstName} ${lastName}`.trim();
        }
      }

      // Get phone number (TEL field)
      const telMatch = vcard.match(/TEL[^:]*:([^\r\n]+)/i);
      if (telMatch) {
        phone = telMatch[1].trim();
      }

      if (name) {
        contacts.push({ name, phone });
      }
    });

    return contacts;
  };

  // Import from vCard file
  const handleVcfImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const contacts = parseVCard(content);

      if (contacts.length === 0) {
        alert('Nessun contatto trovato nel file vCard');
        return;
      }

      const newStudents: WaitingStudent[] = contacts.map(contact => ({
        id: Math.random().toString(36).substr(2, 9),
        name: contact.name,
        phone: contact.phone,
        addedAt: new Date().toISOString()
      }));

      saveList([...waitingStudents, ...newStudents]);
      setShowImportModal(false);
      alert(`${contacts.length} contatt${contacts.length === 1 ? 'o' : 'i'} importat${contacts.length === 1 ? 'o' : 'i'}!`);
    };
    reader.readAsText(file);

    // Reset input
    if (vcfInputRef.current) {
      vcfInputRef.current.value = '';
    }
  };

  // Import from device contacts (Contact Picker API)
  const handleContactPicker = async () => {
    if (!navigator.contacts) {
      alert('Il tuo browser non supporta l\'accesso alla rubrica');
      return;
    }

    try {
      const contacts = await navigator.contacts.select(['name', 'tel'], { multiple: true });

      if (contacts.length === 0) return;

      const validContacts = contacts
        .filter(contact => contact.name && contact.name.length > 0)
        .map(contact => ({
          name: contact.name![0],
          phone: contact.tel && contact.tel.length > 0 ? contact.tel[0] : undefined
        }));

      if (validContacts.length === 0) {
        alert('Nessun nome trovato nei contatti selezionati');
        return;
      }

      const newStudents: WaitingStudent[] = validContacts.map(contact => ({
        id: Math.random().toString(36).substr(2, 9),
        name: contact.name,
        phone: contact.phone,
        addedAt: new Date().toISOString()
      }));

      saveList([...waitingStudents, ...newStudents]);
      setShowImportModal(false);
      alert(`${validContacts.length} contatt${validContacts.length === 1 ? 'o' : 'i'} importat${validContacts.length === 1 ? 'o' : 'i'}!`);
    } catch (error) {
      if ((error as Error).name !== 'InvalidStateError') {
        console.error('Contact Picker error:', error);
      }
    }
  };

  // Remove student from waiting list
  const handleRemove = (id: string) => {
    saveList(waitingStudents.filter(s => s.id !== id));
  };

  // Book student to a date
  const handleBook = (student: WaitingStudent, dateKey: string) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    onBookStudent(student.name, date, student.phone);
    handleRemove(student.id);
    setShowBookModal(null);
  };

  // Get available exam dates with space
  const getAvailableDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Object.entries(sessions)
      .filter(([_, session]) => session && session.students.length < 7)
      .map(([dateKey, session]) => {
        const [year, month, day] = dateKey.split('-').map(Number);
        return {
          dateKey,
          date: new Date(year, month - 1, day),
          turn: session.turn,
          studentCount: session.students.length
        };
      })
      .filter(item => item.date >= today)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const availableDates = getAvailableDates();

  // Get future sessions for WhatsApp report
  const getFutureSessions = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (Object.entries(sessions) as [string, ExamSession][])
      .map(([key, session]) => {
        const [year, month, day] = key.split('-').map(Number);
        return {
          date: new Date(year, month - 1, day),
          turn: session.turn,
          students: session.students,
          examinerId: session.examinerId
        };
      })
      .filter(item => {
        const hasContent = item.turn !== null || item.students.length > 0;
        return item.date >= today && hasContent;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const handleSendWhatsApp = () => {
    const reportSessions = getFutureSessions();

    if (reportSessions.length === 0) {
      alert('Non ci sono esami futuri programmati da inviare.');
      return;
    }

    // Get unique month names from all exams
    const uniqueMonths = [...new Set(reportSessions.map(s =>
      s.date.toLocaleDateString('it-IT', { month: 'long' }).toUpperCase()
    ))];
    const monthsStr = uniqueMonths.join(' - ');
    let message = `📋 *ESAMI GUIDA ${monthsStr}*\n\n`;

    reportSessions.forEach((session) => {
      const dateStr = formatDateIT(session.date);
      const turnStr = session.turn ? `(${session.turn})` : '(Turno da definire)';
      const examiner = session.examinerId ? examiners.find(e => e.id === session.examinerId) : null;
      const examinerStr = examiner ? ` - Esam: ${examiner.name}` : '';

      message += `📅 *${dateStr}* ${turnStr}${examinerStr}\n`;

      if (session.students.length > 0) {
        session.students.forEach((s, i) => {
          const statusIcon = s.status === 'PASSED' ? '✅' : s.status === 'FAILED' ? '❌' : '▫️';
          message += `${i + 1}. ${s.name} ${statusIcon}\n`;
        });
      } else {
        message += `_Nessun allievo inserito_\n`;
      }
      message += `\n`;
    });

    const encodedMessage = encodeURIComponent(message.trim());
    const url = `https://wa.me/390424523690?text=${encodedMessage}`;

    window.open(url, '_blank');
  };

  const futureSessionsCount = getFutureSessions().length;

  return (
    <>
      {/* Compact Button - Prominent */}
      <button
        onClick={() => setShowMainModal(true)}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-200 p-4 flex items-center justify-center gap-3 hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all active:scale-[0.98]"
      >
        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
          <ClipboardList size={22} className="text-white" />
        </div>
        <div className="text-left">
          <p className="font-bold text-white text-lg">Lista Allievi</p>
          <p className="text-sm text-blue-100">
            {waitingStudents.length === 0
              ? 'Aggiungi allievi da prenotare'
              : `${waitingStudents.length} alliev${waitingStudents.length === 1 ? 'o' : 'i'} da prenotare`}
          </p>
        </div>
        {waitingStudents.length > 0 && (
          <div className="px-3 py-1.5 bg-white text-blue-600 text-sm font-bold rounded-full">
            {waitingStudents.length}
          </div>
        )}
      </button>

      {/* Main Modal */}
      {showMainModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <ClipboardList size={20} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Lista Allievi</h3>
                  <p className="text-xs text-gray-500">{waitingStudents.length} allievi</p>
                </div>
              </div>
              <button
                onClick={() => setShowMainModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* WhatsApp Send Button */}
            <div className="px-4 pt-4 shrink-0">
              <button
                onClick={handleSendWhatsApp}
                disabled={futureSessionsCount === 0}
                className="w-full p-4 rounded-2xl bg-[#25D366] text-white font-semibold hover:bg-[#22c55e] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg shadow-green-200"
              >
                <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-lg">Invia Allievi Prenotati {futureSessionsCount > 0 && `(${futureSessionsCount})`}</span>
              </button>
            </div>

            {/* Big Import Button */}
            <div className="px-4 py-3 shrink-0">
              <button
                onClick={() => setShowImportModal(true)}
                className="w-full p-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Contact size={28} />
                <span className="font-bold text-xl">Importa Allievi</span>
              </button>
            </div>

            {/* Quick add - Secondary */}
            <div className="px-4 pb-4 border-b border-gray-100 shrink-0">
              <p className="text-xs text-gray-400 mb-2 text-center">oppure aggiungi singolarmente</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddSingle()}
                  placeholder="Nome allievo..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <button
                  onClick={handleAddSingle}
                  disabled={!singleName.trim()}
                  className="px-4 rounded-xl bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4">
              {waitingStudents.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ClipboardList size={40} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nessun allievo</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {waitingStudents.map((student, index) => {
                    // Check if student has a cooldown period
                    const hasCooldown = student.canBookAfter && new Date(student.canBookAfter) > new Date();
                    const cooldownDate = student.canBookAfter ? new Date(student.canBookAfter) : null;

                    return (
                      <div
                        key={student.id}
                        className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                          hasCooldown
                            ? 'bg-orange-50 border border-orange-200'
                            : 'bg-gray-50 hover:bg-blue-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                            hasCooldown
                              ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                              : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{student.name}</p>
                            {student.phone && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                                <Phone size={10} />
                                {student.phone}
                              </p>
                            )}
                            {hasCooldown && cooldownDate && (
                              <p className="text-xs text-orange-600 flex items-center gap-1 mt-0.5">
                                <Clock size={10} />
                                Prenotabile dal {cooldownDate.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                              </p>
                            )}
                            {student.failedThreeTimes && !hasCooldown && (
                              <p className="text-xs text-green-600 flex items-center gap-1 mt-0.5">
                                ✓ Può essere prenotato
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {hasCooldown ? (
                            <div className="px-3 py-2 rounded-xl bg-gray-200 text-gray-500 font-semibold text-sm flex items-center gap-1.5 cursor-not-allowed">
                              <Clock size={16} />
                              <span>Attendi</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowBookModal(student)}
                              className="px-3 py-2 rounded-xl bg-green-500 text-white font-semibold text-sm hover:bg-green-600 shadow-md shadow-green-200 transition-all active:scale-95 flex items-center gap-1.5"
                              title="Prenota"
                            >
                              <Calendar size={16} />
                              <span>Prenota</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleRemove(student.id)}
                            className="p-2 rounded-lg text-gray-300 hover:bg-red-100 hover:text-red-500 transition-all"
                            title="Rimuovi"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setShowMainModal(false)}
                className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Contact size={24} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Importa Allievi</h3>
                  <p className="text-sm text-gray-500">Dalla rubrica o file vCard</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contact Picker - Primary Option */}
            {hasContactPicker ? (
              <button
                onClick={handleContactPicker}
                className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                  <BookUser size={24} className="text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="font-bold text-lg">Apri Rubrica</p>
                  <p className="text-xs text-blue-100">Seleziona i contatti direttamente</p>
                </div>
                <ChevronRight size={24} className="text-white/70" />
              </button>
            ) : (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex items-start gap-3">
                  <Smartphone size={20} className="text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-blue-900 text-sm">Accesso Rubrica</p>
                    {isIOS ? (
                      <p className="text-xs text-blue-700 mt-1">
                        Su iPhone: vai in <b>Contatti</b>, seleziona i contatti, tocca <b>Condividi</b> e salva come vCard, poi importa qui sotto.
                      </p>
                    ) : (
                      <p className="text-xs text-blue-700 mt-1">
                        Apri l'app Contatti, esporta come vCard (.vcf) e importa qui sotto.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* vCard Import Button */}
            <button
              onClick={() => vcfInputRef.current?.click()}
              className="w-full p-4 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-400 transition-all flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                <Contact size={24} className="text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-emerald-900">Importa da vCard</p>
                <p className="text-xs text-emerald-600">Carica un file .vcf con i contatti</p>
              </div>
              <FileUp size={20} className="text-emerald-500 ml-auto" />
            </button>

            <input
              ref={vcfInputRef}
              type="file"
              accept=".vcf,text/vcard"
              onChange={handleVcfImport}
              className="hidden"
            />

            <button
              onClick={() => setShowImportModal(false)}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* Book Modal */}
      {showBookModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Prenota Esame</h3>
                <p className="text-sm text-gray-500">{showBookModal.name}</p>
                {showBookModal.phone && (
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <Phone size={10} />
                    {showBookModal.phone}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowBookModal(null)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {availableDates.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Calendar size={40} className="mx-auto mb-3 opacity-50" />
                <p className="font-medium">Nessuna data disponibile</p>
                <p className="text-sm mt-1">Crea prima una sessione d'esame dal calendario</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {availableDates.map(({ dateKey, date, turn, studentCount }) => (
                  <button
                    key={dateKey}
                    onClick={() => handleBook(showBookModal, dateKey)}
                    className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-green-50 border border-transparent hover:border-green-200 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 capitalize">{formatDateIT(date)}</p>
                        <p className="text-xs text-gray-500">
                          {turn || 'Turno da definire'} • {studentCount}/7 posti
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowBookModal(null)}
              className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default WaitingList;
