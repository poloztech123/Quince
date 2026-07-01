/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { defaultQuestions, defaultAds } from './src/defaultQuestions';
import { FullGameState, QuizState, Question, Group, AnswerSubmission, AdBanner, ScoreState, SavedSession } from './src/types';

// In-Memory Game Store
let questions: Question[] = [...defaultQuestions].map(q => ({ ...q, points: 1 }));
let ads: AdBanner[] = [...defaultAds];
let groups: Group[] = [
  { id: 'g-alpha', name: 'Alpha Team', joined: false },
  { id: 'g-brain', name: 'Brainiacs', joined: false },
  { id: 'g-delta', name: 'Delta Force', joined: false },
  { id: 'g-quizz', name: 'Quizzards', joined: false },
  { id: 'g-titan', name: 'Titans', joined: false }
];

// Keyed by Question ID -> Group ID -> Submission
let submissions: Record<string, Record<string, AnswerSubmission>> = {};

let savedSessions: SavedSession[] = [];
const SESSIONS_FILE = path.join(process.cwd(), 'saved-sessions.json');

function loadSavedSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const contents = fs.readFileSync(SESSIONS_FILE, 'utf8');
      savedSessions = JSON.parse(contents);
    } else {
      savedSessions = [];
    }
  } catch (err) {
    console.error('Error loading saved sessions:', err);
    savedSessions = [];
  }
}

function saveSessionsToDisk() {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(savedSessions, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing saved sessions disk:', err);
  }
}

// Read saved sessions at boot
loadSavedSessions();

let state: QuizState = {
  status: 'lobby',
  quizName: 'Ultimate Trivia Championship',
  eventLogo: '🏆',
  currentRound: 1,
  currentQuestionIndex: 0,
  timer: 30,
  timerMax: 30,
  activeQuestionId: null,
  adBannerIndex: 0,
  maxRounds: 3,
  intermissionDuration: 900,
  questionDuration: 30
};

// Real-Time Event Broadcast Clients
const sseClients = new Set<express.Response>();

// Calculate active scores based on correct submissions
function calculateScores(): ScoreState {
  const roundScores: Record<string, Record<number, number>> = {};
  const totalScores: Record<string, number> = {};

  // Initialize for all groups dynamically based on maxRounds
  const maxR = state.maxRounds || 3;
  groups.forEach(g => {
    roundScores[g.id] = {};
    for (let r = 1; r <= maxR; r++) {
      roundScores[g.id][r] = 0;
    }
    totalScores[g.id] = 0;
  });

  // Sum up completed questions
  Object.keys(submissions).forEach(qId => {
    const q = questions.find(x => x.id === qId);
    if (!q) return;

    const qSubmissions = submissions[qId];
    if (!qSubmissions) return;

    Object.keys(qSubmissions).forEach(gId => {
      const sub = qSubmissions[gId];
      if (sub && sub.isCorrect) {
        if (!roundScores[gId]) {
          roundScores[gId] = {};
          for (let r = 1; r <= maxR; r++) {
            roundScores[gId][r] = 0;
          }
        }
        roundScores[gId][q.round] = (roundScores[gId][q.round] || 0) + sub.pointsEarned;
        totalScores[gId] = (totalScores[gId] || 0) + sub.pointsEarned;
      }
    });
  });

  return { roundScores, totalScores };
}

function getGameState(): FullGameState {
  return {
    state: {
      ...state,
      activeQuestionId: state.status === 'lobby' || state.status === 'ended' ? null : (questions.find(q => q.round === state.currentRound)?.[state.currentQuestionIndex]?.id || null)
    },
    questions,
    groups,
    submissions,
    ads,
    scores: calculateScores(),
    savedSessions
  };
}

function broadcastState() {
  const data = JSON.stringify(getGameState());
  sseClients.forEach(client => {
    try {
      client.write(`data: ${data}\n\n`);
    } catch (e) {
      console.error('Error writing to client:', e);
    }
  });
}

