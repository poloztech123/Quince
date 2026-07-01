/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Trophy, Medal, Search, Layers, Calendar, ChevronRight, Award } from 'lucide-react';
import { FullGameState } from '../types';

interface ResultsViewProps {
  gameState: FullGameState;
}

export default function ResultsView({ gameState }: ResultsViewProps) {
  const { state, groups, submissions, questions, scores } = gameState;

  // Active filter: 'cumulative' | 1 | 2 | 3
  const [activeFilter, setActiveFilter] = useState<'cumulative' | 1 | 2 | 3>('cumulative');
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate scores and correct answers based on active filter
  const rankedData = useMemo(() => {
    return groups.map((g) => {
      let score = 0;
      let correctCount = 0;
      let totalAssignedQuestions = 0;

      if (activeFilter === 'cumulative') {
        // Cumulative scores
        score = scores.totalScores[g.id] || 0;
        
        // Sum correct answers across all 3 rounds
        questions.forEach(q => {
          totalAssignedQuestions++;
          const sub = submissions[q.id]?.[g.id];
          if (sub && sub.isCorrect) {
            correctCount++;
          }
        });
      } else {
        // Specific Round
        score = scores.roundScores[g.id]?.[activeFilter] || 0;
        
        // Sum correct answers for specified round questions
        const roundQuestions = questions.filter(q => q.round === activeFilter);
        roundQuestions.forEach(q => {
          totalAssignedQuestions++;
          const sub = submissions[q.id]?.[g.id];
          if (sub && sub.isCorrect) {
            correctCount++;
          }
        });
      }

      return {
        ...g,
        score,
        correctCount,
        totalAssignedQuestions
      };
    }).filter(g => 
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.id.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.correctCount - a.correctCount; // tie-breaker
    });
  }, [groups, submissions, questions, scores, activeFilter, searchTerm]);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6" id="results-standings-center">
      
      {/* Dashboard Leaderboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-900 pb-5 mb-6" id="results-header-container">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500 shrink-0" /> Round Results / Leaderboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">Review official group standings across individual quiz rounds or final cumulative scores.</p>
        </div>

        {/* Filter Tab controls */}
        <div className="flex flex-wrap gap-1 bg-slate-950 p-1 border border-slate-800 rounded-xl" id="results-filtering-controls">
          <button
            onClick={() => setActiveFilter('cumulative')}
            className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg focus:outline-none cursor-pointer transition ${
              activeFilter === 'cumulative' ? 'bg-gradient-to-tr from-brand-pink to-brand-violet text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cumulative Overall
          </button>
          {([1, 2, 3] as const).map(roundNum => (
            <button
              key={roundNum}
              onClick={() => setActiveFilter(roundNum)}
              className={`px-3 py-1.5 text-xs font-mono font-bold rounded-lg focus:outline-none cursor-pointer transition ${
                activeFilter === roundNum ? 'bg-gradient-to-tr from-brand-pink to-brand-violet text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Round {roundNum}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Statistics grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        
        {/* Search Input bar */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search group name or entry key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder-slate-600 transition"
            id="results-search-groups"
          />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-center">
          <span className="text-[9px] text-slate-500 font-mono uppercase">Sorting Filter Mode</span>
          <span className="text-xs font-bold text-brand-pink mt-1">
            {activeFilter === 'cumulative' ? 'ALL 3 ROUNDS STANDINGS' : `ROUND ${activeFilter} ISOLATION`}
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-center">
          <span className="text-[9px] text-slate-500 font-mono uppercase">Tournament Pacing Status</span>
          <span className="text-xs font-bold text-white uppercase mt-1">
            {state.status === 'ended' ? '✓ Finished' : `• In progress (R${state.currentRound})`}
          </span>
        </div>

      </div>

      {/* Main standings layout */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6" id="results-table-mainpage">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="results-data-table">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                <th className="pb-3 text-center w-12 font-semibold">Rank</th>
                <th className="pb-3 font-semibold">Group Connection Detail</th>
                <th className="pb-3 text-center font-semibold">Correct Responses</th>
                <th className="pb-3 text-right font-semibold">Points Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {rankedData.map((g, idx) => {
                let badgeClass = 'text-slate-400 bg-slate-950 border-slate-800';
                let rankLabel: React.ReactNode = idx + 1;

                if (idx === 0) {
                  badgeClass = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
                  rankLabel = <Trophy className="w-4 h-4 text-yellow-400 mx-auto" />;
                } else if (idx === 1) {
                  badgeClass = 'text-slate-300 bg-slate-400/10 border-slate-400/30';
                  rankLabel = <Medal className="w-4 h-4 text-slate-400 mx-auto" />;
                } else if (idx === 2) {
                  badgeClass = 'text-amber-500 bg-amber-600/10 border-amber-600/30';
                  rankLabel = <Medal className="w-4 h-4 text-amber-700 mx-auto" />;
                }

                return (
                  <tr key={g.id} className="hover:bg-slate-950/20 transition-all duration-100">
                    <td className="py-4 text-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-black border mx-auto ${badgeClass}`}>
                        {rankLabel}
                      </div>
                    </td>
                    <td className="py-4 text-left">
                      <div>
                        <span className="font-display font-bold text-sm text-white block">{g.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono tracking-wide uppercase">ID Code: {g.id} {!g.joined && '(Pending Login)'}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center font-mono">
                      <span className="text-sm font-semibold text-slate-200">
                        {g.correctCount}
                      </span>
                      <span className="text-slate-600 text-[11px] font-medium"> / 20 answered</span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="inline-flex items-center gap-1 bg-teal-500/5 text-teal-400 border border-teal-500/10 px-3 py-1.5 rounded-xl font-mono text-xs font-extrabold shadow-sm">
                        <Award className="w-3.5 h-3.5" />
                        <span>+{g.score} Credits</span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {rankedData.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-slate-500 italic text-xs">
                    No matching groups found based on your parameters. Standby...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
