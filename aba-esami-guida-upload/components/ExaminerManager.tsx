import React, { useState, useRef } from 'react';
import { UserCheck, Settings, Trash2, X, Plus, FileText, Mic, Image, File, ChevronRight, StickyNote, Paperclip, Circle, StopCircle, Share2, Download } from 'lucide-react';
import { Examiner, Turn, ExaminerNote, ExaminerFile } from '../types';

interface ExaminerManagerProps {
  examiners: Examiner[];
  selectedExaminerId: string | null;
  currentTurn: Turn | null;
  onSelectExaminer: (examinerId: string | null) => void;
  onUpdateExaminers: (examiners: Examiner[]) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

const ExaminerManager: React.FC<ExaminerManagerProps> = ({
  examiners,
  selectedExaminerId,
  currentTurn,
  onSelectExaminer,
  onUpdateExaminers
}) => {
  const [showManageModal, setShowManageModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailExaminer, setDetailExaminer] = useState<Examiner | null>(null);
  const [newExaminerName, setNewExaminerName] = useState('');
  const [newNote, setNewNote] = useState('');
  const [viewingNote, setViewingNote] = useState<ExaminerNote | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleAddExaminer = () => {
    if (!newExaminerName.trim()) return;

    const newExaminer: Examiner = {
      id: generateId(),
      name: newExaminerName.trim(),
      notes: [],
      files: []
    };

    onUpdateExaminers([...examiners, newExaminer]);
    setNewExaminerName('');
  };

  const handleRemoveExaminer = (id: string) => {
    if (window.confirm('Rimuovere questo esaminatore?')) {
      onUpdateExaminers(examiners.filter(e => e.id !== id));
    }
  };

  const handleOpenDetail = (examiner: Examiner) => {
    setDetailExaminer(examiner);
    setShowDetailModal(true);
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !detailExaminer) return;

    const note: ExaminerNote = {
      id: generateId(),
      text: newNote.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedExaminer = {
      ...detailExaminer,
      notes: [...(detailExaminer.notes || []), note]
    };

    onUpdateExaminers(examiners.map(e => e.id === detailExaminer.id ? updatedExaminer : e));
    setDetailExaminer(updatedExaminer);
    setNewNote('');
  };

  const handleDeleteNote = (noteId: string) => {
    if (!detailExaminer) return;

    const updatedExaminer = {
      ...detailExaminer,
      notes: (detailExaminer.notes || []).filter(n => n.id !== noteId)
    };

    onUpdateExaminers(examiners.map(e => e.id === detailExaminer.id ? updatedExaminer : e));
    setDetailExaminer(updatedExaminer);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !detailExaminer) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File troppo grande. Dimensione massima: 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;

      let fileType: ExaminerFile['type'] = 'other';
      if (file.type.includes('pdf')) fileType = 'pdf';
      else if (file.type.includes('audio')) fileType = 'audio';
      else if (file.type.includes('image')) fileType = 'image';

      const newFile: ExaminerFile = {
        id: generateId(),
        name: file.name,
        type: fileType,
        data: base64,
        createdAt: new Date().toISOString()
      };

      const updatedExaminer = {
        ...detailExaminer,
        files: [...(detailExaminer.files || []), newFile]
      };

      onUpdateExaminers(examiners.map(ex => ex.id === detailExaminer.id ? updatedExaminer : ex));
      setDetailExaminer(updatedExaminer);
    };

