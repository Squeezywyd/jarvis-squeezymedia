const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const OLLAMA_URL = 'http://localhost:11434/api/chat';
const MODEL = 'llama3.1:8b';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Default data structures ────────────────────────────────────────────────

const DEFAULTS = {
  'clients.json': [],
  'projects.json': [],
  'content.json': [],
  'gear-log.json': [],
  'brand.json': {
    instagram_bio: "Premium automotive videography based in Aargau, Switzerland 🇨🇭 | Every car has a story. This is how we tell it. | Sony A7C | DJI RSC2",
    tiktok_bio: "Swiss automotive filmmaker 🎬 | Built to move. Filmed to last. | SqueezyMedia",
    linkedin_bio: "Founder of SqueezyMedia — premium automotive videography. Based in Aargau, Switzerland. Specialising in cinematic content for private owners, dealerships, events and automotive brands.",
    website_bio: "SqueezyMedia is a premium automotive videography studio based in Aargau, Switzerland. We craft cinematic stories for private car owners, dealerships, events, and automotive brands. Swiss precision. Automotive passion.",
    content_pillars: [
      "Behind the Scenes",
      "Final Edits / Showreels",
      "Car Spotlight",
      "Tips & Technique",
      "Business Journey"
    ],
    brand_voice_notes: "Premium, cinematic, passionate about cars. First-person storytelling. Technical but accessible. Signature phrases: 'Every car has a story. This is how we tell it.' / 'Built to move. Filmed to last.' / 'Swiss precision. Automotive passion.'"
  },
  'growth.json': []
};

// ─── Data helpers ────────────────────────────────────────────────────────────

function initDataFiles() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  for (const [filename, defaultData] of Object.entries(DEFAULTS)) {
    const filepath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, JSON.stringify(defaultData, null, 2));
    }
  }
}

function readData(filename) {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, filename), 'utf8'));
}

