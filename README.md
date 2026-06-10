# JARVIS // SQUEEZYMEDIA SYSTEMS

Personal AI assistant for SqueezyMedia — premium automotive videography based in Aargau, Switzerland.

---

## Prerequisites

- **Node.js 18+** — [nodejs.org](https://nodejs.org)
- **Ollama** — local AI runtime

---

## 1. Install Ollama

**macOS / Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:** Download the installer from [ollama.com](https://ollama.com/download)

---

## 2. Pull the AI model

```bash
ollama pull llama3.1:8b
```

This downloads ~4.7GB. Only needed once.

---

## 3. Start Ollama

```bash
ollama serve
```

Keep this running in a terminal. Ollama must be running for JARVIS AI to work.

---

## 4. Install and run JARVIS

```bash
cd jarvis-squeezymedia
npm install
node server.js
```

---

## 5. Open JARVIS

```
http://localhost:3000
```

---

## Voice Control

| Action | How |
|--------|-----|
| Push-to-talk | Hold **SPACEBAR** (not in a text field) |
| On-screen mic | Hold the **SPEAK** button in the chat panel |
| Wake word | Say **"Hey Jarvis"** or **"Jarvis"** — activates automatically |
| Voice output | JARVIS speaks all responses, greetings, and errors automatically |

> Voice requires **Chrome or Edge**. Firefox does not support the Web Speech API.

---

## Modules

| Module | What it does |
|--------|-------------|
| **JARVIS AI** | Full conversational AI — voice + text chat |
| **Briefing** | Morning briefing with stats and a rotating automotive quote |
| **Clients** | Add, edit, delete clients — filter by type |
| **Projects** | Kanban board — drag cards across 7 status columns |
| **Content** | Calendar view, caption/hook generator, batch planner |
| **Brand** | Bio manager, content pillars, growth chart, story angles |
| **Editing** | Naming convention generator, delivery checklists, gear log |

---

## Customising Packages & Rates

Open `public/index.html` and search for `PACKAGES_DATA` — edit the package names and CHF rates there.

To update brand info, open the app → **Brand** module → edit bios and save directly in the UI.

---

## Troubleshooting

**JARVIS says "I'm having trouble reaching my local systems"**
→ Ollama is not running. Run `ollama serve` in a terminal.

**Voice input not working**
→ Use Chrome or Edge. Firefox does not support Web Speech API.
→ Allow microphone permissions when the browser prompts.

**Port 3000 already in use**
→ Change `const PORT = 3000` in `server.js` to another port (e.g. 3001).

**AI responses are slow**
→ `llama3.1:8b` requires ~8GB RAM. Close other heavy applications.
→ For faster responses try: `ollama pull llama3.2:3b` and update `MODEL` in `server.js`.

---

## Data Storage

All data is stored locally in the `data/` directory as JSON files. No cloud, no external APIs, no accounts required.

```
data/
├── clients.json
├── projects.json
├── content.json
├── gear-log.json
├── brand.json
└── growth.json
```

Back these up regularly — they are your business database.

---

## Tech Stack

- **Frontend:** Single HTML file — HTML + CSS + Vanilla JS
- **Backend:** Node.js + Express
- **AI:** Ollama (local) with llama3.1:8b
- **Voice:** Web Speech API (browser-native, no API key)
- **Storage:** Local JSON files

100% offline capable once Ollama and the model are installed.
