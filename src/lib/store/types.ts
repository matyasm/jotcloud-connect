
import { AuthStatus, Note, Task, TimeMetrics, User, WeekMetrics, MonthMetrics } from '../types';

export interface StoreContextType {
  authStatus: AuthStatus;
  user: User | null;
  notes: Note[];
  sharedNotes: Note[];
  publicNotes: Note[];
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  createNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'owner'>) => Promise<void>;
  updateNote: (id: string, note: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  shareNote: (id: string, emails: string[]) => Promise<void>;
  shareNoteWithAll: (id: string, share: boolean) => Promise<void>;
  searchNotes: (query: string) => Note[];
  exportNotes: () => void;
  importNotes: (notesJson: string) => Promise<void>;
  likeNote: (id: string) => Promise<void>;
  tasks: Task[];
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'owner' | 'position' | 'totalTimeSeconds' | 'activeTimeAccumulatedSeconds'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  startTask: (id: string) => Promise<void>;
  pauseTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  reorderTasks: (taskIds: string[]) => Promise<void>;
  getTimeMetricsByDay: () => TimeMetrics[];
  getTimeMetricsByWeek: () => WeekMetrics[];
  getTimeMetricsByMonth: () => MonthMetrics[];
}
