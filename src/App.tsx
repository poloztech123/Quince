/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, Trophy, Settings, FileText, Megaphone, 
  RotateCw, ShieldAlert, Wifi, Laptop, Projector, HelpCircle 
} from 'lucide-react';
import { FullGameState, Question, Group } from './types';
import ParticipantView from './components/ParticipantView';
import CastView from './components/CastView';
import AdminView from './components/AdminView';
import ResultsView from './components/ResultsView';
import quince03 from './assets/images/Quince-03.png';
import sMotif01 from './assets/images/S Motif-01.png';
import webAd from './assets/images/Web AD.png';

export default function App() {
  // Active viewing aspect state: 'participant' | 'cast' | 'admin' | 'results'
  const [activeRole, setActiveRole] = useState<'participant' | 'cast' | 'admin' | 'results'>(() => {
    return (localStorage.getItem('quiz_active_role') as any) || 'participant';
  });

  // Real-time server state sync
  const [gameState, setGameState] = useState<FullGameState | null>(null);
  const [synced, setSynced] = useState(false);

  // Participant candidate tracking ID code
  const [joinedGroupId, setJoinedGroupId] = useState<string | null>(() => {
    return localStorage.getItem('quiz_joined_group_id');
  });

  // Track active role selection
  useEffect(() => {
    localStorage.setItem('quiz_active_role', activeRole);
  }, [activeRole]);

  // Establish continuous Server-Sent Events listening loop
  useEffect(() => {
    let sse: EventSource | null = null;
    let fallbackInterval: NodeJS.Timeout | null = null;

    // Fast bootstrap REST load
    const fetchBootstrapState = () => {
      fetch('/api/state')
        .then(res => res.json())
        .then(data => {
          setGameState(data);
          setSynced(true);
        })
        .catch(err => {
          console.error('API Sync Connection Failure:', err);
          setSynced(false);
        });
    };

    fetchBootstrapState();

    const connectSSE = () => {
      sse = new EventSource('/api/events');
      
      sse.onmessage = (event) => {
        try {
          const freshData = JSON.parse(event.data);
          setGameState(freshData);
          setSynced(true);
        } catch (e) {
          console.error('Error parsing sse data stream:', e);
        }
      };

      sse.onerror = (err) => {
        console.warn('SSE disconnected. Reverting to REST polling fallback...', err);
        setSynced(false);
        if (sse) sse.close();

        // Fallback REST polling if SSE fails
        if (!fallbackInterval) {
          fallbackInterval = setInterval(fetchBootstrapState, 2000);
        }

        // Retry connections
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      if (sse) sse.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  // PARTICIPANT ACTIONS
  const handleLogout = () => {
    localStorage.removeItem('quiz_joined_group_id');
    setJoinedGroupId(null);
  };

  const handleJoin = async (groupId: string, groupName: string) => {
    try {
      const res = await fetch('/api/client/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, groupName })
      });
      const data = await res.json();
      if (res.ok) {
        setJoinedGroupId(data.group.id);
        localStorage.setItem('quiz_joined_group_id', data.group.id);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (e) {
      return { success: false, error: 'Check your internet connection and try again.' };
    }
  };

  const handleSubmitAnswer = async (groupId: string, questionId: string, option: 'A' | 'B' | 'C' | 'D') => {
    try {
      const res = await fetch('/api/client/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, questionId, selectedOption: option })
      });
      const data = await res.json();
      if (res.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (e) {
      return { success: false, error: 'Answer registration failed.' };
    }
  };

  // ADMIN OPERATIONS
  const handleResetQuiz = async (options: { quizName: string; eventLogo: string; resetGroups: boolean }) => {
    await fetch('/api/admin/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    if (options.resetGroups) {
      setJoinedGroupId(null);
      localStorage.removeItem('quiz_joined_group_id');
    }
  };

  const handleStartQuiz = async () => {
    await fetch('/api/admin/start', { method: 'POST' });
  };

  const handleNextQuestion = async () => {
    await fetch('/api/admin/next', { method: 'POST' });
  };

  const handleTogglePause = async (isPaused: boolean) => {
    await fetch('/api/admin/toggle-pause', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPaused })
    });
  };

  const handleOverrideTimer = async (seconds: number) => {
    await fetch('/api/admin/override-timer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seconds })
    });
  };

  const handleAddGroup = async (id: string, name: string) => {
    const res = await fetch('/api/admin/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name })
    });
    return res.ok;
  };

  const handleDeleteGroup = async (id: string) => {
    await fetch(`/api/admin/groups/${id}`, { method: 'DELETE' });
  };

  const handleAddAd = async (title: string, description: string) => {
    await fetch('/api/admin/ads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });
  };

  const handleDeleteAd = async (id: string) => {
    await fetch(`/api/admin/ads/${id}`, { method: 'DELETE' });
  };

  const handleUpdateQuestions = async (list: Question[]) => {
    await fetch('/api/admin/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ list })
    });
  };

  const handleUpdateSettings = async (maxRounds: number, intermissionDuration: number, questionDuration: number) => {
    await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ maxRounds, intermissionDuration, questionDuration })
    });
  };

  const handleSaveSession = async () => {
    await fetch('/api/admin/sessions/save', { method: 'POST' });
  };

  const handleDeleteSession = async (id: string) => {
    await fetch(`/api/admin/sessions/${id}`, { method: 'DELETE' });
  };

  // Render loading screen while bootstrapping State
  if (!gameState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-center" id="global-sync-loader">
        <div className="relative flex mb-4">
          <RotateCw className="w-10 h-10 text-brand-pink animate-spin" />
        </div>
        <h2 className="font-display text-lg font-bold text-white tracking-wide">Syncing Automated Quiz Engine</h2>
        <p className="text-xs text-brand-secondary mt-1 max-w-xs leading-normal">Establishing multi-screen socket connection. Please ensure full-stack server is launching on background container.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden" id="app-workspace-root">
      
      {/* Background S Motif-01 Watermark Overlay on Entire Screens */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-10 bg-cover bg-center z-0 mix-blend-screen bg-no-repeat" 
        style={{ backgroundImage: `url(${sMotif01})` }}
      ></div>

      {/* DESIGN Gateway Role Router top-navbar */}
      <header className="bg-black/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 px-4 py-3 sm:py-4 shadow-xl" id="role-selection-bar">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-4 relative z-10">
          
          {/* Logo & Network Status - Enlarged Quince-03 Logo without Quiz Fridays Text */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img 
                src={quince03} 
                alt="Quince Logo" 
                className="relative h-24 sm:h-28 w-auto max-w-full object-contain transition duration-300 transform group-hover:scale-105" 
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-mono leading-none font-bold uppercase transition duration-300 ${
              synced ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' : 'bg-rose-950/40 text-rose-400 border border-rose-900/40'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${synced ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
              {synced ? 'SYNCED_LIVE' : 'RECONNECTING_WIFI'}
            </div>
          </div>

          {/* Router Role Selector buttons */}
          <nav className="flex items-center gap-1 bg-slate-900 p-1.5 border border-slate-800 rounded-2xl w-full lg:w-auto overflow-x-auto scrollbar-none" id="role-navigation-menu">
            <button
              onClick={() => setActiveRole('participant')}
              className={`px-4.5 py-2.5 text-xs font-mono uppercase tracking-wider rounded-xl focus:outline-none flex items-center gap-2 whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                activeRole === 'participant' 
                  ? 'bg-[#EE9200] text-black font-extrabold shadow-lg shadow-[#EE9200]/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-950'
              }`}
              id="role-trigger-participant"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span>Participant App</span>
            </button>
            <button
              onClick={() => setActiveRole('cast')}
              className={`px-4.5 py-2.5 text-xs font-mono uppercase tracking-wider rounded-xl focus:outline-none flex items-center gap-2 whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                activeRole === 'cast' 
                  ? 'bg-[#EE9200] text-black font-extrabold shadow-lg shadow-[#EE9200]/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-950'
              }`}
              id="role-trigger-cast"
            >
              <Projector className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>Projector Cast</span>
            </button>
            <button
              onClick={() => setActiveRole('results')}
              className={`px-4.5 py-2.5 text-xs font-mono uppercase tracking-wider rounded-xl focus:outline-none flex items-center gap-2 whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                activeRole === 'results' 
                  ? 'bg-[#EE9200] text-black font-extrabold shadow-lg shadow-[#EE9200]/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-950'
              }`}
              id="role-trigger-results"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Scores Table</span>
            </button>
            <button
              onClick={() => setActiveRole('admin')}
              className={`px-4.5 py-2.5 text-xs font-mono uppercase tracking-wider rounded-xl focus:outline-none flex items-center gap-2 whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer ${
                activeRole === 'admin' 
                  ? 'bg-[#EE9200] text-black font-extrabold shadow-lg shadow-[#EE9200]/25' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-950'
              }`}
              id="role-trigger-admin"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          </nav>

        </div>
      </header>

      {/* Main Responsive Routing Canvas */}
      <main className="flex-1 w-full bg-transparent relative z-10 pb-28 md:pb-32" id="route-render-view">
        {activeRole === 'participant' && (
          <ParticipantView
            gameState={gameState}
            joinedGroupId={joinedGroupId}
            onJoin={handleJoin}
            onSubmitAnswer={handleSubmitAnswer}
            onLogout={handleLogout}
          />
        )}

        {activeRole === 'cast' && (
          <CastView gameState={gameState} />
        )}

        {activeRole === 'results' && (
          <ResultsView gameState={gameState} />
        )}

        {activeRole === 'admin' && (
          <AdminView
            gameState={gameState}
            onResetQuiz={handleResetQuiz}
            onStartQuiz={handleStartQuiz}
            onNextQuestion={handleNextQuestion}
            onTogglePause={handleTogglePause}
            onOverrideTimer={handleOverrideTimer}
            onAddGroup={handleAddGroup}
            onDeleteGroup={handleDeleteGroup}
            onAddAd={handleAddAd}
            onDeleteAd={handleDeleteAd}
            onUpdateQuestions={handleUpdateQuestions}
            onUpdateSettings={handleUpdateSettings}
            onSaveSession={handleSaveSession}
            onDeleteSession={handleDeleteSession}
          />
        )}
      </main>

      {/* Global Sticky Web AD Banner at the bottom of all screens (Clutter-free, Clean Image only) */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-950/90 backdrop-blur-md z-50 py-2 sm:py-3 flex justify-center items-center shadow-[0_-10px_35px_rgba(0,0,0,0.7)]" id="global-web-ad">
        <div className="max-w-xl w-full px-4 animate-fade-in flex justify-center">
          <div className="w-full max-w-lg h-14 sm:h-18 rounded-none overflow-hidden bg-black/60 shadow-inner">
            <img 
              src={webAd} 
              alt="Spotlight Banner" 
              className="w-full h-full object-contain rounded-none"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>



    </div>
  );
}
