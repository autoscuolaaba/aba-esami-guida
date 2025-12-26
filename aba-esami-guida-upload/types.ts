export type Turn = 'MATTINA' | 'POMERIGGIO';

export type StudentStatus = 'SCHEDULED' | 'PASSED' | 'FAILED' | 'ABSENT';

export interface Student {
  id: string;
  name: string;
  phone?: string;
  status: StudentStatus;
  failCount?: number; // Number of times failed (max 3, foglio rosa valid 1 year)
}

export interface ExaminerNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface ExaminerFile {
  id: string;
  name: string;
  type: 'pdf' | 'audio' | 'image' | 'other';
  data: string; // base64
  createdAt: string;
}

export interface Examiner {
  id: string;
  name: string;
  notes?: ExaminerNote[];
  files?: ExaminerFile[];
}

export interface ExamSession {
  turn: Turn | null;
  students: Student[];
  examinerId?: string; // ID dell'esaminatore assegnato
}

export type SessionMap = Record<string, ExamSession>;

// Monthly exam limits (key format: "YYYY-MM")
export type MonthlyLimitsMap = Record<string, number>;

// Waiting list student
export interface WaitingStudent {
  id: string;
  name: string;
  phone?: string;
  addedAt: string;
  canBookAfter?: string; // Date after which student can be booked (for 3x failed students)
  failedThreeTimes?: boolean; // Flag for students who failed 3 times
}