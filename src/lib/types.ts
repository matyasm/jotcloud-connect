
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  owner: string;
  creatorName?: string;
  shared: boolean;
  sharedWith: string[];
  tags: string[];
  likes: string[];
  likedByNames: string[];
}

export type NoteSort = 'recent' | 'title' | 'created';

export type AuthStatus = 'authenticated' | 'loading' | 'unauthenticated';

export type ViewMode = 'grid' | 'list' | 'condensed';

export interface Task {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
  owner: string;
  status: 'pending' | 'active' | 'paused' | 'completed';
  position: number;
  totalTimeSeconds: number;
  activeTimeAccumulatedSeconds: number;
}

export interface TaskTimeEntry {
  id: string;
  taskId: string;
  startTime: string;
  endTime?: string;
  createdAt: string;
}

export type TimeMetrics = {
  day: string;
  totalSeconds: number;
  tasks: Task[];
};

export type WeekMetrics = {
  weekStart: string;
  weekEnd: string;
  totalSeconds: number;
  days: TimeMetrics[];
};

export type MonthMetrics = {
  month: string;
  totalSeconds: number;
  weeks: WeekMetrics[];
};
