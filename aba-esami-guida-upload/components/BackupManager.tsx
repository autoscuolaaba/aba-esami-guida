import React, { useRef, useState, useEffect } from 'react';
import { Download, Upload, Cloud, ExternalLink, X, Database } from 'lucide-react';
import { SessionMap, WaitingStudent, Examiner } from '../types';

interface BackupData {
  sessions: SessionMap;
  waitingList: WaitingStudent[];
  examiners: Examiner[];
  version: number;
}

interface BackupManagerProps {
  sessions: SessionMap;
  examiners: Examiner[];
  onImport: (sessions: SessionMap) => void;
  onImportExaminers: (examiners: Examiner[]) => void;
}

const BackupManager: React.FC<BackupManagerProps> = ({ sessions, examiners, onImport, onImportExaminers }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showMenu, setShowMenu] = useState(false);

  // Track last backup date
  const [lastBackup, setLastBackup] = useState<string | null>(() => {
    return localStorage.getItem('lastBackupDate');
  });
  const [needsBackup, setNeedsBackup] = useState(false);
  const [showDriveModal, setShowDriveModal] = useState(false);

  // Check if reminder needed (every 7 days)
  useEffect(() => {
    if (!lastBackup) {
      setNeedsBackup(true);
      return;
    }

    const lastDate = new Date(lastBackup);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    setNeedsBackup(daysDiff >= 7);
  }, [lastBackup]);

  // Get waiting list from localStorage
  const getWaitingList = (): WaitingStudent[] => {
    const saved = localStorage.getItem('waitingList');
    return saved ? JSON.parse(saved) : [];
  };

  // Create full backup data
  const createBackupData = (): BackupData => ({
    sessions,
    waitingList: getWaitingList(),
    examiners,
    version: 3
  });

  const handleExport = () => {
    const backupData = createBackupData();
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `esami-guida-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    markBackupDone();
    setShowMenu(false);
  };

  const markBackupDone = () => {
    const now = new Date().toISOString();
    localStorage.setItem('lastBackupDate', now);
    setLastBackup(now);
    setNeedsBackup(false);
  };

  const handleDriveBackup = async () => {
    const backupData = createBackupData();
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const fileName = `esami-guida-backup-${new Date().toISOString().split('T')[0]}.json`;
    const file = new File([dataBlob], fileName, { type: 'application/json' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Backup Esami Guida',
          text: 'Salva questo file su Google Drive'
        });

        markBackupDone();
        setShowMenu(false);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          handleExportWithInstructions();
        }
      }
    } else {
      handleExportWithInstructions();
    }
  };

  const handleExportWithInstructions = () => {
    const backupData = createBackupData();
    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `esami-guida-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowMenu(false);
    setShowDriveModal(true);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        if (typeof parsed !== 'object') {
          throw new Error('Formato file non valido');
        }

        // Check format version
        let importedSessions: SessionMap;
        let importedWaitingList: WaitingStudent[] | null = null;
        let importedExaminers: Examiner[] | null = null;

        if (parsed.version >= 2 && parsed.sessions) {
          // New format with sessions, waitingList and optionally examiners
          importedSessions = parsed.sessions as SessionMap;
          importedWaitingList = parsed.waitingList as WaitingStudent[] || [];

          // Version 3 includes examiners
          if (parsed.version >= 3 && parsed.examiners) {
            importedExaminers = parsed.examiners as Examiner[];
          }
        } else {
          // Old format (just sessions)
          importedSessions = parsed as SessionMap;
        }

        const hasExistingData = Object.keys(sessions).length > 0 || getWaitingList().length > 0 || examiners.length > 0;
        if (hasExistingData) {
          const confirmed = window.confirm(
            'Attenzione: Importando questo backup, tutti i dati attuali verranno sostituiti. Continuare?'
          );
          if (!confirmed) return;
        }

        // Import sessions
        onImport(importedSessions);

        // Import waiting list if present
        if (importedWaitingList !== null) {
          localStorage.setItem('waitingList', JSON.stringify(importedWaitingList));
          // Trigger reload to update WaitingList component
          window.dispatchEvent(new Event('storage'));
        }

        // Import examiners if present
        if (importedExaminers !== null) {
          onImportExaminers(importedExaminers);
        }

        // Build success message
        let successMsg = 'Backup importato con successo!';
        const details = [];
        if (importedWaitingList) details.push(`${importedWaitingList.length} in lista d'attesa`);
        if (importedExaminers) details.push(`${importedExaminers.length} esaminatori`);
        if (details.length > 0) successMsg += ` (${details.join(', ')})`;

        alert(successMsg);
        setShowMenu(false);
      } catch (error) {
        alert('Errore durante l\'importazione del backup. Assicurati che il file sia valido.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const formatLastBackup = () => {
    if (!lastBackup) return 'Mai';
    return new Date(lastBackup).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short'
    });
  };

  return (
    <>
      {/* Compact Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
          needsBackup
            ? 'bg-amber-500 hover:bg-amber-600'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
        title="Backup"
      >
        <Database size={16} className="text-white" />
        {needsBackup && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        )}
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-[45]"
            onClick={() => setShowMenu(false)}
            onTouchEnd={(e) => { e.preventDefault(); setShowMenu(false); }}
          />

          <div className="absolute top-12 right-0 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 w-56 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
              <span className="text-sm font-bold text-gray-700">Backup</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{formatLastBackup()}</span>
                <button
                  onClick={() => setShowMenu(false)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Warning if needed */}
            {needsBackup && (
              <div className="mb-2 p-2 bg-amber-50 rounded-lg">
                <p className="text-xs text-amber-700 font-medium">
                  {lastBackup ? 'Backup scaduto!' : 'Mai fatto un backup'}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-1">
              <button
                onClick={handleExport}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-green-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <Download size={16} className="text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Download</span>
              </button>

              <button
                onClick={handleDriveBackup}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Cloud size={16} className="text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Cloud</span>
              </button>

              <button
                onClick={handleImportClick}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-purple-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Upload size={16} className="text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Importa</span>
              </button>
            </div>
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleImport}
        className="hidden"
      />

      {/* Google Drive Instructions Modal */}
      {showDriveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Cloud size={24} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Salva su Google Drive</h3>
              </div>
              <button
                onClick={() => setShowDriveModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <p>Il file è stato scaricato. Per salvarlo su Google Drive:</p>

              <ol className="space-y-2 list-decimal list-inside">
                <li>Apri <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Google Drive</a></li>
                <li>Clicca su "Nuovo" → "Caricamento file"</li>
                <li>Seleziona il file appena scaricato</li>
                <li>Fatto! Il backup è al sicuro</li>
              </ol>
            </div>

            <div className="flex gap-2">
              <a
                href="https://drive.google.com/drive/my-drive"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-semibold text-center hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
              >
                <ExternalLink size={18} />
                Apri Drive
              </a>
              <button
                onClick={() => {
                  setShowDriveModal(false);
                  markBackupDone();
                }}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-all"
              >
                Fatto
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BackupManager;
