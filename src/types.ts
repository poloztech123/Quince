/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Question {
  id: string;
  round: number; // 1, 2, or 3
  text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  points: number; // points value, custom set by admin per round or question
}

export interface Group {
  id: string; // Group ID, must match pre-configured admin ID
  name: string; // Group name
  joined: boolean; // whether they have joined
}

export interface AnswerSubmission {
  groupId: string;
  questionId: string;
  selectedOption: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  pointsEarned: number;
  timestamp: number;
}

export interface AdBanner {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  clickUrl: string;
}

export type QuizStatus = 'lobby' | 'question' | 'reveal' | 'intermission' | 'ended';

export interface QuizState {
  status: QuizStatus;
  quizName: string;
  eventLogo: string;
  currentRound: number; // 1, 2, 3
  currentQuestionIndex: number; // 0 to 19
  timer: number; // remaining seconds
  timerMax: number; // total seconds (e.g. 30s per question)
  activeQuestionId: string | null;
  adBannerIndex: number; // for rotating active ads
  maxRounds?: number; // total count of rounds (e.g. 3)
  intermissionDuration?: number; // duration of break in seconds (e.g. 900)
  questionDuration?: number; // active progress timer limit per question in seconds (e.g. 30)
}

export interface ScoreState {
  roundScores: Record<string, Record<number, number>>; // groupId -> roundNum -> score
  totalScores: Record<string, number>; // groupId -> totalScore
}

export interface SavedSession {
  id: string;
  timestamp: number;
  quizName: string;
  eventLogo: string;
  roundsCount: number;
  completedAt: string;
  finalScores: Array<{
    groupId: string;
    groupName: string;
    score: number;
  }>;
}

export interface FullGameState {
  state: QuizState;
  questions: Question[];
  groups: Group[];
  submissions: Record<string, Record<string, AnswerSubmission>>; // questionId -> groupId -> Submission
  ads: AdBanner[];
  scores: ScoreState;
  savedSessions?: SavedSession[];
}

