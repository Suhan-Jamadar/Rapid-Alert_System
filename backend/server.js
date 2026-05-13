
// const express = require('express');
// const cors = require('cors');
// const fs = require('fs');
// const path = require('path');
// const { createServer } = require('http');
// const { Server } = require('socket.io');

// // Database file paths
// const DB_PATH = path.join(__dirname, 'data', 'db.json');
// const DB2_PATH = path.join(__dirname, 'data', 'db2.json');
// const DB3_PATH = path.join(__dirname, 'data', 'db3.json');
// const DB4_PATH = path.join(__dirname, 'data', 'db4.json'); // respond logins

// function loadData(dbPath) {
//   try {
//     const content = fs.readFileSync(dbPath, 'utf8');
//     return JSON.parse(content);
//   } catch (error) {
//     return {};
//   }
// }

// function saveData(dbPath, data) {
//   const dir = path.dirname(dbPath);
//   if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
//   fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
// }

// // Load all databases
// let db = loadData(DB_PATH) || { alerts: [], feed: [], logs: [], dispatches: [], responses: [], dispatchLogs: [] };
// let db2 = loadData(DB2_PATH) || { feedbackHistory: [], filteredSummary: { totalFiltered: 0, successfulFilter: 0 } };
// let db3 = loadData(DB3_PATH) || { processingLogs: [], logSummary: { totalProcessed: 0, successfulAlerts: 0, filteredOut: 0 } };
// let db4 = loadData(DB4_PATH) || { respondLogins: [] }; // ← NEW: login history

// const app = express();
// app.use(cors());
// app.use(express.json());

// const httpServer = createServer(app);
// const io = new Server(httpServer, {
//   cors: {
//     origin: ['http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:5173'],
//     methods: ['GET', 'POST'],
//     credentials: true
//   }
// });

// io.on('connection', (socket) => {
//   console.log('Client connected:', socket.id);
//   socket.on('disconnect', () => {
//     console.log('Client disconnected:', socket.id);
//   });
// });

// function replaceDataItem(collection, item, dbReference) {
//   const index = dbReference[collection].findIndex(doc => doc.id === item.id);
//   if (index >= 0) dbReference[collection][index] = item;
//   else dbReference[collection].unshift(item);
// }

// // =================== AUTH ===================

// const RESPOND_PASSWORD = 'respond123';

// app.post('/api/login', (req, res) => {
//   const { password } = req.body;
//   if (!password) {
//     return res.status(400).json({ success: false, message: 'Password required' });
//   }
//   if (password === RESPOND_PASSWORD) {
//     // ── Log this login to db4 ──
//     const loginEntry = {
//       id: `login-${Date.now()}`,
//       timestamp: new Date().toISOString(),
//       ip: req.ip || 'unknown',
//     };
//     if (!db4.respondLogins) db4.respondLogins = [];
//     db4.respondLogins.unshift(loginEntry);
//     saveData(DB4_PATH, db4);

//     // Print to terminal
//     console.log(`\n✅ RESPOND PAGE LOGIN`);
//     console.log(`   Time: ${new Date().toLocaleString()}`);
//     console.log(`   IP:   ${loginEntry.ip}`);
//     console.log(`   Total logins: ${db4.respondLogins.length}\n`);

//     return res.json({ success: true });
//   }
//   return res.status(401).json({ success: false, message: 'Wrong password' });
// });

// app.get('/api/login-history', (req, res) => {
//   res.json(db4.respondLogins || []);
// });

// // =================== DB1: MAIN ALERTS & FEED ===================

// app.get('/api/health', (req, res) => {
//   res.json({ status: 'ok', timestamp: new Date().toISOString() });
// });

// // ── PING endpoint: measures real HTTP round-trip to this server ──────────
// // Frontend sends { sentAt: Date.now() }, server echoes it back immediately.
// // Frontend calculates RTT = Date.now() - sentAt on response.
// app.post('/api/ping', (req, res) => {
//   res.json({ sentAt: req.body.sentAt, serverTime: Date.now() });
// });

