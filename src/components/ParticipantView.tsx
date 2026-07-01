/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Users, CheckCircle2, XCircle, Timer, Award, Landmark, Play, AlertCircle, LogOut } from 'lucide-react';
import { FullGameState, Question, AnswerSubmission, AdBanner } from '../types';
import quince02 from '../assets/images/Quince-02.png';
import quince03 from '../assets/images/Quince-03.png';
import sMotif01 from '../assets/images/S Motif-01.png';
import webAd from '../assets/images/Web AD.png';

interface ParticipantViewProps {
  gameState: FullGameState;
  joinedGroupId: string | null;
  onJoin: (groupId: string, groupName: string) => Promise<{ success: boolean; error?: string }>;
  onSubmitAnswer: (groupId: string, questionId: string, option: 'A' | 'B' | 'C' | 'D') => Promise<{ success: boolean; error?: string }>;
  onLogout?: () => void;
}

export default function ParticipantView({
  gameState,
  joinedGroupId,
  onJoin,
  onSubmitAnswer,
  onLogout
}: ParticipantViewProps) {
  const { state, questions, groups, submissions, ads, scores } = gameState;

  // Welcome state when client first enters
  const [showWelcome, setShowWelcome] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('has_seen_welcome');
    }
    return true;
  });

  // Form states
  const [groupIdForm, setGroupIdForm] = useState('');
  const [groupNameForm, setGroupNameForm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [joinedMessage, setJoinedMessage] = useState('');

  // Quiz interactive States
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [localFeedbackStatus, setLocalFeedbackStatus] = useState<'correct' | 'wrong' | null>(null);

  // Active advertisement banner
  const activeAd: AdBanner | undefined = ads[state.adBannerIndex];

  // Map active question info
  const activeQuestionsList = questions.filter(q => q.round === state.currentRound);
  const currentQuestion: Question | undefined = activeQuestionsList[state.currentQuestionIndex];
  
  // Checking active user details
  const myGroup = groups.find(g => g.id === joinedGroupId);
  const mySubmissionsForThisQuestion: AnswerSubmission | undefined = currentQuestion && submissions[currentQuestion.id]?.[joinedGroupId || ''];

  // Reset local selection when question changes or restore previously submitted answer
  useEffect(() => {
    if (mySubmissionsForThisQuestion) {
      setSelectedOption(mySubmissionsForThisQuestion.selectedOption);
    } else {
      setSelectedOption(null);
    }
    setLocalFeedbackStatus(null);
    setSubmitError('');
  }, [state.currentQuestionIndex, state.currentRound, state.status, mySubmissionsForThisQuestion?.selectedOption]);

  // Determine feedback status
  useEffect(() => {
    if (state.status === 'reveal' && mySubmissionsForThisQuestion) {
      if (mySubmissionsForThisQuestion.isCorrect) {
        setLocalFeedbackStatus('correct');
      } else {
        setLocalFeedbackStatus('wrong');
      }
    }
  }, [state.status, mySubmissionsForThisQuestion]);

  // Handle Joining
  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupIdForm.trim() || !groupNameForm.trim()) {
      setErrorMessage('Please complete both Group Name and Group ID.');
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    const res = await onJoin(groupIdForm.trim(), groupNameForm.trim());
    setIsLoading(false);

    if (res.success) {
      setJoinedMessage('Successfully re-synced! You are in.');
      setTimeout(() => setJoinedMessage(''), 4000);
    } else {
      setErrorMessage(res.error || 'Connection failed.');
    }
  };

  // Handle Answering
  const handleSubmitAnswerClick = async () => {
    if (!joinedGroupId || !currentQuestion || !selectedOption) return;

    setIsSubmitting(true);
    setSubmitError('');

    const res = await onSubmitAnswer(joinedGroupId, currentQuestion.id, selectedOption);
    setIsSubmitting(false);

    if (!res.success) {
      setSubmitError(res.error || 'Failed to submit answer.');
    }
  };

  // Late Joining detection - skips counts
  const renderLateJoinAlert = () => {
    if (state.status !== 'lobby' && state.status !== 'ended') {
      const skippedCount = state.currentQuestionIndex + (state.currentRound - 1) * 20;
      if (skippedCount > 0) {
        return (
          <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 text-xs text-amber-300 flex items-start gap-2 mb-4 animate-fade-in" id="late-join-alert">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold block">Mid-Quiz Sync Active</span>
              You have joined during Round {state.currentRound}, Question {state.currentQuestionIndex + 1}. 
              Previous {skippedCount} questions are marked as skipped (0 points).
            </div>
          </div>
        );
      }
    }
    return null;
  };

  const getLetterThemeClass = (letter: 'A' | 'B' | 'C' | 'D') => {
    const isSelected = selectedOption === letter;
    const submittedRecord = mySubmissionsForThisQuestion;
    const hasSubmitted = !!submittedRecord;
    const isMySubmittedChoice = hasSubmitted && submittedRecord.selectedOption === letter;

    if (state.status === 'reveal') {
      const isCorrectChoice = currentQuestion?.correctAnswer === letter;
      if (isCorrectChoice) return 'bg-emerald-500/20 border-emerald-500 text-emerald-300';
      if (isMySubmittedChoice) return 'bg-rose-500/20 border-rose-500 text-rose-300';
      return 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-50';
    }

    // Active gameplay selection
    if (isSelected) {
      return 'bg-brand-pink/20 border-brand-pink text-brand-pink font-semibold ring-2 ring-brand-pink/30';
    }

    if (isMySubmittedChoice) {
      return 'bg-sky-500/10 border-sky-500/30 text-sky-400';
    }

    return 'bg-slate-900/50 hover:bg-slate-950 border-slate-800 text-slate-200';
  };

  // Convert break timer to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Welcome portal view - shows on very first load to display a stunning greeting with the brand logo & motif!
  if (showWelcome) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col justify-center items-center p-4 relative overflow-hidden" id="participant-welcome-screen">
        <div 
          className="absolute inset-0 pointer-events-none opacity-20 bg-cover bg-center z-0 bg-no-repeat" 
          style={{ backgroundImage: `url(${sMotif01})` }}
        ></div>

        <div className="w-full max-w-sm bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 text-center flex flex-col items-center space-y-8">
          <div className="inline-flex items-center justify-center w-36 h-36 rounded-3xl bg-black border border-[#EE9200]/40 p-5 shadow-lg shadow-[#EE9200]/20 overflow-hidden relative group">
            <img 
              src={quince03} 
              alt="Quince Logo" 
              className="w-full h-full object-contain relative z-10 transition duration-300 transform group-hover:scale-105" 
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="w-full pt-2">
            <button
              onClick={() => {
                setShowWelcome(false);
                sessionStorage.setItem('has_seen_welcome', 'true');
              }}
              className="w-full bg-gradient-to-r from-[#EE9200] to-amber-500 hover:from-[#EE9200]/90 hover:to-amber-500/90 text-slate-950 font-display font-black py-4 px-4 rounded-xl shadow-lg shadow-[#EE9200]/10 focus:outline-none transition-all duration-150 transform active:scale-95 text-xs uppercase tracking-wider font-extrabold cursor-pointer"
              id="welcome-enter-btn"
            >
              Enter Tournament
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render Login / Group registration
  if (!joinedGroupId || !myGroup) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col justify-between items-center p-4 relative overflow-hidden" id="participant-registration-flow">
        {/* Motif background overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-10 bg-cover bg-center z-0 bg-no-repeat" 
          style={{ backgroundImage: `url(${sMotif01})` }}
        ></div>

        <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl mt-10 relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-black border border-[#EE9200]/40 mb-5 shadow-lg shadow-[#EE9200]/10 overflow-hidden">
              <img 
                src={quince02} 
                alt="Quince-02 Logo" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </div>
            <h1 className="font-display text-2xl font-black tracking-tight text-white sm:text-3xl">Group Registration</h1>
            <p className="text-sm text-brand-secondary mt-2 font-medium">Enter credentials configured by the Quiz master.</p>
          </div>

          <form onSubmit={handleJoinSubmit} className="space-y-4">
           <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-brand-secondary mb-1">Group Name</label>
              <input
                type="text"
                placeholder="e.g. Brainiacs"
                value={groupNameForm}
                onChange={(e) => setGroupNameForm(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink focus:placeholder-transparent placeholder-slate-600 transition duration-150 font-display font-medium"
                id="group-name-input"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-mono tracking-wider text-brand-secondary mb-1">Group ID</label>
              <input
                type="text"
                placeholder="e.g. Q-ALPHA"
                value={groupIdForm}
                onChange={(e) => setGroupIdForm(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-brand-pink/50 focus:border-brand-pink focus:placeholder-transparent placeholder-slate-600 transition duration-150 font-mono font-bold"
                id="group-id-input"
              />
            </div>

           

            {errorMessage && (
              <div className="bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs rounded-xl p-3 flex gap-2 items-start" id="join-error">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-brand-pink to-brand-violet hover:from-brand-pink/95 hover:to-brand-violet/95 text-white font-display font-black py-4 px-4 rounded-xl shadow-lg shadow-brand-pink/20 focus:outline-none transition-all duration-150 transform active:scale-95 disabled:opacity-50 text-base font-bold cursor-pointer"
              id="join-button"
            >
              {isLoading ? 'Authenticating...' : 'Join Battle'}
            </button>
          </form>


        </div>
      </div>
    );
  }

  // Active Score
  const myTotalScore = scores.totalScores[joinedGroupId] || 0;
  const myRoundScore = scores.roundScores[joinedGroupId]?.[state.currentRound] || 0;

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-between p-4 pb-20 relative overflow-hidden" id="participant-lobby-gameplay">
      {/* Motif background overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10 bg-cover bg-center z-0 bg-no-repeat" 
        style={{ backgroundImage: `url(${sMotif01})` }}
      ></div>
      
      {/* Participant Header Summary */}
      <div className="w-full max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-between items-center shadow-lg gap-3 relative z-10" id="participant-hud-header">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-[#EE9200]/10 border border-[#EE9200]/20 flex items-center justify-center text-lg shrink-0">
            {state.eventLogo}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-display font-bold text-sm text-white truncate max-w-[120px] sm:max-w-[180px]">{myGroup?.name}</h3>
            <span className="text-[10px] text-slate-400 font-mono block truncate">ID: {joinedGroupId}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="flex gap-2 sm:gap-4">
            <div className="text-right">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">R{state.currentRound} Score</span>
              <span className="font-mono text-xs font-semibold text-teal-300">+{myRoundScore} pts</span>
            </div>
            <div className="h-6 w-px bg-slate-800 self-center"></div>
            <div className="text-right">
              <span className="text-[9px] text-slate-500 uppercase font-mono block">Total Score</span>
              <span className="font-mono text-xs font-bold text-sky-400">+{myTotalScore} pts</span>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 ml-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition border border-transparent hover:border-rose-900/40 cursor-pointer shrink-0"
              title="Logout / Exit Battle"
              id="participant-logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Status Container */}
      <div className="w-full max-w-xl mx-auto flex-1 flex flex-col justify-center py-6 relative z-10" id="participant-main-canvas">
        {joinedMessage && (
          <div className="mb-4 text-center bg-teal-950/40 border border-teal-800 rounded-xl p-2.5 text-xs text-teal-300">
            {joinedMessage}
          </div>
        )}
        
        {renderLateJoinAlert()}

        {/* State: LOBBY (WAITINGROOM) */}
        {state.status === 'lobby' && (
          <div className="text-center bg-slate-900/80 border border-slate-800/80 rounded-2xl p-8" id="status-lobby-card">
            <div className="relative inline-flex mb-4">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </span>
            </div>
            
            <h2 className="font-display text-xl font-bold text-white mb-2">Connected to Quince</h2>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mb-6">
              The game admin hasn\'t initiated the tournament yet. Enjoy refreshments while everyone registers, the quiz will sync automatically!
            </p>
            
            <div className="border border-slate-800 bg-slate-950/40 rounded-xl p-4 inline-flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-300">
                Registered Teams: <span className="font-mono font-bold text-white">{groups.filter(g => g.joined).length}</span>
              </span>
            </div>
          </div>
        )}

        {/* State: ACTIVE QUESTION OR REVEAL */}
        {(state.status === 'question' || state.status === 'reveal') && currentQuestion && (
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6" id="status-quiz-playcard">
            
            {/* Status Metadata */}
            <div className="flex justify-between items-center mb-5 gap-3">
              <span className="px-2.5 py-1.5 text-[10px] font-mono font-bold bg-slate-850 text-slate-300 tracking-wider rounded-xl border border-slate-800">
                ROUND {state.currentRound} • QUESTION {state.currentQuestionIndex + 1}/20
              </span>

              {/* Circular Timer Progress Indicator */}
              <div className="relative shrink-0 flex items-center justify-center">
                <div className={`absolute -inset-1 rounded-full blur bg-[#EE9200]/10 ${state.timer < 10 ? 'bg-rose-500/20 animate-pulse' : ''}`}></div>
                <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-slate-950 border border-slate-800/80 shadow-xl">
                  <svg className="w-14 h-14 transform -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      className="text-slate-900"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="transparent"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      className={`${state.timer < 10 ? 'text-rose-500' : 'text-[#EE9200]'} transition-all duration-300`}
                      strokeWidth="3.5"
                      strokeDasharray={2 * Math.PI * 22}
                      strokeDashoffset={2 * Math.PI * 22 - ( (state.timerMax > 0 ? state.timer / state.timerMax : 0) * 2 * Math.PI * 22 )}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                    />
                  </svg>
                  <span className={`absolute font-mono text-sm font-black ${state.timer < 10 ? 'text-rose-400 animate-pulse' : 'text-slate-100'}`}>
                    {state.timer}
                  </span>
                </div>
              </div>
            </div>

            {/* Question Heading */}
            <h2 className="font-display text-base sm:text-lg font-bold text-white leading-relaxed mb-6" id="quiz-question-text">
              {currentQuestion.text}
            </h2>

            {/* Options List */}
            <div className="space-y-3 mb-6" id="quiz-options-box">
              {(['A', 'B', 'C', 'D'] as const).map((letter) => {
                const isMySelection = selectedOption === letter;
                const submittedRecord = submissions[currentQuestion.id]?.[joinedGroupId];
                const hasSub = !!submittedRecord;
                const isMySubmittedOption = hasSub && submittedRecord.selectedOption === letter;

                return (
                  <button
                    key={letter}
                    disabled={state.status === 'reveal'}
                    onClick={() => setSelectedOption(letter)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 relative flex items-center min-h-[52px] ${getLetterThemeClass(letter)}`}
                    id={`option-${letter}-button`}
                  >
                    <div className="flex items-center gap-3 pr-8 w-full">
                      <span className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                        isMySelection 
                          ? 'bg-brand-pink text-white shadow font-black' 
                          : isMySubmittedOption
                            ? 'bg-sky-500 text-slate-950 font-black'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {letter}
                      </span>
                      <span className="text-sm font-medium leading-snug">{currentQuestion.options[letter]}</span>
                    </div>

                    {/* Selection labels */}
                    {isMySelection && !isMySubmittedOption && (
                      <span className="absolute right-3 px-2 py-0.5 rounded text-[9px] font-mono tracking-wider font-semibold bg-brand-pink text-white animate-bounce">
                        SELECTED
                      </span>
                    )}

                    {isMySubmittedOption && state.status !== 'reveal' && (
                      <span className="absolute right-3 px-2 py-0.5 rounded text-[9px] font-mono tracking-wider font-bold bg-sky-500 text-slate-950">
                        {isMySelection ? 'SUBMITTED & SELECTED' : 'SUBMITTED ANSWER'}
                      </span>
                    )}

                    {hasSub && isMySubmittedOption && state.status === 'reveal' && (
                      <div className="absolute right-3">
                        {submittedRecord.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-400" />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Submision Controller */}
            {state.status === 'question' && (
              <div className="space-y-3">
                {mySubmissionsForThisQuestion && (
                  <div className="bg-sky-950/20 border border-sky-800/40 text-sky-300 rounded-xl p-3 text-center text-xs">
                    <p className="font-semibold">✓ Answer Registered!</p>
                    <p className="text-[10px] mt-0.5 text-slate-400">You can change your mind, select another choice, and submit to update it anytime before the timer ends.</p>
                  </div>
                )}
                <div>
                  {submitError && (
                    <div className="mb-3 text-rose-400 text-xs bg-rose-950/30 p-2.5 rounded-lg border border-rose-900 border-dashed">
                      {submitError}
                    </div>
                  )}
                  <button
                    disabled={!selectedOption || isSubmitting}
                    onClick={handleSubmitAnswerClick}
                    className={`w-full py-4 px-4 font-display font-black text-black rounded-xl shadow-lg transition duration-200 transform scale-100 active:scale-95 disabled:opacity-40 disabled:scale-100 ${
                      selectedOption 
                        ? 'bg-[#EE9200] hover:bg-[#EE9200]/90 cursor-pointer shadow-[#EE9200]/30' 
                        : 'bg-slate-850 text-slate-500 border border-slate-800'
                    }`}
                    id="submit-choice-button"
                  >
                    {isSubmitting 
                      ? 'Registering...' 
                      : mySubmissionsForThisQuestion 
                        ? (selectedOption === mySubmissionsForThisQuestion.selectedOption ? 'Resubmit Answer' : 'Update Submitted Answer') 
                        : 'Submit Answer'}
                  </button>
                </div>
              </div>
            )}

            {/* FEEDBACK STATUS OVERLAY */}
            {state.status === 'reveal' && (
              <div className="mt-4" id="reveal-feedback-banner">
                {mySubmissionsForThisQuestion ? (
                  mySubmissionsForThisQuestion.isCorrect ? (
                    <div className="bg-emerald-950/30 border border-emerald-800 text-emerald-400 rounded-xl p-4 text-center animate-pulse">
                      <h4 className="font-display font-extrabold text-base mb-1">✨ CORRECT!</h4>
                      <p className="text-xs">Your group earned <span className="font-bold underline text-white">+{currentQuestion.points} Points</span> for answering correctly!</p>
                    </div>
                  ) : (
                    <div className="bg-rose-950/30 border border-rose-900 text-rose-400 rounded-xl p-4 text-center">
                      <h4 className="font-display font-extrabold text-base mb-1">❌ INCORRECT</h4>
                      <p className="text-xs">The correct answer was <span className="font-mono font-bold text-white">[{currentQuestion.correctAnswer}]</span>. You received 0 marks.</p>
                    </div>
                  )
                ) : (
                  <div className="bg-slate-950 border border-slate-800 text-slate-400 rounded-xl p-4 text-center text-xs">
                    <span className="font-bold text-rose-400 block mb-1">⚠️ TIME EXPIRED</span>
                    No answer was submitted for this question. Your group received 0 points.
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* State: 15-MINUTE INTERMISSION BREAK COUNTDOWN */}
        {state.status === 'intermission' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl max-w-lg mx-auto w-full" id="status-intermission-clientcard">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-4 animate-bounce">
              <Timer className="w-7 h-7" />
            </div>
            
            <h2 className="font-display text-xl font-bold text-white">Round Intermission</h2>
            <p className="text-xs text-slate-400 mt-1 mb-6">Take a break! The next round will begin automatically when the timer finishes.</p>
            
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 mb-6 max-w-xs mx-auto">
              <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block mb-1">NEXT ROUND IN</span>
              <span className="font-mono text-3xl font-extrabold text-amber-400 tracking-tight">
                {formatTime(state.timer)}
              </span>
            </div>


          </div>
        )}

        {/* State: TOURNAMENT ENDED */}
        {state.status === 'ended' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-md mx-auto w-full" id="status-ended-clientcard">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 mb-4 shadow shadow-amber-500/10">
              <Trophy className="w-8 h-8 text-slate-950 font-bold" />
            </div>

            <h2 className="font-display text-2xl font-black text-white">Quiz Finished!</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">The quiz tournament has concluded. Review final standings on the main projector cast screen.</p>

            <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto my-6">
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[8px] text-slate-500 font-mono tracking-wider block">FINAL STANDING</span>
                <span className="font-mono text-lg font-bold text-amber-400">
                  #{Object.entries(scores.totalScores)
                    .sort((a,b) => b[1] - a[1])
                    .findIndex(x => x[0] === joinedGroupId) + 1}
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3">
                <span className="text-[8px] text-slate-500 font-mono tracking-wider block">TOTAL CREDITS</span>
                <span className="font-mono text-lg font-bold text-teal-400">+{myTotalScore}</span>
              </div>
            </div>

            <div className="border border-slate-800/60 rounded-xl bg-slate-950/20 p-4 font-mono text-xs text-slate-400 text-left">
              <span className="text-[9px] text-slate-500 block mb-1 uppercase font-bold text-center">PERFORMANCE SCOREBOARD</span>
              <div className="space-y-1.5 mt-2">
                <div className="flex justify-between items-center border-b border-slate-900 pb-1">
                  <span>Round 1 Score</span>
                  <span className="text-white font-medium">+{scores.roundScores[joinedGroupId]?.[1] || 0} pts</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-900 pb-1">
                  <span>Round 2 Score</span>
                  <span className="text-white font-medium">+{scores.roundScores[joinedGroupId]?.[2] || 0} pts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Round 3 Score</span>
                  <span className="text-white font-medium">+{scores.roundScores[joinedGroupId]?.[3] || 0} pts</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