// Global server-managed countdown interval
let intervalId: NodeJS.Timeout | null = null;
let adRotateCounter = 0;

function startInterval() {
  if (intervalId) return;

  intervalId = setInterval(() => {
    let stateChanged = false;

    // Rotate advertisements index every 10 seconds
    adRotateCounter++;
    if (adRotateCounter >= 10) {
      adRotateCounter = 0;
      state.adBannerIndex = (state.adBannerIndex + 1) % ads.length;
      stateChanged = true;
    }

    // Handle Active Timer Countdown based on status
    if (state.status === 'question' || state.status === 'reveal' || state.status === 'intermission') {
      if (state.timer > 0) {
        state.timer--;
        stateChanged = true;
      } else {
        // Timer Expired: Transition state machine automatically
        if (state.status === 'question') {
          // Time is up! Move to reveal state to highlight correct answers
          state.status = 'reveal';
          state.timer = 8; // Present answer overlay for 8 seconds
          state.timerMax = 8;
          // Grade the active submissions if not already graded
          gradeActiveQuestion();
          stateChanged = true;
        } else if (state.status === 'reveal') {
          // Reveal finished. Move to next question or start intermission or end quiz
          advanceToNextQuestionFlow();
          stateChanged = true;
        } else if (state.status === 'intermission') {
          // Break finished! Move to next round
          state.status = 'question';
          state.currentRound = Math.min(state.maxRounds || 3, state.currentRound + 1);
          state.currentQuestionIndex = 0;
          const activeQ = questions.find(q => q.round === state.currentRound);
          state.timer = state.questionDuration || 30;
          state.timerMax = state.questionDuration || 30;
          stateChanged = true;
        }
      }
    }

    if (stateChanged) {
      broadcastState();
    }
  }, 1000);
}

// Automatically grade submissions of the active question
function gradeActiveQuestion() {
  const activeRoundQList = questions.filter(q => q.round === state.currentRound);
  const currentQ = activeRoundQList[state.currentQuestionIndex];
  if (!currentQ) return;

  if (!submissions[currentQ.id]) {
    submissions[currentQ.id] = {};
  }

  const qSubmissions = submissions[currentQ.id];
  groups.forEach(g => {
    if (!g.joined) return;
    const sub = qSubmissions[g.id];
    if (sub) {
      // If submitted, calculate correctness
      sub.isCorrect = sub.selectedOption === currentQ.correctAnswer;
      sub.pointsEarned = sub.isCorrect ? currentQ.points : 0;
    }
  });
}

function advanceToNextQuestionFlow() {
  const activeRoundQList = questions.filter(q => q.round === state.currentRound);
  const isLastQuestionOfRound = state.currentQuestionIndex >= activeRoundQList.length - 1;

  const currentMaxRounds = state.maxRounds || 3;
  const currentIntermissionDur = state.intermissionDuration !== undefined ? state.intermissionDuration : 900;

  if (isLastQuestionOfRound) {
    if (state.currentRound < currentMaxRounds) {
      // Trigger intermission break
      state.status = 'intermission';
      state.timer = currentIntermissionDur;
      state.timerMax = currentIntermissionDur;
    } else {
      // Completed last question of the final round! End quiz
      state.status = 'ended';
      state.timer = 0;
      state.timerMax = 0;
    }
  } else {
    // Progress to next question
    state.status = 'question';
    state.currentQuestionIndex++;
    state.timer = state.questionDuration || 30;
    state.timerMax = state.questionDuration || 30;
  }
}