// app.get('/api/alerts', (req, res) => {
//   res.json(db.alerts);
// });

// app.post('/api/alerts', (req, res) => {
//   const alert = { ...req.body, timestamp: new Date(req.body.timestamp).toISOString() };
//   replaceDataItem('alerts', alert, db);
//   saveData(DB_PATH, db);
//   console.log('EMITTING ALERT:', alert.id, alert.incidentType);
//   io.emit('new_alert', alert);
//   res.status(201).json(alert);
// });

// app.get('/api/feed', (req, res) => {
//   res.json(db.feed);
// });

// app.post('/api/feed', (req, res) => {
//   const feedItem = { ...req.body, timestamp: new Date(req.body.timestamp).toISOString() };
//   replaceDataItem('feed', feedItem, db);
//   saveData(DB_PATH, db);
//   console.log('EMITTING FEED:', feedItem.id);
//   io.emit('new_feed', feedItem);
//   res.status(201).json(feedItem);
// });

// // =================== DB2: FEEDBACK HISTORY ===================

// app.get('/api/feedback-history', (req, res) => {
//   res.json(db2.feedbackHistory || []);
// });

// app.post('/api/feedback-history', (req, res) => {
//   const feedback = {
//     ...req.body,
//     timestamp: new Date(req.body.timestamp).toISOString(),
//     type: 'random_tweet',
//     reason: 'Not disaster-related'
//   };
//   if (!db2.feedbackHistory) db2.feedbackHistory = [];
//   db2.feedbackHistory.unshift(feedback);
//   if (!db2.filteredSummary) db2.filteredSummary = { totalFiltered: 0, successfulFilter: 0, filterRate: '0%' };
//   db2.filteredSummary.totalFiltered = db2.feedbackHistory.length;
//   db2.filteredSummary.successfulFilter = db2.feedbackHistory.filter(f => f.edgeFilterResult).length;
//   db2.filteredSummary.filterRate = ((db2.filteredSummary.successfulFilter / db2.filteredSummary.totalFiltered) * 100).toFixed(1) + '%';
//   saveData(DB2_PATH, db2);
//   res.status(201).json(feedback);
// });

// app.get('/api/feedback-summary', (req, res) => {
//   res.json(db2.filteredSummary || { totalFiltered: 0, successfulFilter: 0, filterRate: '0%' });
// });

// // =================== DB3: PROCESSING LOGS ===================

// app.get('/api/logs', (req, res) => {
//   res.json(db3.processingLogs || []);
// });

// app.post('/api/logs', (req, res) => {
//   const log = { ...req.body, timestamp: new Date(req.body.timestamp).toISOString() };
//   if (!db3.processingLogs) db3.processingLogs = [];
//   db3.processingLogs.unshift(log);
//   if (!db3.logSummary) db3.logSummary = { totalProcessed: 0, successfulAlerts: 0, filteredOut: 0 };
//   if (log.stage === 'edge_filter' && log.result.includes('Filtered out')) {
//     db3.logSummary.filteredOut++;
//   } else if (log.stage === 'queue_distribution') {
//     db3.logSummary.successfulAlerts++;
//   }
//   db3.logSummary.totalProcessed = Math.ceil(db3.processingLogs.length / 4);
//   saveData(DB3_PATH, db3);
//   console.log('EMITTING PROCESSING UPDATE:', log.id, log.stage);
//   io.emit('processing_update', { log, summary: db3.logSummary });
//   res.status(201).json(log);
// });

// app.get('/api/logs-summary', (req, res) => {
//   res.json(db3.logSummary || { totalProcessed: 0, successfulAlerts: 0, filteredOut: 0 });
// });

// // =================== DISPATCHES ===================

// app.get('/api/dispatches', (req, res) => {
//   res.json(db.dispatches || []);
// });

