export interface OnboardingStepConfig {
  id: string;
  title: string;
  content: string;
  illustration?: 'welcome' | 'calendar' | 'limit' | 'turn' | 'examiner' | 'students' | 'booking' | 'exam-day' | 'stats' | 'notifications' | 'complete' | 'whatsapp' | 'backup' | 'summary';
}

export const onboardingSteps: OnboardingStepConfig[] = [
  // STEP 1: Welcome
  {
    id: 'welcome',
    title: 'Prenota Esami Guida',
    content: 'La tua app per gestire gli esami di guida in modo semplice, veloce e professionale.\n\n✓ Importa allievi dalla rubrica\n✓ Prenota con un tap\n✓ Invia tutto via WhatsApp\n✓ Statistiche in tempo reale',
    illustration: 'welcome'
  },

  // STEP 2: Lista Allievi (il più importante)
  {
    id: 'lista-allievi',
    title: 'Lista Allievi 💚',
    content: 'Il pulsante verde è il cuore dell\'app!\n\n📱 IMPORTA dalla rubrica del telefono\n📄 IMPORTA da file vCard (.vcf)\n✏️ AGGIUNGI singoli allievi manualmente\n📅 PRENOTA su date disponibili con un tap\n\nGli allievi importati mantengono il numero di telefono per contattarli facilmente.',
    illustration: 'students'
  },

  // STEP 3: Prenotazione rapida
  {
    id: 'prenotazione',
    title: 'Prenotare un Allievo 📅',
    content: 'Dalla Lista Allievi, per ogni allievo vedrai il pulsante "Prenota".\n\n1️⃣ Clicca "Prenota"\n2️⃣ Scegli la data dall\'elenco\n3️⃣ Fatto! L\'allievo è prenotato\n\n⚠️ Chi ha 3 bocciature deve attendere 1 mese prima di ripresentarsi (foglio rosa scaduto).',
    illustration: 'booking'
  },

  // STEP 4: Invia in Ufficio (WhatsApp)
  {
    id: 'whatsapp',
    title: 'Invia in Ufficio 📱',
    content: 'Il pulsante verde WhatsApp invia automaticamente la lista completa all\'ufficio.\n\nIl messaggio include:\n• 📅 Tutte le date degli esami futuri\n• ☀️🌙 Turno (mattina/pomeriggio)\n• 👤 Esaminatore assegnato\n• 👥 Lista allievi per ogni data\n\nNiente più trascrizioni manuali!',
    illustration: 'whatsapp'
  },

  // STEP 5: Riepilogo Prenotazioni
  {
    id: 'riepilogo',
    title: 'Riepilogo Prenotazioni 📋',
    content: 'Il pulsante blu mostra TUTTI gli allievi già prenotati.\n\nPer ogni sessione vedrai:\n• 📆 Data e turno dell\'esame\n• 👤 Esaminatore assegnato\n• 👥 Lista completa degli allievi\n• 📞 Numero di telefono (se disponibile)\n\nPerfetto per avere sempre il quadro completo!',
    illustration: 'summary'
  },

  // STEP 6: Calendario
  {
    id: 'calendar',
    title: 'Il Calendario 📆',
    content: 'Visualizza e gestisci le sessioni d\'esame mese per mese.\n\n🟢 Bordo VERDE = esami prenotati\n👆 Scorri tra i mesi con swipe o frecce\n📅 Clicca su un giorno per gestire la sessione\n\nDal calendario accedi a tutti i dettagli della giornata.',
    illustration: 'calendar'
  },

  // STEP 7: Limite Mensile
  {
    id: 'monthly-limit',
    title: 'Limite Sessioni Mensili 🔢',
    content: 'Imposta quante sessioni d\'esame vuoi per ogni mese.\n\nPuoi scegliere:\n• 2️⃣ sessioni\n• 3️⃣ sessioni\n• 4️⃣ sessioni\n\nQuando raggiungi il limite, le altre date si disattivano automaticamente per evitare overbooking.',
    illustration: 'limit'
  },

  // STEP 8: Dettagli Sessione
  {
    id: 'session-details',
    title: 'Dettagli Sessione 📝',
    content: 'Cliccando su una data nel calendario puoi configurare:\n\n☀️🌙 TURNO - Mattina o Pomeriggio\n👤 ESAMINATORE - Chi esamina quel giorno\n👥 ALLIEVI - Fino a 7 per sessione\n\nPuoi spostare o eliminare intere sessioni con i pulsanti in alto.',
    illustration: 'turn'
  },

  // STEP 9: Esaminatore
  {
    id: 'examiner',
    title: 'Gestione Esaminatori 👤',
    content: 'Tieni traccia di chi esamina i tuoi allievi!\n\n➕ Aggiungi esaminatori dalla sezione "Gestisci"\n✅ Assegna un esaminatore a ogni sessione\n📊 Le statistiche mostrano quante sessioni fa ciascuno\n\nUtile per garantire una rotazione equa!',
    illustration: 'examiner'
  },

  // STEP 10: Modalità Esame
  {
    id: 'exam-day',
    title: 'Modalità Giorno Esame ⚡',
    content: 'Quando c\'è un esame OGGI, appare il pulsante rosso!\n\nSchermo ottimizzato per uso rapido:\n✅ PROMOSSO - L\'allievo passa\n❌ BOCCIATO - Riprogramma automatico (+1 mese)\n⊘ ASSENTE - Riprogramma senza contare bocciatura\n\n3 bocciature = foglio rosa scaduto → lista d\'attesa.',
    illustration: 'exam-day'
  },

  // STEP 11: Statistiche
  {
    id: 'stats',
    title: 'Statistiche 📊',
    content: 'Monitora le performance della tua autoscuola!\n\n📈 Percentuale promozioni/bocciature\n📉 Grafico trend ultimi 6 mesi\n🏆 Classifica esaminatori per anno\n👥 Totale allievi gestiti\n\nDati utili per migliorare continuamente.',
    illustration: 'stats'
  },

  // STEP 12: Backup
  {
    id: 'backup',
    title: 'Backup e Sicurezza 💾',
    content: 'Non perdere mai i tuoi dati!\n\n💾 Download locale del file JSON\n☁️ Salvataggio su Google Drive\n🔄 Backup automatico ogni 7 giorni\n📥 Importa da file precedente\n\n⏰ L\'app ti avvisa quando è ora di fare backup!',
    illustration: 'backup'
  },

  // STEP 13: Notifiche
  {
    id: 'notifications',
    title: 'Notifiche Push 🔔',
    content: 'Ricevi promemoria automatici sugli esami!\n\n🔔 Attiva le notifiche dal pulsante campanella\n📱 Funzionano anche su iPhone (installa come app)\n📅 Promemoria il giorno prima dell\'esame\n\n💡 Su iPhone: usa "Aggiungi a Home" da Safari.',
    illustration: 'notifications'
  },

  // STEP 14: Help
  {
    id: 'help',
    title: 'Rivedi il Tutorial ❓',
    content: 'Hai bisogno di rivedere questa guida?\n\nClicca il pulsante ❓ nell\'header in alto a destra per riavviare il tutorial in qualsiasi momento.\n\n💾 I tuoi dati rimangono sempre salvati sul dispositivo.',
    illustration: 'complete'
  },

  // STEP 15: Complete
  {
    id: 'complete',
    title: 'Sei Pronto! 🎉',
    content: 'Complimenti! Ora conosci tutte le funzionalità.\n\n📝 Ricorda:\n• Lista Allievi per importare e prenotare\n• Calendario per gestire le sessioni\n• Modalità Esame il giorno degli esami\n• Backup regolari per sicurezza\n\nIn bocca al lupo con i tuoi allievi! 🍀',
    illustration: 'complete'
  }
];

export const TOTAL_STEPS = onboardingSteps.length;
