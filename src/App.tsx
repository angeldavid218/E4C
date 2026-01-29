import React, { useState, useEffect } from 'react';
import { Navigation } from './components/Navigation';
import { StudentDashboard } from './components/student/StudentDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ValidatorDashboard } from './components/validator/ValidatorDashboard';
import { RankingDashboard } from './components/ranking/RankingDashboard';
import { type Student, type Teacher } from './types';
import { useSupabaseCrud } from './hooks';
import { LoginSignupForm } from './components/auth/LoginSignupForm';
import { useAuth } from './authContext';
import { AuthStatus } from './components/auth/AuthStatus';

export type UserRole = 'student' | 'teacher' | 'admin' | 'validator' | 'ranking' | 'unauthenticated' | 'unapproved';

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

export default function App() {
  const { session, user, loading: authLoading } = useAuth();
  const userRole = user?.user_metadata?.role as UserRole || 'unauthenticated';
  const currentStudentId = user?.id;

  const {
    data: students,
    loading: studentsLoading,
    error: studentsError,
    createItem: createStudent,
  } = useSupabaseCrud<Student>('students');
  const {
    data: teachers,
    loading: teachersLoading,
    error: teachersError,
    createItem: createTeacher,
  } = useSupabaseCrud<Teacher>('teachers');
  
  const [nftRequests, setNftRequests] = useState<NFTRequest[]>([]);

  const handleCreateStudent = async (student: Omit<Student, 'id' | 'tokens' | 'tasksCompleted' | 'nfts'>) => {
    await createStudent({
      ...student,
      tokens: 0,
      tasksCompleted: 0,
      nfts: [],
      grade: 'N/A', // Default grade
    });
  };

  const handleCreateTeacher = async (teacher: Omit<Teacher, 'id'>) => {
    await createTeacher({
      ...teacher,
      subjects: [], // Default subjects
    });
  };

  const handleCreateNFTRequest = (request: Omit<NFTRequest, 'id' | 'requestDate' | 'status' | 'teacherSignature' | 'teacherId' | 'teacherName'>) => {
    const teacherId = 't1'; 
    const teacherName = 'Prof. María';

    const newRequest: NFTRequest = {
      ...request,
      id: `req${Date.now()}`,
      requestDate: new Date().toISOString(),
      status: 'pending-admin',
      teacherId: teacherId,
      teacherName: teacherName,
      teacherSignature: {
        name: teacherName,
        timestamp: new Date().toISOString(),
      },
    };
    setNftRequests(prev => [newRequest, ...prev]);
  };

  const handleValidatorApprove = (requestId: string) => {
    setNftRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? {
              ...req,
              status: 'blockchain-pending' as const,
              validatorSignature: {
                name: 'Validador Técnico',
                timestamp: new Date().toISOString(),
              },
            }
          : req
      )
    );

    setTimeout(() => {
      setNftRequests(prev =>
        prev.map(req =>
          req.id === requestId
            ? {
                ...req,
                status: 'approved' as const,
                blockchainHash: `0x${Math.random().toString(16).slice(2)}${Math.random().toString(16).slice(2)}`,
              }
            : req
        )
      );
    }, 3000);
  };

  const handleValidatorReject = (requestId: string, reason: string) => {
    setNftRequests(prev =>
      prev.map(req =>
        req.id === requestId
          ? {
              ...req,
              status: 'rejected' as const,
              rejectionReason: reason,
            }
          : req
      )
    );
  };

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen text-lg">Cargando autenticación...</div>;
  }

  if (!session) {
    return <LoginSignupForm />;
  }

  if (studentsLoading || teachersLoading) {
    return <div className="flex justify-center items-center h-screen text-lg">Cargando datos...</div>;
  }

  if (studentsError) {
    return <div className="flex justify-center items-center h-screen text-lg text-red-600">Error al cargar estudiantes: {studentsError}</div>;
  }

  if (teachersError) {
    return <div className="flex justify-center items-center h-screen text-lg text-red-600">Error al cargar profesores: {teachersError}</div>;
  }

  const renderDashboard = () => {
    switch (userRole) {
      case 'student':
        return (
          <StudentDashboard
            studentId={currentStudentId!}
            nftRequests={nftRequests}
          />
        );
      case 'teacher':
        return (
          <TeacherDashboard
            nftRequests={nftRequests}
            onCreateNFTRequest={handleCreateNFTRequest}
          />
        );
      case 'admin':
        return (
          <AdminDashboard
            students={students || []}
            teachers={teachers || []}
            onCreateStudent={handleCreateStudent}
            onCreateTeacher={handleCreateTeacher}
          />
        );
      case 'validator':
        return (
          <ValidatorDashboard
            nftRequests={nftRequests}
            onApproveRequest={handleValidatorApprove}
            onRejectRequest={handleValidatorReject}
          />
        );
      case 'unapproved':
        return <RankingDashboard nftRequests={nftRequests} students={students || []} />;
      case 'ranking':
        return <RankingDashboard nftRequests={nftRequests} students={students || []} />;
      case 'unauthenticated':
      default:
        return (
            <div className="flex justify-center items-center h-screen text-lg">
                Por favor, inicie sesión para acceder al panel.
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Navigation>
        <AuthStatus />
      </Navigation>
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {renderDashboard()}
      </main>
    </div>
  );
}