export interface OnboardingStepConfig {
  id: string;
  title: string;
  content: string;
  highlightTarget?: string; // CSS selector or component ID
  requiresInteraction?: boolean;
  interactionType?: 'click' | 'select' | 'open-modal' | 'any';
  interactionHint?: string;
  illustration?: 'welcome' | 'calendar' | 'limit' | 'turn' | 'examiner' | 'students' | 'booking' | 'exam-day' | 'stats' | 'notifications' | 'complete';
}

export const onboardingSteps: OnboardingStepConfig[] = [
  {
    id: 'welcome',
    title: 'Benvenuto in Esami di Guida! 🚗',
    content: 'Questa app ti aiuta a gestire le prenotazioni degli esami guida. Ti guideremo attraverso le funzionalità principali.',
    illustration: 'welcome'
  },
  {
    id: 'calendar',
    title: 'Il Calendario 📅',
    content: 'Il cuore dell\'app. Qui vedi le sessioni d\'esame programmate.\n\n• I giorni con bordo VERDE hanno esami prenotati\n• Puoi scorrere tra i mesi con swipe o frecce\n• Clicca su un giorno per gestire quella sessione',
    highlightTarget: '[data-onboarding="calendar"]',
    requiresInteraction: true,
    interactionType: 'click',
    interactionHint: 'Clicca su una data per continuare',
    illustration: 'calendar'
  },
  {
    id: 'monthly-limit',
    title: 'Gestisci le Sedute Mensili 📊',
    content: 'Imposta quante sessioni d\'esame vuoi per ogni mese (2, 3 o 4).\n\nQuando raggiungi il limite, le altre date si disattivano automaticamente.',
    highlightTarget: '[data-onboarding="monthly-limit"]',
    requiresInteraction: true,
    interactionType: 'select',
    interactionHint: 'Seleziona un numero (2, 3 o 4)',
    illustration: 'limit'
  },
  {
    id: 'turn-selector',
    title: 'Mattina o Pomeriggio? ☀️🌙',
    content: 'Per ogni giorno d\'esame, scegli il turno.\n\n• MATTINA: per esami della mattina ☀️\n• POMERIGGIO: per esami del pomeriggio 🌙',
    highlightTarget: '[data-onboarding="turn-selector"]',
    requiresInteraction: true,
    interactionType: 'select',
    interactionHint: 'Seleziona Mattina o Pomeriggio',
    illustration: 'turn'
  },
  {
    id: 'examiner',
    title: 'Assegna l\'Esaminatore 👤',
    content: 'Tieni traccia di chi esamina i tuoi allievi.\n\n• Aggiungi esaminatori dalla sezione "Gestisci"\n• Assegnali alle singole sessioni\n• Le statistiche tracciano quanti esami fa ciascuno',
    highlightTarget: '[data-onboarding="examiner"]',
    interactionHint: 'Puoi configurare gli esaminatori qui',
    illustration: 'examiner'
  },
  {
    id: 'waiting-list',
    title: 'La tua Lista Allievi 📋',
    content: 'Gestisci gli allievi da prenotare:\n\n• IMPORTA dalla rubrica del telefono\n• AGGIUNGI singolarmente con nome\n• PRENOTA su date disponibili con un tap\n• Chi ha 3 bocciature ha un periodo di attesa',
    highlightTarget: '[data-onboarding="waiting-list"]',
    requiresInteraction: true,
    interactionType: 'open-modal',
    interactionHint: 'Clicca su Lista Allievi per aprirla',
    illustration: 'students'
  },
  {
    id: 'student-manager',
    title: 'Prenota gli Allievi 👥',
    content: 'Dalla Lista Allievi, clicca "Prenota" per assegnare un allievo a una data.\n\nNella sezione allievi di ogni data puoi:\n• Aggiungere manualmente\n• Vedere il numero di telefono\n• Gestire lo stato dell\'esame',
    highlightTarget: '[data-onboarding="student-manager"]',
    illustration: 'booking'
  },
  {
    id: 'exam-day',
    title: 'È il Giorno dell\'Esame! ⚡',
    content: 'Quando c\'è un esame OGGI, appare il pulsante rosso "MODALITÀ ESAME".\n\n• Schermo ottimizzato per uso rapido\n• Per ogni allievo: PROMOSSO ✓ / BOCCIATO ✗ / ASSENTE ⊘\n• I bocciati vengono riprogrammati automaticamente (+1 mese)\n• 3 bocciature = foglio rosa scaduto',
    illustration: 'exam-day'
  },
  {
    id: 'stats-backup',
    title: 'Statistiche e Sicurezza 📊💾',
    content: 'STATISTICHE:\n• Percentuale promozioni/bocciature\n• Trend ultimi 6 mesi con grafico\n• Classifica esaminatori per anno\n\nBACKUP:\n• Download locale o Google Drive\n• Reminder automatico ogni 7 giorni',
    highlightTarget: '[data-onboarding="utility-buttons"]',
    illustration: 'stats'
  },
  {
    id: 'notifications',
    title: 'Resta Sempre Aggiornato 🔔📱',
    content: 'NOTIFICHE:\n• Attivale per ricevere promemoria sugli esami\n• Funzionano anche su iPhone (installa come app)\n\nWHATSAPP:\n• Invia la lista allievi prenotati direttamente\n• Contatta singoli allievi per conferme',
    highlightTarget: '[data-onboarding="notifications"]',
    illustration: 'notifications'
  },
  {
    id: 'complete',
    title: 'Sei Pronto! 🎉',
    content: 'Ora conosci tutte le funzionalità.\n\nPuoi rivedere questo tutorial in qualsiasi momento cliccando sul pulsante "?" nell\'header.\n\nIn bocca al lupo con i tuoi allievi!',
    illustration: 'complete'
  }
];

export const TOTAL_STEPS = onboardingSteps.length;