function archiveCurrentSession() {
  const currentScores = calculateScores();
  const hasScores = Object.values(currentScores.totalScores).some(score => score > 0);
  const hasSubmissions = Object.keys(submissions).some(qId => Object.keys(submissions[qId]).length > 0);
  
  if (!hasScores && !hasSubmissions) {
    return; // Skip saving empty sessions
  }

  const sessionScores = groups
    .filter(g => g.joined)
    .map(g => ({
      groupId: g.id,
      groupName: g.name,
      score: currentScores.totalScores[g.id] || 0
    }))
    .sort((a, b) => b.score - a.score);

  if (sessionScores.length === 0) {
    return; 
  }

  const newSession: SavedSession = {
    id: 'session-' + Date.now(),
    timestamp: Date.now(),
    quizName: state.quizName || 'Ultimate Trivia Championship',
    eventLogo: state.eventLogo || '🏆',
    roundsCount: state.maxRounds || 3,
    completedAt: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    finalScores: sessionScores
  };

  savedSessions.unshift(newSession);
  if (savedSessions.length > 30) {
    savedSessions = savedSessions.slice(0, 30);
  }
  saveSessionsToDisk();
}

async function run() {
  const app = express();
  app.use(express.json());

  // SSE Broadcast Stream Endpoint
  app.get('/api/events', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // bypass proxy buffering
    });

    // Send initial bootstrap payload
    res.write(`data: ${JSON.stringify(getGameState())}\n\n`);

    sseClients.add(res);
    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // Client Bootstrapping & Sync endpoint
  app.get('/api/state', (req, res) => {
    res.json(getGameState());
  });

  // Client Group Joining Endpoint
  app.post('/api/client/join', (req, res) => {
    const { groupId, groupName } = req.body;
    if (!groupId || !groupName) {
      res.status(400).json({ error: 'Group ID and Group Name are required' });
      return;
    }

    // Match pre-existing group managed through the Admin Panel
    const preExisting = groups.find(g => g.id.toLowerCase().trim() === groupId.toLowerCase().trim());
    if (!preExisting) {
      res.status(404).json({ error: 'Group ID not found. High score quizzes require valid group registration via the Admin Panel.' });
      return;
    }

    // Update group state
    preExisting.name = groupName; // Allow slightly modifying visual display name
    preExisting.joined = true;

    // Mid-Quiz hot-joining catch-up behavior: skipped answer submissions created automatically
    // Nothing is locked, we broadcast immediately
    broadcastState();
    res.json({ success: true, group: preExisting });
  });

  // Participant Submission Endpoint
  app.post('/api/client/submit', (req, res) => {
    const { groupId, questionId, selectedOption } = req.body;

    if (!groupId || !questionId || !selectedOption) {
      res.status(400).json({ error: 'Missing parameters' });
      return;
    }

    // Ensure the quiz is actively accepting answers
    if (state.status !== 'question') {
      res.status(400).json({ error: 'Answers are not currently accepted for this question.' });
      return;
    }

    const activeRoundQ = questions.filter(q => q.round === state.currentRound);
    const activeQ = activeRoundQ[state.currentQuestionIndex];
    if (!activeQ || activeQ.id !== questionId) {
      res.status(400).json({ error: 'The submitted question is no longer active.' });
      return;
    }

    // Verify group actually exists and is registered
    const group = groups.find(g => g.id === groupId && g.joined);
    if (!group) {
      res.status(403).json({ error: 'Group is not authorized or is not joined.' });
      return;
    }

    // Initialize question submission record if not already present
    if (!submissions[questionId]) {
      submissions[questionId] = {};
    }

    // Add submission (it will be graded upon timer completion or full submit lock in)
    const submission: AnswerSubmission = {
      groupId,
      questionId,
      selectedOption,
      isCorrect: selectedOption === activeQ.correctAnswer,
      pointsEarned: selectedOption === activeQ.correctAnswer ? activeQ.points : 0,
      timestamp: Date.now()
    };

    submissions[questionId][groupId] = submission;

    // Check if ALL currently joined active groups have submitted
    const numJoinedGroups = groups.filter(g => g.joined).length;
    const numSubmissions = Object.keys(submissions[questionId]).length;

    if (numJoinedGroups > 0 && numSubmissions >= numJoinedGroups) {
      // Auto-advance directly into reveal state to prevent unnecessary idle waiting
      state.status = 'reveal';
      state.timer = 8;
      state.timerMax = 8;
      gradeActiveQuestion();
    }

    broadcastState();
    res.json({ success: true, submission });
  });

  // Admin Configuration Endpoints
  // Pre-generate & Add Group
  app.post('/api/admin/groups', (req, res) => {
    const { id, name } = req.body;
    if (!id || !name) {
      res.status(400).json({ error: 'Missing group credentials' });
      return;
    }

    const isDuplicate = groups.some(g => g.id.toLowerCase() === id.toLowerCase());
    if (isDuplicate) {
      res.status(400).json({ error: 'Group ID already exists.' });
      return;
    }

    groups.push({ id, name, joined: false });
    broadcastState();
    res.json({ success: true, groups });
  });

  // Delete Group
  app.delete('/api/admin/groups/:id', (req, res) => {
    const { id } = req.params;
    groups = groups.filter(g => g.id !== id);
    broadcastState();
    res.json({ success: true, groups });
  });

  // Customize/Replace Questions list
  app.post('/api/admin/questions', (req, res) => {
    const { list } = req.body;
    if (Array.isArray(list)) {
      questions = list.map(q => ({ ...q, points: 1 }));
      broadcastState();
      res.json({ success: true, questions });
    } else {
      res.status(400).json({ error: 'Invalid question list' });
    }
  });

  // Add/Update Banner Advertisement
  app.post('/api/admin/ads', (req, res) => {
    const { title, description, imageUrl, id } = req.body;
    if (!title || !description) {
      res.status(400).json({ error: 'Missing title or description' });
      return;
    }

    if (id) {
      // Update existing
      const existing = ads.find(a => a.id === id);
      if (existing) {
        existing.title = title;
        existing.description = description;
        existing.imageUrl = imageUrl || '';
      }
    } else {
      // Add new
      ads.push({
        id: 'ad-' + Date.now(),
        title,
        description,
        imageUrl: imageUrl || '',
        clickUrl: '#'
      });
    }

    broadcastState();
    res.json({ success: true, ads });
  });

  // Delete Ad Banner
  app.delete('/api/admin/ads/:id', (req, res) => {
    const { id } = req.params;
    ads = ads.filter(a => a.id !== id);
    if (state.adBannerIndex >= ads.length) {
      state.adBannerIndex = 0;
    }
    broadcastState();
    res.json({ success: true, ads });
  });

  // Reset core quiz stats to clean slate (caches/archives current session overview first)
  app.post('/api/admin/reset', (req, res) => {
    try {
      archiveCurrentSession();
    } catch (err) {
      console.error('Error auto-archiving session on reset:', err);
    }

    submissions = {};
    state = {
      status: 'lobby',
      quizName: req.body.quizName || 'Ultimate Trivia Championship',
      eventLogo: req.body.eventLogo || '🏆',
      currentRound: 1,
      currentQuestionIndex: 0,
      timer: req.body.questionDuration || state.questionDuration || 30,
      timerMax: req.body.questionDuration || state.questionDuration || 30,
      activeQuestionId: null,
      adBannerIndex: 0,
      maxRounds: req.body.maxRounds || state.maxRounds || 3,
      intermissionDuration: req.body.intermissionDuration !== undefined ? req.body.intermissionDuration : (state.intermissionDuration || 900),
      questionDuration: req.body.questionDuration || state.questionDuration || 30
    };
    // Keep the groups, but reset their join marker if option checked
    if (req.body.resetGroups) {
      groups.forEach(g => {
        g.joined = false;
      });
    }

    broadcastState();
    res.json({ success: true, state: getGameState() });
  });

  // Manually cache and store previous session details from the active state
  app.post('/api/admin/sessions/save', (req, res) => {
    const currentScores = calculateScores();
    const sessionScores = groups
      .filter(g => g.joined)
      .map(g => ({
        groupId: g.id,
        groupName: g.name,
        score: currentScores.totalScores[g.id] || 0
      }))
      .sort((a, b) => b.score - a.score);

    const newSession: SavedSession = {
      id: 'session-' + Date.now(),
      timestamp: Date.now(),
      quizName: state.quizName || 'Ultimate Trivia Championship',
      eventLogo: state.eventLogo || '🏆',
      roundsCount: state.maxRounds || 3,
      completedAt: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      finalScores: sessionScores
    };

    savedSessions.unshift(newSession);
    if (savedSessions.length > 30) {
      savedSessions = savedSessions.slice(0, 30);
    }
    saveSessionsToDisk();
    broadcastState();
    res.json({ success: true, savedSessions, state: getGameState() });
  });

  // Delete previous session detail record from history
  app.delete('/api/admin/sessions/:id', (req, res) => {
    const { id } = req.params;
    savedSessions = savedSessions.filter(s => s.id !== id);
    saveSessionsToDisk();
    broadcastState();
    res.json({ success: true, savedSessions, state: getGameState() });
  });

  // Master starts quiz manually
  app.post('/api/admin/start', (req, res) => {
    submissions = {}; // clear submissions
    state.status = 'question';
    state.currentRound = 1;
    state.currentQuestionIndex = 0;
    state.timer = state.questionDuration || 30;
    state.timerMax = state.questionDuration || 30;

    broadcastState();
    res.json({ success: true, state: getGameState() });
  });

  // Master skips / manually triggers next question
  app.post('/api/admin/next', (req, res) => {
    if (state.status === 'question') {
      // Pre-grade active submissions and force reveal
      gradeActiveQuestion();
      state.status = 'reveal';
      state.timer = 8;
      state.timerMax = 8;
    } else if (state.status === 'reveal') {
      advanceToNextQuestionFlow();
    } else if (state.status === 'intermission') {
      // Force end intermission break
      state.status = 'question';
      state.currentRound = Math.min(state.maxRounds || 3, state.currentRound + 1);
      state.currentQuestionIndex = 0;
      state.timer = state.questionDuration || 30;
      state.timerMax = state.questionDuration || 30;
    } else if (state.status === 'lobby') {
      state.status = 'question';
      state.currentRound = 1;
      state.currentQuestionIndex = 0;
      state.timer = state.questionDuration || 30;
      state.timerMax = state.questionDuration || 30;
    }

    broadcastState();
    res.json({ success: true, state: getGameState() });
  });

  // Master updates rounds and intermission durations
  app.post('/api/admin/settings', (req, res) => {
    const { maxRounds, intermissionDuration, questionDuration } = req.body;
    if (typeof maxRounds === 'number') {
      state.maxRounds = maxRounds;
    }
    if (typeof intermissionDuration === 'number') {
      state.intermissionDuration = intermissionDuration;
    }
    if (typeof questionDuration === 'number') {
      state.questionDuration = questionDuration;
    }
    broadcastState();
    res.json({ success: true, state: getGameState() });
  });

  // Master toggles pause / plays active timers
  app.post('/api/admin/toggle-pause', (req, res) => {
    const { isPaused } = req.body;
    if (isPaused) {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    } else {
      startInterval();
    }
    res.json({ success: true, isPaused });
  });

  // Master overrides/skips breaks or sets timer directly
  app.post('/api/admin/override-timer', (req, res) => {
    const { seconds } = req.body;
    if (typeof seconds === 'number') {
      state.timer = seconds;
      state.timerMax = seconds; // Set both to keep UI timers perfectly synched with any custom overrides
      broadcastState();
      res.json({ success: true, timer: state.timer });
    } else {
      res.status(400).json({ error: 'Seconds must be a valid number' });
    }
  });

  // Start internal time counts on server bootstrap
  startInterval();

  // Mounting client bundles
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quiz Server is now listening at http://0.0.0.0:${PORT}`);
  });
}

run();
