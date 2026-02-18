
export enum LessonType {
  HOME_ROW = 'HOME_ROW',
  TOP_ROW = 'TOP_ROW',
  BOTTOM_ROW = 'BOTTOM_ROW',
  FULL_KEYBOARD = 'FULL_KEYBOARD',
  AI_STORY = 'AI_STORY',
  FINGER_DRILL = 'FINGER_DRILL',
  ALTERNATING = 'ALTERNATING',
  SPRINT = 'SPRINT',
  ADAPTIVE = 'ADAPTIVE'
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: LessonType;
  level: number;
  content?: string;
  guideLink?: string;
  timeLimitSec?: number;
  minAccuracy?: number;
  minWpm?: number;
  focusFinger?: string;
}

export interface UserStats {
  wpm: number[];
  accuracy: number[];
  totalKeys: number;
  completedLessons: string[];
}

export interface TypingSession {
  targetText: string;
  userInput: string;
  startTime: number | null;
  endTime: number | null;
  errors: number;
  isFinished: boolean;
  timeLimitSec?: number;
  leftKeys: number;
  rightKeys: number;
  leftErrors: number;
  rightErrors: number;
}
