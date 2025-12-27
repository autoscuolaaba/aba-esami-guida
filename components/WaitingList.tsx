import React, { useState, useRef, useEffect } from 'react';
import { UserPlus, Plus, Trash2, Calendar, X, ChevronRight, FileUp, Contact, BookUser, Smartphone, Phone, Clock } from 'lucide-react';
import { SessionMap, WaitingStudent } from '../types';
import { formatDateIT } from '../utils';

interface WaitingListProps {
  sessions: SessionMap;
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

const WaitingList: React.FC<WaitingListProps> = ({ sessions, onBookStudent }) => {
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

  return (
    <>
      {/* Main Action Button - Prominent */}
      <button
        onClick={() => setShowMainModal(true)}
        className="w-full bg-gradient-to-r from-[#006D40] to-[#008C51] rounded-3xl shadow-xl shadow-green-400/40 p-5 flex items-center gap-4 hover:shadow-2xl hover:shadow-green-500/50 hover:from-[#005C36] hover:to-[#007A47] transition-all duration-300 active:scale-[0.98] ring-2 ring-green-400/30 hover:ring-green-400/50"
      >
        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
          <UserPlus size={28} className="text-white" />
        </div>
        <div className="text-left flex-1">
          <p className="font-black text-white text-xl tracking-tight">Lista Allievi</p>
          <p className="text-sm text-green-100/90">
            {waitingStudents.length === 0
              ? 'Aggiungi e prenota allievi'
              : `${waitingStudents.length} alliev${waitingStudents.length === 1 ? 'o' : 'i'} da prenotare`}
          </p>
        </div>
        {waitingStudents.length > 0 ? (
          <div className="relative">
            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-30"></div>
            <div className="relative px-4 py-2 bg-white text-[#006D40] text-lg font-black rounded-full shadow-lg">
              {waitingStudents.length}
            </div>
          </div>
        ) : (
          <div className="px-3 py-1.5 bg-white/20 text-white text-xs font-semibold rounded-full">
            NUOVO
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
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <UserPlus size={20} className="text-[#006D40]" />
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
                  <UserPlus size={40} className="mx-auto mb-2 opacity-40" />
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
                            ? 'bg-amber-50 border border-amber-200'
                            : 'bg-gray-50 hover:bg-green-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                            hasCooldown
                              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white'
                              : 'bg-gradient-to-br from-[#006D40] to-[#008C51] text-white'
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
