# 🚗 Gestione Esami di Guida - ABA Autoscuole

> *Quando Excel ti abbandona e il calendario cartaceo prende fuoco, arriva questa webapp*

## Di cosa stiamo parlando?

Un'applicazione web che trasforma il caos della pianificazione esami di guida in qualcosa di gestibile. Niente fronzoli, niente abbonamenti cloud da 99€/mese, solo JavaScript puro che salva tutto nel browser. 

**Il problema reale:** La Motorizzazione ti comunica i giorni d'esame con la stessa prevedibilità di un gatto che decide dove dormire. Un mese hai esami il martedì e giovedì, quello dopo lunedì e venerdì, poi ti chiamano per un sabato random.

**La soluzione:** Un calendario dove configuri SOLO i giorni reali d'esame. Il resto non esiste. Punto.

## 💝 La storia dietro il codice

Quest'app nasce con una dedica speciale ad Andrea, perché gestire gli esami di guida non dovrebbe richiedere una laurea in ingegneria aerospaziale. È un software "artigianale italiano" - nel senso che è fatto con cura, funziona e non ti chiede di vendere un rene per usarlo.

## 🎯 Features che contano davvero

### Quello che FA
- **Calendario configurabile**: Imposti solo i giorni che la Motorizzazione ti assegna
- **Massimo 6 allievi per sessione**: Il limite reale, non uno inventato
- **Drag & drop degli allievi**: Sposti la gente da una data all'altra senza impazzire
- **Report WhatsApp diretto**: Un click e mandi tutto in ufficio (con il vero logo WhatsApp, non l'emoji del telefono)
- **Salvataggio locale**: I tuoi dati rimangono nel TUO browser

### Quello che NON FA (e ne siamo fieri)
- Non richiede registrazione
- Non vende i tuoi dati a Facebook
- Non ti manda email promozionali
- Non richiede connessione internet (dopo il primo caricamento)
- Non costa nulla

## 🔧 Setup tecnico (per chi vuole sporcarsi le mani)

### Opzione 1: La via del pigro intelligente
1. Scarica il file HTML
2. Aprilo nel browser
3. Fine

```bash
# Davvero, è così semplice
git clone https://github.com/tuousername/gestione-esami-guida.git
cd gestione-esami-guida
# Doppio click su gestione_esami_guida.html
# O se sei un nerd da terminale:
open gestione_esami_guida.html  # Mac
xdg-open gestione_esami_guida.html  # Linux
start gestione_esami_guida.html  # Windows
```

### Opzione 2: Per chi vuole fare il fenomeno
Mettilo su un server web qualsiasi. Apache, Nginx, Python SimpleHTTPServer, anche il server Node che hai installato per quel progetto del 2019 che non hai mai finito.

```bash
# Server Python instant (perché ce l'hanno tutti)
python3 -m http.server 8000
# Vai su http://localhost:8000/gestione_esami_guida.html
```

## 📱 Come si usa (guida per umani)

### Configurazione iniziale (30 secondi)
1. Clicca il bottone rosso **"GIORNI ESAMI GUIDA"** (impossibile non vederlo, è ROSSO e GROSSO)
2. Seleziona le date che ti ha dato la Motorizzazione
3. Chiudi il popup

### Uso quotidiano (ancora più veloce)
1. Clicca su un giorno disponibile
2. Scrivi il nome dell'allievo
3. Premi Invio
4. Ripeti fino a 6 allievi

### Invio report
1. Clicca il bottone verde WhatsApp **"INVIA IN UFFICIO"**
2. Si apre WhatsApp con il messaggio già pronto
3. Premi invio in WhatsApp
4. Vai a prenderti un caffè, hai finito

## 🎨 Personalizzazione

Il codice è tutto in un singolo file HTML. Vuoi cambiare qualcosa?

```javascript
// Vuoi 8 allievi invece di 6? Cerca questa riga:
if (students[dateStr].length >= 6) {
// Cambiala in:
if (students[dateStr].length >= 8) {

// Vuoi cambiare il numero WhatsApp? Cerca:
const phoneNumber = '390424523690';
// Metti il tuo numero (senza il +)
```

## ⚠️ Avvertenze importanti

1. **I dati sono salvati nel browser**: Se pulisci la cache, perdi tutto. Fai screenshot del calendario prima di fare pulizie drastiche.

2. **Un browser, un database**: Se usi Chrome al lavoro e Firefox a casa, avrai due calendari diversi. Non è un bug, è così che funziona localStorage.

3. **Il pulsante rosso è rosso apposta**: Se qualcuno si lamenta che è troppo evidente, è perché non ha mai dimenticato di configurare i giorni d'esame alle 11 di sera.

## 🐛 Bug noti (ops, "feature non documentate")

- Se clicchi 100 volte al secondo sul calendario, potrebbe succedere qualcosa di strano. Soluzione: non farlo.
- Su Internet Explorer 6 non funziona. Soluzione: è il 2025, seriously?
- Se hai più di 1000 allievi in un giorno... hai altri problemi da risolvere.

## 🤝 Contribuzioni

Hai un'idea per migliorare l'app? 

**DO:**
- Fork
- Migliora
- Pull Request
- Spiegami cosa hai fatto (in italiano, grazie)

**DON'T:**
- Non aggiungere framework da 200MB per animare un bottone
- Non trasformarlo in una blockchain
- Non aggiungere pubblicità

## 📜 Licenza

MIT License - che tradotto significa: fai quello che vuoi, ma se vendi questo software a qualche autoscuola per 5000€, almeno offrimi una birra.

## 🙏 Ringraziamenti

- **Andrea**: Per l'ispirazione e per sopportare le sessioni d'esame
- **Caffè**: Per esistere
- **Stack Overflow**: Per le risposte alle 2 di notte
- **CTRL+Z**: MVP del development
- **La Motorizzazione**: Per rendere tutto così complicato da richiedere un'app

## 📞 Supporto

Hai problemi? Ecco le opzioni in ordine di probabilità di successo:

1. Ricarica la pagina
2. Prova con Chrome/Firefox/Safari (non Edge, dai)
3. Chiedi ad Andrea
4. Apri una Issue su GitHub spiegando cosa hai fatto per romperlo
5. Contempla l'esistenza mentre fissi il calendario

---

### 🎬 Note finali

Questo software è stato testato in condizioni estreme:
- Con il capo che urla di sbrigarsi
- Alle 23:47 del giorno prima degli esami  
- Con 17 schede browser aperte
- Dopo 4 caffè
- Durante una call su Teams con la connessione che va e viene

Se funziona in queste condizioni, funzionerà anche per te.

**Remember**: *Il vero esame non è la guida, è far quadrare il calendario degli esami.*

---

*P.S. Se stai leggendo fino a qui, probabilmente sei un developer. In tal caso: sì, tutto il CSS è inline, sì, non c'è un build process, sì, jQuery non serve. E sai cosa? Funziona benissimo così. A volte la semplicità vince.*
