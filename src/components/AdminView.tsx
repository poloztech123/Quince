/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Trophy, Users, CheckCircle, Play, Pause, ChevronRight, 
  RotateCcw, Plus, Trash, Edit2, AlertTriangle, Save, ListMusic, PlusCircle, Settings, FileText, Megaphone, History, Database
} from 'lucide-react';
import { FullGameState, Question, Group, AdBanner } from '../types';
import quince02 from '../assets/images/Quince-02.png';

interface AdminViewProps {
  gameState: FullGameState;
  onResetQuiz: (options: { quizName: string; eventLogo: string; resetGroups: boolean }) => Promise<void>;
  onStartQuiz: () => Promise<void>;
  onNextQuestion: () => Promise<void>;
  onTogglePause: (isPaused: boolean) => Promise<void>;
  onOverrideTimer: (seconds: number) => Promise<void>;
  onAddGroup: (id: string, name: string) => Promise<boolean>;
  onDeleteGroup: (id: string) => Promise<void>;
  onAddAd: (title: string, description: string, id?: string) => Promise<void>;
  onDeleteAd: (id: string) => Promise<void>;
  onUpdateQuestions: (list: Question[]) => Promise<void>;
  onUpdateSettings: (maxRounds: number, intermissionDuration: number, questionDuration: number) => Promise<void>;
  onSelectOption?: () => void;
  onSaveSession?: () => Promise<void>;
  onDeleteSession?: (id: string) => Promise<void>;
}

