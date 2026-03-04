// src/types.ts

export interface Student {
  id: string;
  name: string;
  email: string;
  enrollmentDate: string;
  tokens: number;
  tasksCompleted: number;
  nfts: string[]; // Array de IDs de NFT
  grade: string; // Añadido de mockData
  stellar_public_key?: string;
  curso?: string;
  division?: string;
  escuela?: string;
  alias?: string; // New: Optional alias for public display
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subjects: string[]; // Añadido de mockData
  curso?: string;
  division?: string;
  escuela?: string;
  stellar_public_key?: string;
}

export interface Admin {
  id: string;
  name: string;
  email: string;
  stellar_public_key?: string;
  created_at: string;
}

export interface Validator {
  id: string;
  name: string;
  email: string;
  escuelas: string[]; // Lista de escuelas asignadas
  stellar_public_key?: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  subject: string;
  description: string; // Descripción añadida
  duedate: string;
  points: number;
  status: 'pending' | 'completed';
}

export interface StudentTask {
  id: string;
  student_id: string;
  task_id: string;
  status: 'assigned' | 'completed' | 'teacher_approved' | 'rejected_by_teacher' | 'validator_approved' | 'rejected_by_validator';
  assigned_date: string;
  completed_date?: string;
  grade?: number;
}

export interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  issuedDate: string;
  category: 'achievement' | 'excellence' | 'participation';
  signatures: {
    teacher: string;
    admin: string;
    timestamp: string;
  };
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: string;
  image: string;
  available: number;
}

export interface AchievementTemplate {
  name: string;
  emoji: string;
  description: string;
}

export interface WeeklyActivityItem {
  day: string;
  tasks: number;
  logins: number;
}

export interface TokenTransaction {
  id: string;
  studentId: string;
  studentName: string;
  amount: number;
  type: 'earn' | 'spend';
  description: string;
  date: string;
  teacherId?: string;
  teacherName?: string;
}

export type UserRole = 'student' | 'teacher' | 'validator' | 'ranking' | 'unauthenticated' | 'unapproved';

export interface NFTRequest {
  id: string;
  studentId: string;
  studentName: string;
  achievementName: string;
  description: string;
  evidence: string;
  requestDate: string;
  teacherName: string;
  teacherId: string;
  status: 'pending-admin' | 'pending-validator' | 'approved' | 'rejected' | 'blockchain-pending' | 'blockchain-confirmed';
  teacherSignature?: {
    name: string;
    timestamp: string;
  };
  adminSignature?: {
    name: string;
    timestamp: string;
  };
  validatorSignature?: {
    name: string;
    timestamp: string;
  };
  rejectionReason?: string;
  blockchainHash?: string;
}