// app.post('/api/dispatches', (req, res) => {
//   const dispatch = { ...req.body, timestamp: new Date(req.body.timestamp).toISOString() };
//   replaceDataItem('dispatches', dispatch, db);
//   saveData(DB_PATH, db);

//   // ── Push dispatch to responders via WebSocket ──
//   console.log('EMITTING DISPATCH:', dispatch.id);
//   io.emit('new_dispatch', dispatch);

//   res.status(201).json(dispatch);
// });

// // =================== TEAM RESPONSES ===================
// // Stored in db.dispatches as part of each dispatch

// app.post('/api/responses', (req, res) => {
//   const response = { ...req.body, timestamp: new Date(req.body.timestamp).toISOString() };

//   // Store responses array in db
//   if (!db.responses) db.responses = [];
//   const existingIdx = db.responses.findIndex(r =>
//     r.dispatchReportId === response.dispatchReportId && r.respondingRole === response.respondingRole
//   );
//   if (existingIdx >= 0) {
//     db.responses[existingIdx] = response; // update existing
//   } else {
//     db.responses.unshift(response); // new response
//   }
//   saveData(DB_PATH, db);

//   // ── Push response update to admin dashboard via WebSocket ──
//   console.log('EMITTING TEAM RESPONSE:', response.id, response.respondingRole, response.currentStatus);
//   io.emit('team_response_update', response);

//   res.status(201).json(response);
// });

// app.get('/api/responses', (req, res) => {
//   res.json(db.responses || []);
// });

// // =================== DISPATCH LOGS ===================

// app.get('/api/dispatch-logs', (req, res) => {
//   res.json(db.dispatchLogs || []);
// });

// app.post('/api/dispatch-logs', (req, res) => {
//   const log = { ...req.body, timestamp: new Date(req.body.timestamp).toISOString() };
//   if (!db.dispatchLogs) db.dispatchLogs = [];
//   db.dispatchLogs.unshift(log);
//   saveData(DB_PATH, db);
//   console.log('EMITTING DISPATCH LOG:', log.id, log.action);
//   io.emit('dispatch_log_update', log);
//   res.status(201).json(log);
// });

// // =================== RESET ===================

// app.post('/api/reset', (req, res) => {
//   db = { alerts: [], feed: [], logs: [], dispatches: [], responses: [], dispatchLogs: [] };
//   db2 = { feedbackHistory: [], filteredSummary: { totalFiltered: 0, successfulFilter: 0, filterRate: '0%' } };
//   db3 = { processingLogs: [], logSummary: { totalProcessed: 0, successfulAlerts: 0, filteredOut: 0 } };
//   db4 = { respondLogins: [] };
//   saveData(DB_PATH, db);
//   saveData(DB2_PATH, db2);
//   saveData(DB3_PATH, db3);
//   saveData(DB4_PATH, db4);
//   res.json({ status: 'reset' });
// });

// app.get('/api/status', (req, res) => {
//   res.json({
//     db1: { alerts: db.alerts?.length || 0, feed: db.feed?.length || 0 },
//     db2: { feedbackHistory: db2.feedbackHistory?.length || 0 },
//     db3: { logs: db3.processingLogs?.length || 0 },
//     db4: { respondLogins: db4.respondLogins?.length || 0 },
//   });
// });

// const PORT = process.env.PORT || 4000;
// httpServer.listen(PORT, () => {
//   console.log(`\n🚀 Backend API running on http://localhost:${PORT}`);
//   console.log(`⚡ Socket.IO enabled on ws://localhost:${PORT}`);
//   console.log(`📁 DB1 (Alerts/Feed):       ${DB_PATH}`);
//   console.log(`📁 DB2 (Feedback History):  ${DB2_PATH}`);
//   console.log(`📁 DB3 (Processing Logs):   ${DB3_PATH}`);
//   console.log(`📁 DB4 (Respond Logins):    ${DB4_PATH}\n`);
// });

