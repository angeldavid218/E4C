// src/types.ts

export type UserRole = 'student' | 'teacher' | 'admin' | 'validator' | 'ranking' | 'unauthenticated' | 'unapproved';

export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  stellar_public_key?: string;
  status: 'pending' | 'approved' | 'rejected';
  
  // Shared
  escuela?: string;
  curso?: string;
  division?: string;
  
  // Student Specific
  tokens?: number;
  tasks_completed?: number;
  nfts?: string[];
  grade?: string;
  alias?: string;
  enrollment_date?: string;

  // Teacher Specific
  subjects?: string[];

  // Validator Specific
  escuelas?: string[];
  
  created_at?: string;
}

// Aliases para compatibilidad hacia atrás durante la refactorización
export type Student = Profile & { role: 'student' };
export type Teacher = Profile & { role: 'teacher' };
export type Admin = Profile & { role: 'admin' };
export type Validator = Profile & { role: 'validator' };

export interface Task {
  id: string;
  title: string;
  subject: string;
  description: string;
  due_date?: string;
  points: number;
  teacher_id: string;
  created_at?: string;
}

export interface StudentTask {
  id: string;
  student_id: string;
  task_id: string;
  status: 'assigned' | 'completed' | 'teacher_approved' | 'rejected_by_teacher' | 'validator_approved' | 'rejected_by_validator';
  assigned_date: string;
  completed_date?: string;
  grade?: number;
  evidence_url?: string;
  feedback?: string;
  
  // Joins opcionales para el frontend
  task?: Task;
  student?: Profile;
}

export interface Partner {
  id: string;
  name: string;
  description?: string;
  contact_email?: string;
  created_at?: string;
}

export interface Reward {
  id: string;
  partner_id?: string;
  partner?: Partner;
  title: string;
  description: string;
  category?: string;
  cost_e4c: number;
  image_url?: string;  is_featured: boolean;
  featured_until?: string;
  stock?: number;
  created_at?: string;
}

export interface Redeem {
  id: string;
  student_id: string;
  reward_id: string;
  status: string;
  redeemed_at: string;
  blockchain_hash?: string;
  
  // Joins
  reward?: Reward;
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