    reader.readAsDataURL(file);
    event.target.value = ''; // Reset input
  };

  const handleDeleteFile = (fileId: string) => {
    if (!detailExaminer) return;

    const updatedExaminer = {
      ...detailExaminer,
      files: (detailExaminer.files || []).filter(f => f.id !== fileId)
    };

    onUpdateExaminers(examiners.map(e => e.id === detailExaminer.id ? updatedExaminer : e));
    setDetailExaminer(updatedExaminer);
  };

  const handleOpenFile = (file: ExaminerFile) => {
    // Open file in new tab
    const link = document.createElement('a');
    link.href = file.data;
    link.target = '_blank';
    link.download = file.name;
    link.click();
  };

  const handleDownloadFile = (file: ExaminerFile) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareFile = async (file: ExaminerFile) => {
    try {
      // Convert base64 to blob
      const response = await fetch(file.data);
      const blob = await response.blob();
      const fileToShare = new window.File([blob], file.name, { type: blob.type });

      if (navigator.share && navigator.canShare({ files: [fileToShare] })) {
        await navigator.share({
          files: [fileToShare],
          title: file.name,
          text: `Nota audio esaminatore - ${file.name}`
        });
      } else {
        // Fallback: download the file
        handleDownloadFile(file);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to download
      handleDownloadFile(file);
    }
  };

  const startRecording = async () => {
    if (!detailExaminer) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Find supported MIME type (ordered by compatibility)
      // Android: webm/opus works best
      // iOS: mp4/aac works best
      const mimeTypes = [
        'audio/webm;codecs=opus',  // Android Chrome
        'audio/webm',               // Android fallback
        'audio/mp4',                // iOS Safari
        'audio/aac',                // iOS fallback
        'audio/ogg;codecs=opus',    // Firefox
        'audio/ogg',                // Firefox fallback
        'audio/wav',                // Universal fallback
        'audio/mpeg'                // MP3 fallback
      ];

      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      const mediaRecorder = selectedMimeType
        ? new MediaRecorder(stream, { mimeType: selectedMimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Check file size
        if (audioBlob.size > 10 * 1024 * 1024) {
          alert('Registrazione troppo lunga. Dimensione massima: 10MB');
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          const now = new Date();

          // Get file extension from MIME type
          let extension = 'webm';
          if (mimeType.includes('mp4')) extension = 'm4a';
          else if (mimeType.includes('aac')) extension = 'aac';
          else if (mimeType.includes('ogg')) extension = 'ogg';
          else if (mimeType.includes('wav')) extension = 'wav';
          else if (mimeType.includes('mpeg')) extension = 'mp3';

          const fileName = `Registrazione_${now.toLocaleDateString('it-IT').replace(/\//g, '-')}_${now.toLocaleTimeString('it-IT').replace(/:/g, '-')}.${extension}`;

          const newFile: ExaminerFile = {
            id: generateId(),
            name: fileName,
            type: 'audio',
            data: base64,
            createdAt: now.toISOString()
          };

          const updatedExaminer = {
            ...detailExaminer,
            files: [...(detailExaminer.files || []), newFile]
          };

          onUpdateExaminers(examiners.map(ex => ex.id === detailExaminer.id ? updatedExaminer : ex));
          setDetailExaminer(updatedExaminer);
        };

        reader.readAsDataURL(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      alert('Impossibile accedere al microfono. Verifica i permessi.');
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setRecordingTime(0);
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getFileIcon = (type: ExaminerFile['type']) => {
    switch (type) {
      case 'pdf': return <FileText size={18} className="text-red-500" />;
      case 'audio': return <Mic size={18} className="text-purple-500" />;
      case 'image': return <Image size={18} className="text-green-500" />;
      default: return <File size={18} className="text-gray-500" />;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const selectedExaminer = selectedExaminerId
    ? examiners.find(e => e.id === selectedExaminerId)
    : null;

  // Colors based on turn
  const getColors = () => {
    if (currentTurn === 'MATTINA') {
      return {
        dot: 'bg-amber-500',
        selectedBtn: 'bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-md shadow-amber-200',
        unselectedBtn: 'bg-gray-100 text-gray-700 hover:bg-amber-100 hover:text-amber-700',
        infoBg: 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200',
        infoAvatar: 'bg-gradient-to-br from-amber-400 to-orange-400',
        infoText: 'text-amber-900',
        linkColor: 'text-amber-600 hover:text-amber-700'
      };
    } else if (currentTurn === 'POMERIGGIO') {
      return {
        dot: 'bg-indigo-500',
        selectedBtn: 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md shadow-indigo-200',
        unselectedBtn: 'bg-gray-100 text-gray-700 hover:bg-indigo-100 hover:text-indigo-700',
        infoBg: 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200',
        infoAvatar: 'bg-gradient-to-br from-indigo-500 to-purple-500',
        infoText: 'text-indigo-900',
        linkColor: 'text-indigo-600 hover:text-indigo-700'
      };
    }
    // Default purple
    return {
      dot: 'bg-purple-500',
      selectedBtn: 'bg-purple-500 text-white shadow-md',
      unselectedBtn: 'bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700',
      infoBg: 'bg-purple-50 border-purple-100',
      infoAvatar: 'bg-purple-500',
      infoText: 'text-purple-900',
      linkColor: 'text-purple-500 hover:text-purple-700'
    };
  };

  const colors = getColors();

  return (
    <div className="space-y-4">
      <h3 className="text-gray-900 text-2xl font-bold flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${colors.dot} transition-colors`}></span>
        Esaminatore
      </h3>

      {examiners.length === 0 ? (
        /* Empty State - Nessun esaminatore */
        <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
              <UserCheck size={28} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-500 mb-2">Nessun esaminatore configurato</p>
              <button
                onClick={() => setShowManageModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-sm shadow-md shadow-blue-200 hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all active:scale-95"
              >
                <Settings size={16} />
                Configura esaminatori
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {examiners.map(examiner => (
              <button
                key={examiner.id}
                onClick={() => onSelectExaminer(
                  selectedExaminerId === examiner.id ? null : examiner.id
                )}
                className={`
                  px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2
                  ${selectedExaminerId === examiner.id
                    ? colors.selectedBtn
                    : colors.unselectedBtn}
                `}
              >
                <UserCheck size={16} />
                {examiner.name}
              </button>
            ))}
          </div>

          {/* Esaminatore selezionato info - Cliccabile per dettagli */}
          {selectedExaminer && (
            <button
              onClick={() => handleOpenDetail(selectedExaminer)}
              className={`w-full rounded-xl p-3 border transition-all ${colors.infoBg} hover:shadow-md active:scale-[0.99]`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${colors.infoAvatar} text-white flex items-center justify-center font-bold text-sm transition-colors`}>
                    {selectedExaminer.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`font-medium ${colors.infoText} transition-colors`}>{selectedExaminer.name}</span>
                  {((selectedExaminer.notes?.length || 0) > 0 || (selectedExaminer.files?.length || 0) > 0) && (
                    <div className="flex items-center gap-1 ml-2">
                      {(selectedExaminer.notes?.length || 0) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-white/60 px-2 py-0.5 rounded-full">
                          <StickyNote size={12} />
                          {selectedExaminer.notes?.length}
                        </span>
                      )}
                      {(selectedExaminer.files?.length || 0) > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-white/60 px-2 py-0.5 rounded-full">
                          <Paperclip size={12} />
                          {selectedExaminer.files?.length}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <ChevronRight size={18} className={`${colors.infoText} opacity-50`} />
              </div>
            </button>
          )}

          {/* Bottone gestione esaminatori */}
          <button
            onClick={() => setShowManageModal(true)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium hover:bg-blue-100 hover:text-blue-700 transition-all"
          >
            <Settings size={14} />
            Gestisci esaminatori
          </button>
        </>
      )}

      {/* Modal gestione esaminatori */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Gestione Esaminatori</h3>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="p-1 hover:bg-white/10 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Form aggiunta */}
            <div className="p-4 border-b border-gray-100">
              <div className="space-y-3">
                <input
                  type="text"
                  value={newExaminerName}
                  onChange={(e) => setNewExaminerName(e.target.value)}
                  placeholder="Nome esaminatore"
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddExaminer();
                    }
                  }}
                />
                <button
                  onClick={handleAddExaminer}
                  disabled={!newExaminerName.trim()}
                  className="w-full py-2 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Aggiungi Esaminatore
                </button>
              </div>
            </div>

            {/* Lista esaminatori esistenti */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {examiners.map(examiner => (
                <div key={examiner.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => {
                      setShowManageModal(false);
                      handleOpenDetail(examiner);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {examiner.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{examiner.name}</p>
                      <p className="text-xs text-gray-400">
                        {examiner.notes?.length || 0} note · {examiner.files?.length || 0} file
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveExaminer(examiner.id)}
                    className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {examiners.length === 0 && (
                <p className="text-center text-gray-400 py-8">Nessun esaminatore configurato</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal dettagli esaminatore */}
      {showDetailModal && detailExaminer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold text-xl">
                    {detailExaminer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{detailExaminer.name}</h3>
                    <p className="text-sm text-blue-200">Dettagli e note</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-1 hover:bg-white/10 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">

              {/* Sezione Note */}
              <div className="p-4 border-b border-gray-100">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <StickyNote size={18} className="text-blue-500" />
                  Note e Appunti
                </h4>

                {/* Form nuova nota */}
                <div className="mb-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Scrivi una nota... (nessun limite di caratteri)"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="w-full mt-2 py-2 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Aggiungi nota
                  </button>
                </div>

                {/* Lista note */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(detailExaminer.notes || []).length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-4">Nessuna nota</p>
                  ) : (
                    [...(detailExaminer.notes || [])].reverse().map(note => (
                      <div
                        key={note.id}
                        className="bg-blue-50 border border-blue-100 rounded-xl p-3 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => setViewingNote(note)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-gray-800 flex-1 line-clamp-2">{note.text}</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            className="p-1 text-red-400 hover:text-red-600 rounded transition-colors shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(note.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sezione Files */}
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Paperclip size={18} className="text-blue-500" />
                  File Allegati
                </h4>

                {/* Recording button */}
                {isRecording ? (
                  <button
                    onClick={stopRecording}
                    className="w-full mb-3 py-4 bg-red-500 text-white rounded-xl font-medium flex items-center justify-center gap-3 animate-pulse"
                  >
                    <StopCircle size={22} />
                    <span>Ferma Registrazione</span>
                    <span className="bg-white/20 px-2 py-1 rounded-lg text-sm font-mono">
                      {formatRecordingTime(recordingTime)}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="w-full mb-3 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <Circle size={18} className="fill-current" />
                    Registra Nota Audio
                  </button>
                )}

                {/* Upload button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,audio/*,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mb-3 py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Carica file (PDF, Audio, Immagini)
                </button>
                <p className="text-xs text-gray-400 text-center mb-3">Max 10MB per file</p>

                {/* Lista files */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(detailExaminer.files || []).length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-4">Nessun file</p>
                  ) : (
                    [...(detailExaminer.files || [])].reverse().map(file => (
                      <div key={file.id} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                            onClick={() => handleOpenFile(file)}
                          >
                            {getFileIcon(file.type)}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
                              <p className="text-xs text-gray-400">{formatDate(file.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleShareFile(file)}
                              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Condividi"
                            >
                              <Share2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDownloadFile(file)}
                              className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                              title="Scarica"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Elimina"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Preview per immagini */}
                        {file.type === 'image' && (
                          <img
                            src={file.data}
                            alt={file.name}
                            className="mt-2 rounded-lg max-h-32 w-full object-cover cursor-pointer"
                            onClick={() => handleOpenFile(file)}
                          />
                        )}

                        {/* Player per audio */}
                        {file.type === 'audio' && (
                          <audio
                            src={file.data}
                            controls
                            className="mt-2 w-full h-10"
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal visualizzazione nota completa */}
      {viewingNote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StickyNote size={20} />
                  <h3 className="text-lg font-bold">Nota</h3>
                </div>
                <button
                  onClick={() => setViewingNote(null)}
                  className="p-1 hover:bg-white/10 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-blue-200 mt-1">{formatDate(viewingNote.createdAt)}</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
                {viewingNote.text}
              </p>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => {
                  handleDeleteNote(viewingNote.id);
                  setViewingNote(null);
                }}
                className="flex-1 py-3 text-red-500 hover:bg-red-50 font-medium transition-colors rounded-xl flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Elimina
              </button>
              <button
                onClick={() => setViewingNote(null)}
                className="flex-1 py-3 bg-blue-500 text-white hover:bg-blue-600 font-medium transition-colors rounded-xl"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExaminerManager;