const http_module = require('http');
const LSTM_API = 'http://localhost:5001';
let lstmAvailable = false;
function checkLSTM() {
  const req = http_module.get(LSTM_API + '/health', (res) => {
    lstmAvailable = res.statusCode === 200;
    if (lstmAvailable) console.log('🧠  LSTM API connected on :5001');
  });
  req.on('error', () => { lstmAvailable = false; });
  req.end();
}
setInterval(checkLSTM, 30000);

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Database file paths
const DB_PATH = path.join(__dirname, 'data', 'db.json');
const DB2_PATH = path.join(__dirname, 'data', 'db2.json');
const DB3_PATH = path.join(__dirname, 'data', 'db3.json');
const DB4_PATH = path.join(__dirname, 'data', 'db4.json'); // respond logins

function loadData(dbPath) {
  try {
    const content = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
}

function saveData(dbPath, data) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

// Load all databases
let db = loadData(DB_PATH) || { alerts: [], feed: [], logs: [], dispatches: [], responses: [], dispatchLogs: [] };
let db2 = loadData(DB2_PATH) || { feedbackHistory: [], filteredSummary: { totalFiltered: 0, successfulFilter: 0 } };
let db3 = loadData(DB3_PATH) || { processingLogs: [], logSummary: { totalProcessed: 0, successfulAlerts: 0, filteredOut: 0 } };
let db4 = loadData(DB4_PATH) || { respondLogins: [] }; // ← NEW: login history

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:8080', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

function replaceDataItem(collection, item, dbReference) {
  const index = dbReference[collection].findIndex(doc => doc.id === item.id);
  if (index >= 0) dbReference[collection][index] = item;
  else dbReference[collection].unshift(item);
}

// =================== AUTH ===================

const RESPOND_PASSWORD = 'respond123';

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password required' });
  }
  if (password === RESPOND_PASSWORD) {
    // ── Log this login to db4 ──
    const loginEntry = {
      id: `login-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ip: req.ip || 'unknown',
    };
    if (!db4.respondLogins) db4.respondLogins = [];
    db4.respondLogins.unshift(loginEntry);
    saveData(DB4_PATH, db4);

    // Print to terminal
    console.log(`\n✅ RESPOND PAGE LOGIN`);
    console.log(`   Time: ${new Date().toLocaleString()}`);
    console.log(`   IP:   ${loginEntry.ip}`);
    console.log(`   Total logins: ${db4.respondLogins.length}\n`);

    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, message: 'Wrong password' });
});

app.get('/api/login-history', (req, res) => {
  res.json(db4.respondLogins || []);
});

// =================== DB1: MAIN ALERTS & FEED ===================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── PING endpoint: measures real HTTP round-trip to this server ──────────
// Frontend sends { sentAt: Date.now() }, server echoes it back immediately.
// Frontend calculates RTT = Date.now() - sentAt on response.
app.post('/api/ping', (req, res) => {
  res.json({ sentAt: req.body.sentAt, serverTime: Date.now() });
});

app.get('/api/alerts', (req, res) => {
  res.json(db.alerts);
});

// Helper: POST JSON to a URL (used to call LSTM API)
function httpPostJSON(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = http_module.request(url, opts, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch(e) { resolve(null); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

app.post('/api/alerts', async (req, res) => {
  const alert = { ...req.body, timestamp: new Date(req.body.timestamp).toISOString() };

  // Enrich with LSTM prediction if available (non-blocking)
  if (lstmAvailable && alert.description) {
    try {
      const lstm = await httpPostJSON(LSTM_API + '/predict', { text: alert.description });
      if (lstm && !lstm.error) {
        alert.lstm = {
          incidentType: lstm.incident_type,
          confidence:   lstm.confidence,
          isDisaster:   lstm.is_disaster,
          priority:     lstm.priority,
        };
      }
    } catch (_) { /* LSTM failure never blocks alert saving */ }
  }

  replaceDataItem('alerts', alert, db);
  saveData(DB_PATH, db);
  console.log('EMITTING ALERT:', alert.id, alert.incidentType, alert.lstm ? '(+LSTM)' : '');
  io.emit('new_alert', alert);
  res.status(201).json(alert);
});

// Direct passthrough so frontend can call LSTM without CORS issues
app.post('/api/lstm-predict', async (req, res) => {
  if (!lstmAvailable) return res.status(503).json({ error: 'LSTM service not available' });
  try {
    const result = await httpPostJSON(LSTM_API + '/predict', req.body);
    res.json(result);
  } catch (e) {
    res.status(502).json({ error: 'LSTM service error', detail: e.message });
  }
});

app.get('/api/lstm-status', (req, res) => {
  res.json({ available: lstmAvailable, url: LSTM_API });
});

app.get('/api/feed', (req, res) => {
  res.json(db.feed);
});

app.post('/api/feed', (req, res) => {
  const feedItem = { ...req.body, timestamp: new Date(req.body.timestamp).toISOString() };
  replaceDataItem('feed', feedItem, db);
  saveData(DB_PATH, db);
  console.log('EMITTING FEED:', feedItem.id);
  io.emit('new_feed', feedItem);
  res.status(201).json(feedItem);
});

// =================== DB2: FEEDBACK HISTORY ===================

app.get('/api/feedback-history', (req, res) => {
  res.json(db2.feedbackHistory || []);
});

app.post('/api/feedback-history', (req, res) => {
  const feedback = {
    ...req.body,
    timestamp: new Date(req.body.timestamp).toISOString(),
    type: 'random_tweet',
    reason: 'Not disaster-related'
  };
  if (!db2.feedbackHistory) db2.feedbackHistory = [];
  db2.feedbackHistory.unshift(feedback);
  if (!db2.filteredSummary) db2.filteredSummary = { totalFiltered: 0, successfulFilter: 0, filterRate: '0%' };
  db2.filteredSummary.totalFiltered = db2.feedbackHistory.length;
  db2.filteredSummary.successfulFilter = db2.feedbackHistory.filter(f => f.edgeFilterResult).length;
  db2.filteredSummary.filterRate = ((db2.filteredSummary.successfulFilter / db2.filteredSummary.totalFiltered) * 100).toFixed(1) + '%';
  saveData(DB2_PATH, db2);
  res.status(201).json(feedback);
});

app.get('/api/feedback-summary', (req, res) => {
  res.json(db2.filteredSummary || { totalFiltered: 0, successfulFilter: 0, filterRate: '0%' });
});

// =================== DB3: PROCESSING LOGS ===================

app.get('/api/logs', (req, res) => {
  res.json(db3.processingLogs || []);
});

app.post('/api/logs', (req, res) => {
  const log = { ...req.body, timestamp: new Date(req.body.timestamp).toISOString() };
  if (!db3.processingLogs) db3.processingLogs = [];
  db3.processingLogs.unshift(log);
  if (!db3.logSummary) db3.logSummary = { totalProcessed: 0, successfulAlerts: 0, filteredOut: 0 };
  if (log.stage === 'edge_filter' && log.result.includes('Filtered out')) {
    db3.logSummary.filteredOut++;
  } else if (log.stage === 'queue_distribution') {
    db3.logSummary.successfulAlerts++;
  }
  db3.logSummary.totalProcessed = Math.ceil(db3.processingLogs.length / 4);
  saveData(DB3_PATH, db3);
  console.log('EMITTING PROCESSING UPDATE:', log.id, log.stage);
  io.emit('processing_update', { log, summary: db3.logSummary });
  res.status(201).json(log);
});

app.get('/api/logs-summary', (req, res) => {
  res.json(db3.logSummary || { totalProcessed: 0, successfulAlerts: 0, filteredOut: 0 });
});

// =================== DISPATCHES ===================

app.get('/api/dispatches', (req, res) => {
  res.json(db.dispatches || []);
});

app.post('/api/dispatches', (req, res) => {
  const dispatch = { ...req.body, timestamp: new Date(req.body.timestamp).toISOString() };
  replaceDataItem('dispatches', dispatch, db);
  saveData(DB_PATH, db);

  // ── Push dispatch to responders via WebSocket ──
  console.log('EMITTING DISPATCH:', dispatch.id);
  io.emit('new_dispatch', dispatch);

  res.status(201).json(dispatch);
});

// =================== TEAM RESPONSES ===================
// Stored in db.dispatches as part of each dispatch

app.post('/api/responses', (req, res) => {
  const response = { ...req.body, timestamp: new Date(req.body.timestamp).toISOString() };

  // Store responses array in db
  if (!db.responses) db.responses = [];
  const existingIdx = db.responses.findIndex(r =>
    r.dispatchReportId === response.dispatchReportId && r.respondingRole === response.respondingRole
  );
  if (existingIdx >= 0) {
    db.responses[existingIdx] = response; // update existing
  } else {
    db.responses.unshift(response); // new response
  }
  saveData(DB_PATH, db);

  // ── Push response update to admin dashboard via WebSocket ──
  console.log('EMITTING TEAM RESPONSE:', response.id, response.respondingRole, response.currentStatus);
  io.emit('team_response_update', response);

  res.status(201).json(response);
});

app.get('/api/responses', (req, res) => {
  res.json(db.responses || []);
});

// =================== DISPATCH LOGS ===================

app.get('/api/dispatch-logs', (req, res) => {
  res.json(db.dispatchLogs || []);
});

app.post('/api/dispatch-logs', (req, res) => {
  const log = { ...req.body, timestamp: new Date(req.body.timestamp).toISOString() };
  if (!db.dispatchLogs) db.dispatchLogs = [];
  db.dispatchLogs.unshift(log);
  saveData(DB_PATH, db);
  console.log('EMITTING DISPATCH LOG:', log.id, log.action);
  io.emit('dispatch_log_update', log);
  res.status(201).json(log);
});

// =================== RESET ===================

app.post('/api/reset', (req, res) => {
  db = { alerts: [], feed: [], logs: [], dispatches: [], responses: [], dispatchLogs: [] };
  db2 = { feedbackHistory: [], filteredSummary: { totalFiltered: 0, successfulFilter: 0, filterRate: '0%' } };
  db3 = { processingLogs: [], logSummary: { totalProcessed: 0, successfulAlerts: 0, filteredOut: 0 } };
  db4 = { respondLogins: [] };
  saveData(DB_PATH, db);
  saveData(DB2_PATH, db2);
  saveData(DB3_PATH, db3);
  saveData(DB4_PATH, db4);
  res.json({ status: 'reset' });
});

app.get('/api/status', (req, res) => {
  res.json({
    db1: { alerts: db.alerts?.length || 0, feed: db.feed?.length || 0 },
    db2: { feedbackHistory: db2.feedbackHistory?.length || 0 },
    db3: { logs: db3.processingLogs?.length || 0 },
    db4: { respondLogins: db4.respondLogins?.length || 0 },
  });
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 Backend API running on http://localhost:${PORT}`);
  console.log(`⚡ Socket.IO enabled on ws://localhost:${PORT}`);
  checkLSTM(); // initial LSTM availability check on startup
  console.log(`📁 DB1 (Alerts/Feed):       ${DB_PATH}`);
  console.log(`📁 DB2 (Feedback History):  ${DB2_PATH}`);
  console.log(`📁 DB3 (Processing Logs):   ${DB3_PATH}`);
  console.log(`📁 DB4 (Respond Logins):    ${DB4_PATH}\n`);
});