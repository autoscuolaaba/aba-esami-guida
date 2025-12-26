import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellOff, BellRing, Smartphone, X } from 'lucide-react';
import { SessionMap, ExamSession } from '../types';
import { formatDateIT, getDateKey } from '../utils';

interface NotificationManagerProps {
  sessions: SessionMap;
}

const NotificationManager: React.FC<NotificationManagerProps> = ({ sessions }) => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Check if iOS and if running as PWA
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    setIsStandalone(window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true);
  }, []);

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          setSwRegistration(registration);
          console.log('Service Worker registrato');
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }, []);

  // Get future sessions
  const getFutureSessions = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (Object.entries(sessions) as [string, ExamSession][])
      .map(([key, session]) => {
        const [year, month, day] = key.split('-').map(Number);
        return {
          dateKey: key,
          date: new Date(year, month - 1, day),
          turn: session.turn,
          students: session.students,
        };
      })
      .filter((item) => {
        const hasContent = item.turn !== null || item.students.length > 0;
        return item.date >= today && hasContent;
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [sessions]);

  // Send notification helper with mobile support
  const sendNotification = useCallback((title: string, body: string, tag: string) => {
    if (permission !== 'granted') return;

    const options: NotificationOptions = {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag,
      vibrate: [200, 100, 200],
      requireInteraction: true,
      silent: false,
    };

    if (swRegistration) {
      swRegistration.showNotification(title, options);
    } else {
      new Notification(title, options);
    }
  }, [permission, swRegistration]);

  // Test notification
  const sendTestNotification = () => {
    if (permission !== 'granted') return;
    sendNotification(
      'Test Notifica',
      'Le notifiche di sistema funzionano correttamente!',
      'test-notification'
    );
    setShowMenu(false);
  };

  // Check and send automatic notifications for exams in the next 2 weeks
  const checkAndNotify = useCallback(() => {
    if (permission !== 'granted') return;

    const futureSessions = getFutureSessions();
    if (futureSessions.length === 0) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const notifiedExams: string[] = JSON.parse(localStorage.getItem('notified-exams') || '[]');

    futureSessions.forEach((session) => {
      const daysUntil = Math.ceil((session.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0 || daysUntil > 14) return;
      if (notifiedExams.includes(session.dateKey)) return;

      const turnStr = session.turn === 'MATTINA' ? 'Mattina' : session.turn === 'POMERIGGIO' ? 'Pomeriggio' : 'turno da definire';
      const studentsCount = session.students.length;
      const studentNames = session.students.map(s => s.name).join(', ');

      let title = '';
      let body = '';

      if (daysUntil === 0) {
        title = 'ESAME OGGI!';
        body = `${turnStr} - ${studentsCount} allievi:\n${studentNames || 'Nessun allievo'}`;
      } else if (daysUntil === 1) {
        title = 'Esame Domani';
        body = `${formatDateIT(session.date)} (${turnStr})\n${studentsCount} allievi prenotati`;
      } else if (daysUntil <= 3) {
        title = `Esame tra ${daysUntil} giorni`;
        body = `${formatDateIT(session.date)} (${turnStr})\n${studentsCount} allievi prenotati`;
      } else if (daysUntil <= 7) {
        title = `Esame questa settimana`;
        body = `${formatDateIT(session.date)} (${turnStr})\n${studentsCount} allievi prenotati`;
      } else {
        title = `Esame tra ${daysUntil} giorni`;
        body = `${formatDateIT(session.date)} (${turnStr})\n${studentsCount} allievi prenotati`;
      }

      sendNotification(title, body, `exam-${session.dateKey}`);

      notifiedExams.push(session.dateKey);
      localStorage.setItem('notified-exams', JSON.stringify(notifiedExams));
    });

    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cleanedNotified = notifiedExams.filter(dateKey => {
      const [year, month, day] = dateKey.split('-').map(Number);
      const examDate = new Date(year, month - 1, day);
      return examDate >= thirtyDaysAgo;
    });
    localStorage.setItem('notified-exams', JSON.stringify(cleanedNotified));
  }, [permission, getFutureSessions, sendNotification]);

  useEffect(() => {
    checkAndNotify();
    const interval = setInterval(checkAndNotify, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkAndNotify]);

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') {
      alert('Il tuo browser non supporta le notifiche');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const getStatusIcon = () => {
    if (permission === 'granted') {
      return <Bell size={16} className="text-white" />;
    } else if (permission === 'denied') {
      return <BellOff size={16} className="text-white" />;
    }
    return <Bell size={16} className="text-white" />;
  };

  const getButtonColor = () => {
    if (permission === 'granted') return 'bg-green-500 hover:bg-green-600';
    if (permission === 'denied') return 'bg-red-400 hover:bg-red-500';
    return 'bg-gray-400 hover:bg-gray-500';
  };

  const needsPWAInstall = isIOS && !isStandalone;

  return (
    <>
      {/* Compact Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`w-9 h-9 rounded-xl ${getButtonColor()} flex items-center justify-center transition-all active:scale-95`}
        title="Notifiche"
      >
        {getStatusIcon()}
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[45]"
            onClick={() => setShowMenu(false)}
            onTouchEnd={(e) => { e.preventDefault(); setShowMenu(false); }}
          />

          {/* Menu */}
          <div className="absolute top-12 right-0 z-50 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 w-72 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Bell size={18} className={permission === 'granted' ? 'text-green-500' : 'text-gray-400'} />
                Notifiche
              </h3>
              <button
                onClick={() => setShowMenu(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Status */}
            <div className={`p-3 rounded-xl mb-3 ${
              permission === 'granted'
                ? 'bg-green-50 border border-green-200'
                : permission === 'denied'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-gray-50 border border-gray-200'
            }`}>
              <p className={`text-sm font-medium ${
                permission === 'granted'
                  ? 'text-green-700'
                  : permission === 'denied'
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}>
                {permission === 'granted'
                  ? 'Notifiche attive'
                  : permission === 'denied'
                    ? 'Notifiche bloccate'
                    : 'Notifiche disattivate'}
              </p>
              {permission === 'granted' && (
                <p className="text-xs text-green-600 mt-1">
                  Promemoria per esami nelle prossime 2 settimane
                </p>
              )}
              {permission === 'denied' && (
                <p className="text-xs text-red-500 mt-1">
                  Modificale dalle impostazioni del browser
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {permission === 'granted' && (
                <button
                  onClick={sendTestNotification}
                  className="w-full py-2.5 px-4 rounded-xl bg-green-100 text-green-700 font-medium text-sm hover:bg-green-200 transition-all flex items-center justify-center gap-2"
                >
                  <BellRing size={16} />
                  Invia notifica di test
                </button>
              )}

              {permission !== 'granted' && permission !== 'denied' && (
                <button
                  onClick={() => {
                    requestPermission();
                    setShowMenu(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-500 text-white font-medium text-sm hover:bg-blue-600 transition-all"
                >
                  Attiva notifiche
                </button>
              )}
            </div>

            {/* iOS PWA instructions */}
            {needsPWAInstall && permission !== 'granted' && (
              <div className="mt-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="flex items-start gap-2">
                  <Smartphone size={16} className="text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-blue-700">Per iPhone/iPad:</p>
                    <p className="text-[11px] text-blue-600 mt-1">
                      Tocca <b>Condividi</b> → <b>Aggiungi a Home</b> per ricevere notifiche.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default NotificationManager;