export default function AdminView({
  gameState,
  onResetQuiz,
  onStartQuiz,
  onNextQuestion,
  onTogglePause,
  onOverrideTimer,
  onAddGroup,
  onDeleteGroup,
  onAddAd,
  onDeleteAd,
  onUpdateQuestions,
  onUpdateSettings,
  onSaveSession,
  onDeleteSession
}: AdminViewProps) {
  const { state, questions, groups, submissions, ads } = gameState;

  // Administrative Access & Authentication
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return localStorage.getItem('quiz_admin_authenticated') === 'true';
  });
  const [dummyEmail, setDummyEmail] = useState('');
  const [dummyPassword, setDummyPassword] = useState('');
  const [authErrorText, setAuthErrorText] = useState('');

  const DUMMY_EMAIL = 'admin@contest.com';
  const DUMMY_PASSWORD = 'director2026@';

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthErrorText('');
    if (dummyEmail.trim().toLowerCase() === DUMMY_EMAIL && dummyPassword === DUMMY_PASSWORD) {
      setIsAdminAuthenticated(true);
      localStorage.setItem('quiz_admin_authenticated', 'true');
    } else {
      setAuthErrorText('Invalid credentials. Please input the correct email and password below.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('quiz_admin_authenticated');
  };

  // Active navigation tab
  const [activeSubTab, setActiveSubTab] = useState<'control' | 'groups' | 'questions' | 'ads' | 'sessions'>('control');

  // Add Group forms
  const [groupIdInput, setGroupIdInput] = useState('');
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupError, setGroupError] = useState('');

  // Add Ad forms
  const [adTitleInput, setAdTitleInput] = useState('');
  const [adDescriptionInput, setAdDescriptionInput] = useState('');
  const [adError, setAdError] = useState('');

  // Override timer inputs
  const [timerInput, setTimerInput] = useState<number>(30);

  // Settings configs
  const [configPlayName, setConfigPlayName] = useState(state.quizName);
  const [configPlayLogo, setConfigPlayLogo] = useState(state.eventLogo);
  const [isTimerPaused, setIsTimerPaused] = useState(false);

  // Dynamic tournament settings inputs
  const [maxRoundsInput, setMaxRoundsInput] = useState<number>(state.maxRounds || 3);
  const [intermissionMinutesInput, setIntermissionMinutesInput] = useState<number>(
    Math.round((state.intermissionDuration !== undefined ? state.intermissionDuration : 900) / 60)
  );
  const [questionDurationInput, setQuestionDurationInput] = useState<number>(state.questionDuration || 30);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsSuccessMessage, setSettingsSuccessMessage] = useState('');

  const handleApplySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSuccessMessage('');
    try {
      const durSecs = intermissionMinutesInput * 60;
      await onUpdateSettings(maxRoundsInput, durSecs, questionDurationInput);
      setSettingsSuccessMessage('Dynamic settings successfully deployed & broadcasted!');
      setTimeout(() => setSettingsSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Question Editor state
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQText, setEditQText] = useState('');
  const [editQOptA, setEditQOptA] = useState('');
  const [editQOptB, setEditQOptB] = useState('');
  const [editQOptC, setEditQOptC] = useState('');
  const [editQOptD, setEditQOptD] = useState('');
  const [editQCorrect, setEditQCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [editQPoints, setEditQPoints] = useState<number>(1);
  const [questionsFilterRound, setQuestionsFilterRound] = useState<number>(1);

  // Custom submission count tracking
  const activeQuestionsList = questions.filter(q => q.round === state.currentRound);
  const currentQuestion = activeQuestionsList[state.currentQuestionIndex];
  const submissionRecordCount = currentQuestion ? Object.keys(submissions[currentQuestion.id] || {}).length : 0;
  const loggedInTeams = groups.filter(g => g.joined).length;

  // Handles adding groups
  const handleAddNewGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setGroupError('');
    if (!groupIdInput.trim() || !groupNameInput.trim()) {
      setGroupError('Provide ID and Name.');
      return;
    }

    const cleanId = groupIdInput.trim().toUpperCase().replace(/\s+/g, '-');
    const cleanName = groupNameInput.trim();

    const ok = await onAddGroup(cleanId, cleanName);
    if (ok) {
      setGroupIdInput('');
      setGroupNameInput('');
    } else {
      setGroupError('Group credentials already exist.');
    }
  };

  // Handles adding ads
  const handleAddNewAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdError('');
    if (!adTitleInput.trim() || !adDescriptionInput.trim()) {
      setAdError('Fill out title and desc.');
      return;
    }

    await onAddAd(adTitleInput.trim(), adDescriptionInput.trim());
    setAdTitleInput('');
    setAdDescriptionInput('');
  };

  const startEditQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    setEditQText(q.text);
    setEditQOptA(q.options.A);
    setEditQOptB(q.options.B);
    setEditQOptC(q.options.C);
    setEditQOptD(q.options.D);
    setEditQCorrect(q.correctAnswer);
    setEditQPoints(q.points);
  };

  const handleSaveQuestion = async (qId: string) => {
    const updated = questions.map(q => {
      if (q.id === qId) {
        return {
          ...q,
          text: editQText,
          options: {
            A: editQOptA,
            B: editQOptB,
            C: editQOptC,
            D: editQOptD
          },
          correctAnswer: editQCorrect,
          points: 1
        };
      }
      return q;
    });

    await onUpdateQuestions(updated);
    setEditingQuestionId(null);
  };

  const handleToggleTimerPause = async () => {
    const targetState = !isTimerPaused;
    setIsTimerPaused(targetState);
    await onTogglePause(targetState);
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4 text-white" id="director-login-gate">
        <div className="w-full max-w-md bg-slate-900/60 backdrop-blur border-2 border-[#EE9200]/30 rounded-[2.5rem] p-6 sm:p-10 shadow-[0_25px_60px_rgba(238,146,0,0.15)] relative overflow-hidden">
          
          {/* Subtle decoration element */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-[#EE9200]/5 rounded-full blur-3xl"></div>
          
          <div className="text-center mb-8 relative">
            <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center mx-auto shadow-lg border border-[#EE9200]/40 overflow-hidden mb-4">
              <img 
                src={quince02} 
                alt="Quince-02 Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="font-display font-black text-2xl uppercase tracking-tight text-white">Admin Portal</h1>
            <p className="text-xs text-brand-secondary mt-1 font-medium">Verify credentials to enter administrative command center.</p>
          </div>

          <form onSubmit={handleAdminLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-[#EE9200] mb-2 font-black">Email Address</label>
              <input
                type="email"
                required
                placeholder="youremail@.com"
                value={dummyEmail}
                onChange={(e) => setDummyEmail(e.target.value)}
                className="w-full bg-black/80 border border-slate-800 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#EE9200] focus:border-[#EE9200] placeholder-slate-600 transition"
                id="director-email-input"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-widest text-[#EE9200] mb-2 font-black">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={dummyPassword}
                onChange={(e) => setDummyPassword(e.target.value)}
                className="w-full bg-black/80 border border-slate-800 text-white rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#EE9200] focus:border-[#EE9200] placeholder-slate-600 transition"
                id="director-password-input"
              />
            </div>

            {authErrorText && (
              <div className="bg-rose-950/40 text-rose-400 border border-rose-900/40 p-4 rounded-xl text-xs flex items-start gap-2.5 animate-bounce">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authErrorText}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#EE9200] hover:bg-[#EE9200]/90 text-black font-display font-black py-4 px-4 rounded-xl shadow-lg shadow-[#EE9200]/10 focus:outline-none transition transform active:scale-95 text-xs uppercase tracking-widest cursor-pointer mt-2"
              id="director-login-submit"
            >
              Sign In to Console
            </button>
          </form>

        

        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6" id="admin-management-view">
      
      {/* Overview Stats banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Tournament State</span>
          <span className="text-sm font-black text-amber-500 font-display mt-1">{state.status.toUpperCase()}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-semibold">Active Round / Index</span>
          <span className="text-sm font-bold text-white font-mono mt-1">R{state.currentRound} • Q{state.currentQuestionIndex + 1}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Connected Teams</span>
          <span className="text-sm font-bold text-teal-400 font-mono mt-1">{loggedInTeams} / {groups.length} Groups</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-center">
          <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Active Ad rotation</span>
          <span className="text-sm font-bold text-sky-400 font-mono mt-1"># {state.adBannerIndex + 1} of {ads.length}</span>
        </div>
      </div>

      {/* Dynamic SubTabs Navigator */}
      <div className="flex flex-col md:flex-row gap-3 bg-slate-900 border border-slate-800 p-2 rounded-2xl mb-6 items-stretch md:items-center" id="admin-subnavigation-tabs">
        <div className="flex flex-wrap gap-1.5 flex-1 items-center">
          <button
            onClick={() => setActiveSubTab('control')}
            className={`px-4 py-2.5 text-xs uppercase font-mono tracking-wider focus:outline-none flex items-center gap-2.5 rounded-xl transition duration-200 shrink-0 cursor-pointer ${
              activeSubTab === 'control' 
                ? 'bg-[#EE9200] text-black font-extrabold shadow-md shadow-[#EE9200]/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> 
            <span>Controller</span>
            <span className={`px-1.5 py-0.5 text-[8px] font-black rounded-md leading-none tracking-normal uppercase ${
              activeSubTab === 'control' ? 'bg-black/20 text-black' : 'bg-slate-950 border border-slate-850 text-[#EE9200] font-bold'
            }`}>
              {state.status.toUpperCase()}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('groups')}
            className={`px-4 py-2.5 text-xs uppercase font-mono tracking-wider focus:outline-none flex items-center gap-2.5 rounded-xl transition duration-200 shrink-0 cursor-pointer ${
              activeSubTab === 'groups' 
                ? 'bg-[#EE9200] text-black font-extrabold shadow-md shadow-[#EE9200]/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> 
            <span>Teams & Groups</span>
            <span className={`px-1.5 py-0.5 text-[8px] font-black rounded-md leading-none ${
              activeSubTab === 'groups' ? 'bg-black/20 text-black' : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}>
              {groups.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('questions')}
            className={`px-4 py-2.5 text-xs uppercase font-mono tracking-wider focus:outline-none flex items-center gap-2.5 rounded-xl transition duration-200 shrink-0 cursor-pointer ${
              activeSubTab === 'questions' 
                ? 'bg-[#EE9200] text-black font-extrabold shadow-md shadow-[#EE9200]/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> 
            <span>Question Bank</span>
            <span className={`px-1.5 py-0.5 text-[8px] font-black rounded-md leading-none ${
              activeSubTab === 'questions' ? 'bg-black/20 text-black' : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}>
              {questions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('ads')}
            className={`px-4 py-2.5 text-xs uppercase font-mono tracking-wider focus:outline-none flex items-center gap-2.5 rounded-xl transition duration-200 shrink-0 cursor-pointer ${
              activeSubTab === 'ads' 
                ? 'bg-[#EE9200] text-black font-extrabold shadow-md shadow-[#EE9200]/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/60'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5" /> 
            <span>Sponsor Ads</span>
            <span className={`px-1.5 py-0.5 text-[8px] font-black rounded-md leading-none ${
              activeSubTab === 'ads' ? 'bg-[#EE9200]/20 text-slate-900 font-extrabold' : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}>
              {ads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('sessions')}
            className={`px-4 py-2.5 text-xs uppercase font-mono tracking-wider focus:outline-none flex items-center gap-2.5 rounded-xl transition duration-200 shrink-0 cursor-pointer ${
              activeSubTab === 'sessions' 
                ? 'bg-[#EE9200] text-black font-extrabold shadow-md shadow-[#EE9200]/20' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-950/60'
            }`}
            id="admin-subtab-sessions-trigger"
          >
            <History className="w-3.5 h-3.5" /> 
            <span>Session History</span>
            <span className={`px-1.5 py-0.5 text-[8px] font-black rounded-md leading-none ${
              activeSubTab === 'sessions' ? 'bg-[#EE9200]/30 text-slate-900 font-extrabold' : 'bg-slate-950 text-slate-400 border border-slate-800'
            }`}>
              {gameState.savedSessions?.length || 0}
            </span>
          </button>
        </div>

        <button
          onClick={handleAdminLogout}
          className="px-4 py-2 text-[10px] font-mono font-black uppercase text-rose-400 hover:text-white hover:bg-rose-950/30 rounded-xl border border-rose-950/30 hover:border-rose-900 transition flex items-center justify-center gap-1.5 shrink-0 bg-transparent cursor-pointer"
          id="admin-logout-trigger"
        >
          Lock Portal 🔒
        </button>
      </div>

      {/* SUBTAB: CORE CONTROLLER */}
      {activeSubTab === 'control' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="admin-view-control-block">
          
          {/* Main Controls Console */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <h3 className="font-display font-extrabold text-base text-white border-b border-slate-800 pb-3">Quiz master flow console</h3>
            
            <div className="flex flex-wrap gap-3">
              {state.status === 'lobby' ? (
                <button
                  onClick={onStartQuiz}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold px-6 py-3.5 rounded-xl shadow shadow-emerald-500/10 flex items-center gap-2 transform active:scale-95 transition cursor-pointer text-sm"
                  id="admin-start-quiz-button"
                >
                  <Play className="w-4 h-4 fill-current shrink-0" /> Start Quiz (Initialize Challenge)
                </button>
              ) : (
                <button
                  onClick={onNextQuestion}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-display font-bold px-6 py-3.5 rounded-xl shadow shadow-teal-500/10 flex items-center gap-2 transform active:scale-95 transition cursor-pointer text-sm font-semibold"
                  id="admin-next-question-button"
                >
                  <ChevronRight className="w-4 h-4 leading-none shrink-0" /> 
                  {state.status === 'question' ? 'Reveal Correct Answer' : 'Proceed to Next Question'}
                </button>
              )}

              <button
                onClick={handleToggleTimerPause}
                className={`font-display font-bold px-5 py-3.5 rounded-xl border flex items-center gap-2 transform active:scale-95 transition cursor-pointer text-sm ${
                  isTimerPaused 
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400' 
                    : 'bg-slate-950 hover:bg-slate-900 text-slate-200 border-slate-800'
                }`}
                id="admin-pause-timer-button"
              >
                {isTimerPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isTimerPaused ? 'Resume Timer count' : 'Pause Timer countdown'}
              </button>
            </div>

            {/* Timer manual overrides */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800/60">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-mono uppercase block">Active progress timer: <span className="text-teal-400 font-bold">{state.timer}s</span> remaining</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="900"
                    placeholder="e.g. 15"
                    value={timerInput}
                    onChange={(e) => setTimerInput(parseInt(e.target.value) || 0)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none w-24"
                    id="admin-timer-override-input"
                  />
                  <button
                    onClick={() => onOverrideTimer(timerInput)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Force State Minutes/Secs
                  </button>
                </div>
              </div>

              {/* Submissions stats details */}
              <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-3 text-xs flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block font-mono">Completed Responses This Question</span>
                  <span className="font-mono text-base font-extrabold text-white mt-1 block">
                    {submissionRecordCount} / {loggedInTeams} teams submitted
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 uppercase font-mono block">Sync Threshold</span>
                  <span className="text-[10px] bg-sky-950 text-sky-400 px-2 py-0.5 rounded border border-sky-900 border-dashed font-mono">AUTO-REVEAL READY</span>
                </div>
              </div>
            </div>

            {/* Quick-test override macros */}
            <div className="bg-slate-950 border border-slate-800/60 p-4 rounded-xl space-y-2">
              <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase block">Developer Testing Shortcuts</span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button onClick={() => onOverrideTimer(3)} className="bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded border border-slate-800 text-orange-400 font-mono">Sets timer to 3s</button>
                <button onClick={() => onOverrideTimer(10)} className="bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded border border-slate-800 text-orange-400 font-mono">Sets timer 10s</button>
                <button onClick={() => onOverrideTimer(intermissionMinutesInput * 60)} className="bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded border border-slate-800 text-orange-400 font-mono">Intermission: {intermissionMinutesInput}m ({intermissionMinutesInput * 60}s)</button>
              </div>
            </div>

          </div>

          {/* Configuration reset & Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="font-display font-extrabold text-base text-white border-b border-slate-800 pb-3 mb-4">Quiz general details</h3>
              
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase">Quiz Name</label>
                  <input
                    type="text"
                    value={configPlayName}
                    onChange={(e) => setConfigPlayName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                    id="admin-setting-quiz-name"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase">Event Logo Emoji</label>
                  <input
                    type="text"
                    value={configPlayLogo}
                    onChange={(e) => setConfigPlayLogo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-teal-500"
                    id="admin-setting-quiz-logo"
                  />
                </div>

                {/* Dynamic Rounds & Intermissions Setup */}
                <div className="border-t border-slate-800/80 pt-4 mt-4 space-y-4">
                  <span className="text-[10px] text-amber-500 uppercase font-mono font-bold tracking-wider block">Tournament Config (Rounds & Breaks)</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 font-mono uppercase">Total Rounds</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={maxRoundsInput}
                        onChange={(e) => setMaxRoundsInput(parseInt(e.target.value) || 3)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                        id="admin-setting-max-rounds"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 font-mono uppercase">Break Intermission (Mins)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={intermissionMinutesInput}
                        onChange={(e) => setIntermissionMinutesInput(parseInt(e.target.value) || 15)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                        id="admin-setting-intermission-minutes"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-slate-400 mb-1 font-mono uppercase">Question Duration (Secs)</label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={questionDurationInput}
                        onChange={(e) => setQuestionDurationInput(parseInt(e.target.value) || 30)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-teal-500"
                        id="admin-setting-question-duration"
                      />
                    </div>
                  </div>

                  {settingsSuccessMessage && (
                    <div className="text-emerald-400 font-mono text-[10px] bg-emerald-950/20 border border-emerald-900 px-3 py-1.5 rounded-lg">
                      {settingsSuccessMessage}
                    </div>
                  )}

                  <button
                    onClick={handleApplySettings}
                    disabled={isSavingSettings}
                    className="w-full text-center bg-[#EE9200] hover:bg-[#EE9200]/90 text-black font-display font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-[#EE9200]/10 transition disabled:opacity-50 cursor-pointer"
                    id="admin-apply-settings-trigger"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {isSavingSettings ? 'Applying Settings...' : 'Apply & Save Config'}
                  </button>
                </div>
              </div>
            </div>

            {/* Reset operations */}
            <div className="mt-8 pt-4 border-t border-slate-800">
              <div className="bg-rose-950/20 border border-rose-900 border-dashed rounded-xl p-4 space-y-3">
                <span className="text-[9px] font-mono tracking-widest text-rose-400 uppercase font-bold block flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Danger Zone Actions
                </span>
                
                <button
                  onClick={() => onResetQuiz({ quizName: configPlayName, eventLogo: configPlayLogo, resetGroups: false })}
                  className="w-full bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-200 py-2.5 rounded-xl text-xs font-semibold transform active:scale-95 transition cursor-pointer"
                  id="admin-reset-stats-only-button"
                >
                  Reset Scores (Keep Connected Groups)
                </button>

                <button
                  onClick={() => onResetQuiz({ quizName: configPlayName, eventLogo: configPlayLogo, resetGroups: true })}
                  className="w-full bg-slate-950 hover:bg-slate-900 border border-red-900 text-rose-400 py-2.5 rounded-xl text-xs font-semibold transform active:scale-95 transition cursor-pointer"
                  id="admin-reset-all-button"
                >
                  Hard Wipe Tournament (Resets Groups)
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUBTAB: GROUP AUTHORIZATION */}
      {activeSubTab === 'groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="admin-view-groups-block">
          
          {/* Add Group panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-display font-extrabold text-white text-base border-b border-slate-800 pb-3 mb-4">Pre-generate group keys</h3>
            
            <form onSubmit={handleAddNewGroup} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-mono uppercase mb-1">Unique Group ID (Code)</label>
                <input
                  type="text"
                  placeholder="e.g. G-ALPHA"
                  value={groupIdInput}
                  onChange={(e) => setGroupIdInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-mono"
                  id="admin-add-group-id"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-mono uppercase mb-1">Default Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alpha Team"
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-display"
                  id="admin-add-group-name"
                />
              </div>

              {groupError && (
                <div className="text-rose-400 text-xs font-medium">{groupError}</div>
              )}

              <button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-display font-bold py-3.5 rounded-xl text-sm shadow cursor-pointer transform active:scale-95 transition flex items-center justify-center gap-2"
                id="admin-add-group-button"
              >
                <Plus className="w-4 h-4" /> Authorize &amp; Pre-generate Group
              </button>
            </form>
          </div>

          {/* Group Standings/List table */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-display font-extrabold text-white text-base border-b border-slate-800 pb-3 mb-4">Authorized Candidate Keys</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300" id="admin-groups-table">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 uppercase font-mono text-[9px]">
                    <th className="pb-3 font-semibold">STATUS</th>
                    <th className="pb-3 font-semibold">GROUP ID</th>
                    <th className="pb-3 font-semibold">VISUAL NAME</th>
                    <th className="pb-3 font-semibold text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {groups.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-950/20">
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`h-2.5 w-2.5 rounded-full ${g.joined ? 'bg-emerald-400 shadow shadow-emerald-400/50' : 'bg-slate-700'}`}></span>
                          <span className="font-mono text-[10px] text-slate-400">{g.joined ? 'CONNECTED' : 'PENDING'}</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono font-bold text-white uppercase">{g.id}</td>
                      <td className="py-3 font-display font-medium">{g.name}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onDeleteGroup(g.id)}
                          className="p-1 px-2.5 rounded bg-slate-950 text-rose-400 hover:bg-rose-950/30 font-mono text-[10px] uppercase font-bold border border-slate-800 cursor-pointer"
                        >
                          Revoke Key
                        </button>
                      </td>
                    </tr>
                  ))}

                  {groups.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-500 italic">No authorized groups. Enter records on left panel.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB: QUESTIONS CUSTOMIZER */}
      {activeSubTab === 'questions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6" id="admin-view-questions-block">
          
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-extrabold text-white text-base">Trivia Question Banks configuration</h3>
            <div className="flex items-center gap-1.5 border border-slate-800 rounded-xl p-1 bg-slate-950">
              {([1, 2, 3] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setQuestionsFilterRound(r)}
                  className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg focus:outline-none cursor-pointer ${
                    questionsFilterRound === r ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ROUND {r}
                </button>
              ))}
            </div>
          </div>

          {/* List of filtered questions */}
          <div className="space-y-4" id="admin-questions-list">
            {questions.filter(q => q.round === questionsFilterRound).map((q, idx) => {
              const isEditing = editingQuestionId === q.id;

              if (isEditing) {
                return (
                  <div key={q.id} className="bg-slate-950 border border-teal-500/50 rounded-2xl p-4 sm:p-5 space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-500 mb-1 font-mono uppercase text-[9px]">Question Heading ({idx + 1})</label>
                      <textarea
                        value={editQText}
                        onChange={(e) => setEditQText(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white text-sm focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                      <div>
                        <label className="block text-slate-500 mb-1 font-mono uppercase text-[9px]">Option A</label>
                        <input
                          type="text"
                          value={editQOptA}
                          onChange={(e) => setEditQOptA(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1 font-mono uppercase text-[9px]">Option B</label>
                        <input
                          type="text"
                          value={editQOptB}
                          onChange={(e) => setEditQOptB(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1 font-mono uppercase text-[9px]">Option C</label>
                        <input
                          type="text"
                          value={editQOptC}
                          onChange={(e) => setEditQOptC(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1 font-mono uppercase text-[9px]">Option D</label>
                        <input
                          type="text"
                          value={editQOptD}
                          onChange={(e) => setEditQOptD(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-500 mb-1 font-mono uppercase text-[9px]">Correct Answer</label>
                        <select
                          value={editQCorrect}
                          onChange={(e) => setEditQCorrect(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1 font-mono uppercase text-[9px]">Question Point Value</label>
                        <div className="w-full bg-slate-950 border border-slate-900 rounded-lg p-2.5 text-[#EE9200] font-mono text-xs font-semibold">
                          1 Point (Fixed)
                        </div>
                      </div>

                      <div className="self-end flex gap-2">
                        <button
                          onClick={() => handleSaveQuestion(q.id)}
                          className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-display font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                        >
                          <Save className="w-3.5 h-3.5" /> Save Changes
                        </button>
                        <button
                          onClick={() => setEditingQuestionId(null)}
                          className="bg-slate-800 text-slate-200 hover:bg-slate-700 py-2 px-3 rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>

                  </div>
                );
              }

              return (
                <div key={q.id} className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 flex justify-between gap-4 items-start select-none">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 font-bold uppercase">
                        Question {idx + 1}
                      </span>
                      <span className="text-[10px] text-teal-400 font-mono">({q.points} pt{q.points > 1 ? 's' : ''})</span>
                    </div>

                    <h4 className="font-display text-sm font-bold text-slate-100">{q.text}</h4>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px] pt-1">
                      <div className={`p-1 px-2.5 rounded border ${q.correctAnswer === 'A' ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400' : 'bg-slate-950 border-transparent text-slate-500'}`}>A: {q.options.A}</div>
                      <div className={`p-1 px-2.5 rounded border ${q.correctAnswer === 'B' ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400' : 'bg-slate-950 border-transparent text-slate-500'}`}>B: {q.options.B}</div>
                      <div className={`p-1 px-2.5 rounded border ${q.correctAnswer === 'C' ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400' : 'bg-slate-950 border-transparent text-slate-500'}`}>C: {q.options.C}</div>
                      <div className={`p-1 px-2.5 rounded border ${q.correctAnswer === 'D' ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400' : 'bg-slate-950 border-transparent text-slate-500'}`}>D: {q.options.D}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => startEditQuestion(q)}
                    className="p-1.5 px-3 rounded bg-slate-900 text-teal-400 border border-slate-800 hover:bg-teal-950/20 text-[10px] tracking-wider uppercase font-mono font-black shrink-0 cursor-pointer"
                  >
                    Adjust
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* SUBTAB: SPONSOR ADVERTISING */}
      {activeSubTab === 'ads' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="admin-view-ads-block">
          
          {/* Add Advertising flyer forms */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-display font-extrabold text-white text-base border-b border-slate-800 pb-3 mb-4">Create sponsorship flyers</h3>
            
            <form onSubmit={handleAddNewAd} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-xs font-mono uppercase mb-1">Company/Partner Title</label>
                <input
                  type="text"
                  placeholder="e.g. COFFEE ROASTERS INC."
                  value={adTitleInput}
                  onChange={(e) => setAdTitleInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-display font-semibold uppercase"
                  id="admin-add-ad-title"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-mono uppercase mb-1">Advertisement Slogan &amp; Message</label>
                <textarea
                  placeholder="e.g. 50% off espresso machines this week only using coupon code CODE50!"
                  value={adDescriptionInput}
                  onChange={(e) => setAdDescriptionInput(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-500 font-sans"
                  id="admin-add-ad-desc"
                />
              </div>

              {adError && (
                <div className="text-rose-400 text-xs font-medium">{adError}</div>
              )}

              <button
                type="submit"
                className="w-full bg-teal-500 hover:bg-teal-400 text-slate-950 font-display font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow cursor-pointer transform active:scale-95 transition flex items-center justify-center gap-1"
                id="admin-add-ad-button"
              >
                <PlusCircle className="w-4 h-4" /> Add Sponsorship Advertisement
              </button>
            </form>
          </div>

          {/* Advertisements Index list */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="font-display font-extrabold text-white text-base border-b border-slate-800 pb-3 mb-4">Advertising Banner Assets Rotator</h3>
            
            <div className="space-y-4" id="admin-ads-inventory">
              {ads.map((ad, idx) => {
                const isActiveRotation = state.adBannerIndex === idx;

                return (
                  <div 
                    key={ad.id} 
                    className={`p-4 rounded-xl border flex justify-between gap-4 items-center transition relative overflow-hidden ${
                      isActiveRotation 
                        ? 'bg-teal-950/10 border-teal-500/40 shadow-sm shadow-teal-500/5' 
                        : 'bg-slate-950/40 border-slate-900'
                    }`}
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-wider uppercase font-bold ${
                          isActiveRotation ? 'bg-teal-500 text-slate-950 animate-pulse' : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}>
                          {isActiveRotation ? 'Active Rotator Banner' : 'Sponsor Slot'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">IDX: #{idx}</span>
                      </div>
                      <h4 className="font-display text-sm font-bold text-white truncate uppercase">{ad.title}</h4>
                      <p className="text-xs text-slate-400 leading-normal line-clamp-2">{ad.description}</p>
                    </div>

                    <button
                      onClick={() => onDeleteAd(ad.id)}
                      className="p-1.5 rounded bg-slate-950 text-rose-400 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900 leading-none shrink-0 cursor-pointer flex items-center justify-center"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}

              {ads.length === 0 && (
                <div className="text-center py-8 text-slate-500 italic text-xs">No advertisement banners have been declared. Enter sponsored partner details on left sheet.</div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* SUBTAB: HISTORICAL SESSIONS */}
      {activeSubTab === 'sessions' && (
        <div className="space-y-6 animate-fade-in" id="admin-view-sessions-block">
          {/* Header Action card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
            <div>
              <h3 className="font-display font-extrabold text-white text-base flex items-center gap-2 uppercase tracking-wide">
                <Database className="w-5 h-5 text-[#EE9200]" />
                Tournament Session Archiver
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                The trivia system keeps score logs persistently in a JSON file database on the Cloud native container. Resetting or hard wiping the tournament automatically saves snapshots. You can also manually capture a picture of the current standings below.
              </p>
            </div>
            {onSaveSession && (
              <button
                onClick={async () => {
                  try {
                    await onSaveSession();
                  } catch (err) {
                    console.error('Error saving manual session:', err);
                  }
                }}
                className="bg-teal-600 hover:bg-teal-500 text-white font-mono font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition transform active:scale-95 duration-100 cursor-pointer shrink-0 flex items-center gap-1.5 shadow-md shadow-teal-900/10"
                id="admin-trigger-manual-archive"
              >
                <Save className="w-3.5 h-3.5" />
                Capture Live Standings
              </button>
            )}
          </div>

          {/* Sessions List */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-black block">
              Historic Records ({gameState.savedSessions?.length || 0} Saved)
            </h4>

            {gameState.savedSessions && gameState.savedSessions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {gameState.savedSessions.map((sess) => (
                  <div key={sess.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden group shadow-md hover:border-slate-700/60 transition duration-150">
                    <div>
                      <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl" role="img" aria-label="Event Logo">{sess.eventLogo || '🏆'}</span>
                          <div>
                            <h4 className="font-display font-extrabold text-sm text-slate-100 uppercase tracking-tight line-clamp-1">{sess.quizName}</h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{sess.completedAt}</p>
                          </div>
                        </div>
                        {onDeleteSession && (
                          <button
                            onClick={() => onDeleteSession(sess.id)}
                            className="bg-transparent text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 p-1.5 rounded-lg border border-transparent hover:border-rose-900/30 transition shadow-inner cursor-pointer"
                            title="Delete record from history"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="text-[9px] font-mono uppercase tracking-wider text-slate-500 border-b border-slate-800/40 pb-1 mb-1 flex justify-between font-black">
                          <span>Verified Groups Standings</span>
                          <span>Final Total</span>
                        </div>
                        {sess.finalScores && sess.finalScores.length > 0 ? (
                          sess.finalScores.map((score, ind) => (
                            <div key={score.groupId} className="flex justify-between items-center text-xs font-mono py-1.5 border-b border-slate-900/40 last:border-0">
                              <span className="text-slate-300 font-medium truncate max-w-[200px] flex items-center gap-2">
                                <span className={`text-[10px] font-black ${ind === 0 ? 'text-amber-400 animate-pulse' : ind === 1 ? 'text-slate-350 font-bold' : 'text-slate-500'}`}>
                                  #{ind + 1}
                                </span>
                                {score.groupName}
                              </span>
                              <span className={`font-bold ${ind === 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                                {score.score} pts
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center italic font-mono text-[10px] py-2 text-slate-600">No active groups scored during session</div>
                        )}
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-600 font-mono text-right mt-4 pt-2 border-t border-slate-800/40 flex justify-between items-center">
                      <span>Rounds count: {sess.roundsCount || 3}</span>
                      <span>ID: {sess.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950/40 border border-slate-900 border-dashed rounded-2xl py-12 px-6 text-center space-y-2">
                <Database className="w-8 h-8 text-slate-600 mx-auto" />
                <h5 className="font-display font-bold text-sm text-slate-400">Database History Clean Slate</h5>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-normal">
                  No historical event registers have been written yet. Triggering a Score Reset of a played quiz, or saving manually will append high-score screenshots here that persist across any dev build re-bundling.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