function writeData(filename, data) {
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

// ─── Stats ───────────────────────────────────────────────────────────────────

app.get('/api/stats', (req, res) => {
  try {
    const projects = readData('projects.json');
    const clients = readData('clients.json');
    const content = readData('content.json');
    const now = new Date();

    const activeProjects = projects.filter(p =>
      !['Delivered', 'Invoiced', 'Paid'].includes(p.status)
    );

    const pendingContent = content.filter(c =>
      ['idea', 'drafted', 'scheduled'].includes(c.status)
    );

    const thisMonthRevenue = projects
      .filter(p => {
        const d = new Date(p.created_date || 0);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          && ['Invoiced', 'Paid'].includes(p.status);
      })
      .reduce((sum, p) => sum + (Number(p.rate) || 0), 0);

    const upcomingDeadlines = projects
      .filter(p => p.shoot_date && new Date(p.shoot_date) >= now)
      .sort((a, b) => new Date(a.shoot_date) - new Date(b.shoot_date))
      .slice(0, 3);

    const todayContent = content.filter(c => {
      if (!c.scheduled_date) return false;
      return new Date(c.scheduled_date).toDateString() === now.toDateString();
    });

    const pendingTasks = activeProjects.length;

    res.json({
      activeProjects: activeProjects.length,
      totalClients: clients.length,
      pendingContent: pendingContent.length,
      revenueThisMonth: thisMonthRevenue,
      upcomingDeadlines,
      todayContent: todayContent.length,
      pendingTasks,
      nextDeadline: upcomingDeadlines[0] || null,
      recentClients: clients.slice(-3)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Clients ─────────────────────────────────────────────────────────────────

app.get('/api/clients', (req, res) => res.json(readData('clients.json')));

app.post('/api/clients', (req, res) => {
  const clients = readData('clients.json');
  const client = { ...req.body, id: uuidv4(), created_date: new Date().toISOString(), project_history: [] };
  clients.push(client);
  writeData('clients.json', clients);
  res.json(client);
});

app.put('/api/clients/:id', (req, res) => {
  const clients = readData('clients.json');
  const idx = clients.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  clients[idx] = { ...clients[idx], ...req.body };
  writeData('clients.json', clients);
  res.json(clients[idx]);
});

app.delete('/api/clients/:id', (req, res) => {
  writeData('clients.json', readData('clients.json').filter(c => c.id !== req.params.id));
  res.json({ success: true });
});

// ─── Projects ────────────────────────────────────────────────────────────────

app.get('/api/projects', (req, res) => res.json(readData('projects.json')));

app.post('/api/projects', (req, res) => {
  const projects = readData('projects.json');
  const project = {
    ...req.body,
    id: uuidv4(),
    created_date: new Date().toISOString(),
    status: req.body.status || 'Enquiry'
  };
  projects.push(project);
  writeData('projects.json', projects);

  // Link project to client
  if (project.client_id) {
    const clients = readData('clients.json');
    const ci = clients.findIndex(c => c.id === project.client_id);
    if (ci !== -1) {
      if (!clients[ci].project_history) clients[ci].project_history = [];
      clients[ci].project_history.push(project.id);
      writeData('clients.json', clients);
    }
  }

  res.json(project);
});

app.put('/api/projects/:id', (req, res) => {
  const projects = readData('projects.json');
  const idx = projects.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  projects[idx] = { ...projects[idx], ...req.body };
  writeData('projects.json', projects);
  res.json(projects[idx]);
});

app.delete('/api/projects/:id', (req, res) => {
  writeData('projects.json', readData('projects.json').filter(p => p.id !== req.params.id));
  res.json({ success: true });
});

// ─── Content ─────────────────────────────────────────────────────────────────

app.get('/api/content', (req, res) => res.json(readData('content.json')));

app.post('/api/content', (req, res) => {
  const content = readData('content.json');
  const item = { ...req.body, id: uuidv4(), created_date: new Date().toISOString() };
  content.push(item);
  writeData('content.json', content);
  res.json(item);
});

app.put('/api/content/:id', (req, res) => {
  const content = readData('content.json');
  const idx = content.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  content[idx] = { ...content[idx], ...req.body };
  writeData('content.json', content);
  res.json(content[idx]);
});

app.delete('/api/content/:id', (req, res) => {
  writeData('content.json', readData('content.json').filter(c => c.id !== req.params.id));
  res.json({ success: true });
});

// ─── Gear Log ────────────────────────────────────────────────────────────────

app.get('/api/gear-log', (req, res) => res.json(readData('gear-log.json')));

app.post('/api/gear-log', (req, res) => {
  const log = readData('gear-log.json');
  const entry = { ...req.body, id: uuidv4() };
  log.push(entry);
  writeData('gear-log.json', log);
  res.json(entry);
});

app.put('/api/gear-log/:id', (req, res) => {
  const log = readData('gear-log.json');
  const idx = log.findIndex(e => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  log[idx] = { ...log[idx], ...req.body };
  writeData('gear-log.json', log);
  res.json(log[idx]);
});

app.delete('/api/gear-log/:id', (req, res) => {
  writeData('gear-log.json', readData('gear-log.json').filter(e => e.id !== req.params.id));
  res.json({ success: true });
});

// ─── Brand ───────────────────────────────────────────────────────────────────

app.get('/api/brand', (req, res) => res.json(readData('brand.json')));

app.put('/api/brand', (req, res) => {
  writeData('brand.json', req.body);
  res.json(req.body);
});

// ─── Growth ──────────────────────────────────────────────────────────────────

app.get('/api/growth', (req, res) => res.json(readData('growth.json')));

app.post('/api/growth', (req, res) => {
  const growth = readData('growth.json');
  const entry = { ...req.body, id: uuidv4() };
  growth.push(entry);
  writeData('growth.json', growth);
  res.json(entry);
});

app.delete('/api/growth/:id', (req, res) => {
  writeData('growth.json', readData('growth.json').filter(e => e.id !== req.params.id));
  res.json({ success: true });
});

// ─── AI Chat ─────────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const { messages, context } = req.body;

  const now = new Date();
  const systemPrompt = `You are JARVIS, the AI assistant for SqueezyMedia — a premium automotive videography business based in Switzerland, Aargau. You assist the owner, who you always address as "Squeezy", with all aspects of their business and personal brand.

Business context:
- Gear: Sony A7C, Sigma 16mm f/1.4, DJI RSC2 gimbal
- Niche: Automotive videography — private owners, dealerships, events, brands
- Brand voice: Premium, cinematic, passionate, first-person storytelling
- Location: Switzerland (Aargau)
- Currency: CHF
- Packages range from CHF 300 (Inventory Starter) to CHF 3,500 (Campaign Package)
- Signature phrases: "Every car has a story. This is how we tell it." / "Built to move. Filmed to last." / "Swiss precision. Automotive passion."

Your personality:
- British, calm, slightly dry wit
- Always professional and precise
- Proactive — suggest next actions unprompted
- Address the owner as "Squeezy" always — never "Boss", never their real name
- Keep responses concise for voice output but detailed when specifically asked
- Occasionally make subtle car-related references or analogies
- Never break character

Current business state:
${JSON.stringify(context || {}, null, 2)}

Current date/time: ${now.toLocaleString('en-GB', { timeZone: 'Europe/Zurich' })}`;

  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'system', content: systemPrompt }, ...(messages || [])],
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama HTTP ${response.status}`);
    }

    const data = await response.json();
    res.json({ reply: data.message.content });
  } catch (err) {
    console.error('[JARVIS] Ollama error:', err.message);
    res.status(503).json({
      error: "I'm having trouble reaching my local systems, Squeezy. Please make sure Ollama is running.",
      ollamaDown: true
    });
  }
});

// ─── Startup ──────────────────────────────────────────────────────────────────

initDataFiles();
app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log('  ║   JARVIS // SQUEEZYMEDIA SYSTEMS     ║');
  console.log('  ║   All systems operational             ║');
  console.log(`  ║   http://localhost:${PORT}               ║`);
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
});
