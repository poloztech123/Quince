/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Medal, Trophy, Users, Timer, Sparkles, AlertCircle, Award } from 'lucide-react';
import { FullGameState, Question, AnswerSubmission, Group } from '../types';

interface CastViewProps {
  gameState: FullGameState;
}

export default function CastView({ gameState }: CastViewProps) {
  const { state, questions, groups, submissions, ads, scores } = gameState;

  // Active advertisement
  const activeAd = ads[state.adBannerIndex];

  // Active question info
  const activeQuestionsList = questions.filter(q => q.round === state.currentRound);
  const currentQuestion: Question | undefined = activeQuestionsList[state.currentQuestionIndex];

  // Submissions for the active question
  const currentQSubmissions = useMemo(() => {
    if (!currentQuestion) return {};
    return submissions[currentQuestion.id] || {};
  }, [currentQuestion, submissions]);

  // Total count of joined groups
  const joinedGroups = useMemo(() => {
    return groups.filter(g => g.joined);
  }, [groups]);

  // Number of submissions recorded so far
  const submitCount = useMemo(() => {
    return Object.keys(currentQSubmissions).length;
  }, [currentQSubmissions]);

  // Round rankings: filter & sort strictly by performance on the current active round
  const roundRankings = useMemo(() => {
    const roundNum = state.currentRound;
    return joinedGroups.map(g => {
      const roundScore = scores.roundScores[g.id]?.[roundNum] || 0;
      const totalScore = scores.totalScores[g.id] || 0;
      
      // Calculate how many answers they have in this round
      let correctAnswersCount = 0;
      activeQuestionsList.forEach(q => {
        const sub = submissions[q.id]?.[g.id];
        if (sub && sub.isCorrect) {
          correctAnswersCount++;
        }
      });

      return {
        ...g,
        roundScore,
        totalScore,
        correctCount: correctAnswersCount
      };
    }).sort((a, b) => {
      if (b.roundScore !== a.roundScore) {
        return b.roundScore - a.roundScore; // Sort descending
      }
      return b.totalScore - a.totalScore; // Tie breaker by overall score
    });
  }, [joinedGroups, state.currentRound, activeQuestionsList, submissions, scores]);

  // Overall cumulative rankings for end scorecard
  const overallRankings = useMemo(() => {
    return joinedGroups.map(g => {
      const totalScore = scores.totalScores[g.id] || 0;
      return {
        ...g,
        totalScore
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [joinedGroups, scores]);

  // Convert seconds to format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Percent progress of question timer representation
  const timerPercent = useMemo(() => {
    if (state.timerMax === 0) return 0;
    return (state.timer / state.timerMax) * 100;
  }, [state.timer, state.timerMax]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-950 text-white flex flex-col justify-between p-6 pb-24 overflow-hidden md:p-10 relative" id="cast-projector-view">
      
      {/* Background ambient radial gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-pink/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-violet/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Broadcasting Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-brand-purple rounded-3xl p-5 border border-slate-800 shadow-xl gap-4 z-10" id="cast-broadcaster-header">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-tr from-brand-pink to-brand-violet rounded-xl flex items-center justify-center font-bold text-2xl italic text-white shadow-lg">
            {state.eventLogo || 'Q'}
          </div>
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight uppercase leading-none text-white">{state.quizName}</h1>
            <p className="text-brand-secondary text-xs font-semibold tracking-widest uppercase mt-1">Live Projector Broadcast • Round {state.currentRound}</p>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          {state.status === 'question' && (
            <div className="bg-[#120B38] border border-slate-800 px-4 py-2 rounded-xl text-center flex items-center gap-3">
              <Users className="w-4 h-4 text-brand-secondary" />
              <div className="text-left font-mono">
                <span className="text-[9px] text-slate-500 uppercase block leading-none">Submissions</span>
                <span className="text-xs font-bold text-brand-mint">{submitCount} / {joinedGroups.length} Teams</span>
              </div>
            </div>
          )}

          <div className="bg-[#120B38] border border-slate-800 px-5 py-2.5 rounded-xl font-display text-center">
            <span className="text-[9px] text-slate-500 tracking-wider uppercase block leading-none">Tournament Pacing</span>
            <span className="text-xs font-mono uppercase font-black text-white tracking-widest mt-1 block">
              {state.status === 'lobby' && 'LOBBY OPEN'}
              {state.status === 'question' && 'ANSWERS OPEN'}
              {state.status === 'reveal' && 'SCORE REVEAL'}
              {state.status === 'intermission' && 'INTERMISSION'}
              {state.status === 'ended' && 'COMPLETED'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 my-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch z-10" id="cast-main-grid">
        
        {/* Left column / Central area: Question Canvas */}
        <div className="lg:col-span-2 flex flex-col justify-center" id="cast-question-outer">
          
          <AnimatePresence mode="wait">
            {/* LOBBY STATE */}
            {state.status === 'lobby' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                key="lobby-screen"
                className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 sm:p-12 text-center"
              >
                <div className="max-w-xl mx-auto">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest bg-teal-500/10 border border-teal-500/20 text-teal-300 uppercase">
                    Tournament Registration Mode
                  </span>
                  
                  <h2 className="font-display text-4xl sm:text-5xl font-black text-white mt-6 mb-4 tracking-tight leading-tight">
                    Welcome to the The Challenge!
                  </h2>
                  <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-8">
                    Organizers: add group names in the controls panel. Teams: scan or enter the quiz portal in your mobile browser, sign-in, and wait for launch!
                  </p>

                  <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-6 sm:p-8 max-w-md mx-auto">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 mb-4">Connected Participants</h3>
                    
                    {joinedGroups.length === 0 ? (
                      <div className="text-slate-500 text-xs italic py-4">Waiting for first participant to establish connection...</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {joinedGroups.map((g) => (
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            key={g.id}
                            className="bg-slate-900/60 border border-slate-800/50 px-4 py-3 rounded-xl flex items-center gap-2.5 text-left truncate"
                          >
                            <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0 shadow shadow-emerald-400/50 animate-pulse"></span>
                            <span className="text-sm font-semibold text-white truncate">{g.name}</span>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* QUESTION DISPLAY STATE */}
            {state.status === 'question' && currentQuestion && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                key={`question-${currentQuestion.id}`}
                className="bg-white rounded-[2.5rem] p-8 md:p-10 flex flex-col justify-between h-full relative shadow-[0_20px_50px_rgba(0,0,0,0.35)] border-2 border-slate-100/10"
              >
                {/* Visual Ribbon Badge */}
                <span className="absolute -top-4 -left-4 bg-[#FF0080] text-white px-6 py-2 rounded-full font-black text-xs tracking-wider shadow-lg">
                  QUESTION
                </span>

                {/* Visual Header */}
                <div className="flex justify-between items-start mb-6 pt-2">
                  <span className="text-xs font-mono font-bold tracking-widest uppercase px-3 py-1 bg-slate-100 text-[#120B38] rounded-xl border border-slate-200">
                    ROUND {state.currentRound} • QUESTION {state.currentQuestionIndex + 1}/20
                  </span>
                  
                  {/* Circular Timer representation */}
                  <div className="relative w-16 h-16 flex items-center justify-center font-mono">
                    <svg className="absolute w-full h-full rotate-[-90deg]">
                      <circle
                        cx="32"
                        cy="32"
                        r="26"
                        className="stroke-slate-100 fill-none"
                        strokeWidth="4"
                      />
                      <motion.circle
                        cx="32"
                        cy="32"
                        r="26"
                        className="stroke-brand-pink fill-none"
                        strokeWidth="4"
                        strokeDasharray={2 * Math.PI * 26}
                        animate={{ strokeDashoffset: (2 * Math.PI * 26) * (1 - timerPercent / 100) }}
                        transition={{ duration: 0.5, ease: 'linear' }}
                      />
                    </svg>
                    <span className="text-xl font-black tracking-tighter text-brand-pink">{state.timer}s</span>
                  </div>
                </div>

                {/* Display Question */}
                <div className="flex-1 flex flex-col justify-center py-6">
                  <h2 className="font-display text-2xl sm:text-3.5xl font-extrabold leading-snug text-[#120B38] tracking-tight" id="cast-question-heading">
                    {currentQuestion.text}
                  </h2>
                </div>

                {/* Options display - Mask responses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  {(['A', 'B', 'C', 'D'] as const).map(letter => (
                    <div
                      key={letter}
                      className="p-5 rounded-3xl border-2 border-slate-100 flex items-center gap-4 bg-slate-50 text-[#120B38] font-bold shadow-sm"
                    >
                      <span className="w-10 h-10 rounded-full bg-slate-200 text-slate-700 font-mono font-black text-base flex items-center justify-center shrink-0">
                        {letter}
                      </span>
                      <span className="text-base text-slate-850 font-bold">{currentQuestion.options[letter]}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* DETAILED SCORE/REVEAL STATE POP-UP */}
            {state.status === 'reveal' && currentQuestion && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={`reveal-${currentQuestion.id}`}
                className="bg-gradient-to-tr from-slate-900 to-slate-950 border-2 border-slate-800 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 py-1.5 px-4 font-mono font-bold rounded-bl-xl text-[10px] tracking-wider bg-amber-500 text-slate-950 uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 fill-current" /> Time Up! Correct Answer Reveal
                </div>

                <div className="max-w-2xl mx-auto">
                  <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">Question {state.currentQuestionIndex + 1} Answer</span>
                  
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-slate-300 mt-4 leading-relaxed">
                    "{currentQuestion.text}"
                  </h3>

                  {/* Correct Option Display POP */}
                  <div className="my-8 relative select-none inline-block">
                    {/* Points visual badge */}
                    <div className="absolute -top-3.5 -right-3.5 bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-display font-black text-xs px-3.5 py-1.5 rounded-full shadow-lg border border-yellow-200 flex items-center gap-1 animate-bounce">
                      <Award className="w-3.5 h-3.5 shrink-0" />
                      <span>+{currentQuestion.points} points</span>
                    </div>

                    <div className="bg-emerald-500 text-slate-950 font-display font-black text-6xl px-16 py-6 rounded-2xl border-4 border-emerald-300 shadow-2xl shadow-emerald-500/20 inline-flex flex-col items-center">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-950 font-bold mb-1">CORRECT LETTER</span>
                      <span className="leading-none">{currentQuestion.correctAnswer}</span>
                    </div>
                  </div>

                  {/* Full Text of Correct Answer */}
                  <p className="font-display text-lg sm:text-xl font-bold text-emerald-400">
                    {currentQuestion.options[currentQuestion.correctAnswer]}
                  </p>

                  <div className="mt-8 border-t border-slate-900 pt-6 flex justify-center items-center gap-6 text-xs text-slate-400 font-mono">
                    <div>
                      Submitted Results: <span className="font-bold text-white font-mono">{submitCount} / {joinedGroups.length}</span>
                    </div>
                    <div className="h-4 w-px bg-slate-900"></div>
                    <div>
                      Advancing In: <span className="font-bold text-amber-400 font-mono">{state.timer}s</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 15-MINUTE INTERMISSION BREAK PAGE */}
            {state.status === 'intermission' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                key="intermission-screen"
                className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 sm:p-12 text-center flex flex-col justify-between h-full"
              >
                <div className="my-auto max-w-xl mx-auto">
                  <span className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest bg-amber-500/10 border border-amber-500/20 text-text-amber-300 uppercase shrink-0">
                    Intermission Break
                  </span>

                  <h2 className="font-display text-4xl sm:text-5xl font-black text-white mt-8 tracking-tight">
                    Relax &amp; Refresh!
                  </h2>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Grab a beverage, chat with other groups, and review the standings. The campaign resumes soon!
                  </p>

                  <div className="my-8 max-w-sm mx-auto bg-slate-950 border border-slate-900 rounded-3xl p-6 shadow-xl">
                    <span className="text-xs font-mono font-bold text-slate-500 tracking-wider block uppercase mb-1">REMAINING RECOVERY TIME</span>
                    <span className="font-mono text-5xl font-black text-amber-400 tracking-tight">
                      {formatTime(state.timer)}
                    </span>
                  </div>
                </div>


              </motion.div>
            )}

            {/* QUIZ COMPLETED STATE */}
            {state.status === 'ended' && (
              <motion.div
                initial={{ opacity: 0, rotateX: 10 }}
                animate={{ opacity: 1, rotateX: 0 }}
                exit={{ opacity: 0, rotateX: 10 }}
                key="ended-screen"
                className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 text-center"
              >
                <div className="max-w-xl mx-auto">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-300 to-amber-500 mb-6 shadow-xl shadow-amber-500/10 border border-yellow-200">
                    <Trophy className="w-10 h-10 text-slate-950 font-bold" />
                  </div>

                  <h2 className="font-display text-4xl font-black text-white leading-tight tracking-tight">
                    The Champions Have Been Crowned!
                  </h2>
                  <p className="text-sm text-slate-400 mt-2 mb-8 leading-relaxed">
                    That concludes our Automated Trivia Match! Congratulations to all connected groups for their outstanding performance. Check out the final leaderboard places below.
                  </p>

                  {/* Final Podium Display */}
                  <div className="grid grid-cols-3 gap-3 items-end max-w-md mx-auto pt-6" id="final-champions-podium">
                    {/* PLACE 2 */}
                    {overallRankings[1] && (
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-400 truncate max-w-[80px] mb-1">{overallRankings[1].name}</span>
                        <div className="bg-slate-800/60 border border-slate-700/80 w-full rounded-t-xl h-24 flex flex-col justify-center items-center text-slate-300 font-display font-bold">
                          <Medal className="w-6 h-6 text-slate-400" />
                          <span className="text-sm mt-1">2nd</span>
                          <span className="text-[10px] font-mono text-slate-400">{overallRankings[1].totalScore} pts</span>
                        </div>
                      </div>
                    )}

                    {/* CHAMPIONPLACE 1 */}
                    {overallRankings[0] && (
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-amber-400 truncate max-w-[100px] mb-1 flex items-center gap-1">👑 {overallRankings[0].name}</span>
                        <div className="bg-gradient-to-b from-amber-500/20 to-slate-900 border-2 border-amber-500 w-full rounded-t-xl h-32 flex flex-col justify-center items-center text-amber-300 font-display font-extrabold shadow shadow-amber-500/10">
                          <Trophy className="w-8 h-8 text-amber-500 animate-pulse" />
                          <span className="text-lg mt-1 leading-none">Winner</span>
                          <span className="text-xs font-mono text-amber-400 font-bold mt-1">+{overallRankings[0].totalScore} pts</span>
                        </div>
                      </div>
                    )}

                    {/* PLACE 3 */}
                    {overallRankings[2] && (
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-amber-600 truncate max-w-[80px] mb-1">{overallRankings[2].name}</span>
                        <div className="bg-slate-800/60 border border-slate-700/80 w-full rounded-t-xl h-20 flex flex-col justify-center items-center text-amber-700 font-display font-bold">
                          <Medal className="w-5 h-5 text-amber-700" />
                          <span className="text-xs mt-1">3rd</span>
                          <span className="text-[10px] font-mono text-slate-500">{overallRankings[2].totalScore} pts</span>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Right column: Dynamic Live standings filtered by round */}
        <div className="bg-[#1E1552] rounded-[2.5rem] border border-[#3D2E8E] p-8 flex flex-col justify-between shadow-inner" id="cast-leaderboard-sidebar">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-brand-secondary flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" /> STANDINGS (ROUND {state.currentRound})
              </h3>
              <span className="px-2.5 py-1 text-[9px] font-mono rounded-full bg-slate-950 border border-slate-800 text-brand-mint tracking-wider font-extrabold uppercase">
                ROUND {state.currentRound} ONLY
              </span>
            </div>

            {/* List connected teams with layout motion shifts */}
            <div className="space-y-3" id="cast-ranking-list">
              {roundRankings.length === 0 ? (
                <div className="text-center py-10 text-slate-600 text-xs italic">
                  No active registered teams currently connected. Standby...
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {roundRankings.map((g, index) => {
                    // Position medals representation
                    let pColor = 'bg-slate-800 text-slate-400 border border-slate-700';
                    let textRankColor = 'text-white';
                    if (index === 0) {
                      pColor = 'bg-yellow-500 text-slate-950 font-bold';
                      textRankColor = 'text-yellow-400';
                    } else if (index === 1) {
                      pColor = 'bg-slate-400 text-slate-950 font-bold';
                    } else if (index === 2) {
                      pColor = 'bg-amber-700 text-slate-50 font-bold';
                    }

                    // Checking if they submitted on an active question
                    const madeSubmission = state.status === 'question' && currentQuestion && currentQSubmissions[g.id];

                    return (
                      <motion.div
                        layout
                        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                        key={g.id}
                        className="p-3 bg-slate-950/60 border border-slate-900 hover:border-slate-800 rounded-xl flex justify-between items-center relative overflow-hidden transition-all duration-150"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${pColor}`}>
                            {index + 1}
                          </span>
                          <div>
                            <span className={`font-display text-sm font-bold truncate block ${textRankColor}`}>{g.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono">CODE: {g.id}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {/* Answer submitted green check dot */}
                          {madeSubmission && (
                            <span className="h-2 w-2 rounded-full bg-teal-400 shadow shadow-teal-400/50 animate-pulse"></span>
                          )}

                          <div className="text-right font-mono">
                            <span className="text-[10px] text-slate-500 block leading-tight">correct</span>
                            <span className="text-xs font-bold text-slate-300">{g.correctCount} / 20</span>
                          </div>
                          
                          <div className="h-6 w-px bg-slate-800 self-center"></div>

                          <div className="text-right font-mono">
                            <span className="text-[10px] text-slate-500 block leading-tight">points</span>
                            <span className="text-xs font-extrabold text-teal-400">+{g.roundScore}</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>

          <div className="border-t border-slate-900 pt-4 mt-6">
            <span className="text-[9px] font-mono tracking-wider text-slate-500 uppercase block mb-2">Cumulative overall leaderboard summary</span>
            <div className="flex flex-wrap gap-2 justify-start max-h-[80px] overflow-y-auto pr-2">
              {overallRankings.slice(0, 5).map((g, index) => (
                <div key={g.id} className="text-[10px] font-mono bg-slate-950 rounded border border-slate-900 px-2.5 py-1 text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
                  <span className="text-[6px] tracking-none text-slate-600">●</span>
                  <span className="truncate max-w-[70px] font-semibold">{g.name}</span>
                  <span className="font-bold text-sky-400">({g.totalScore} pts)</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
