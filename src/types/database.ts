export type UserRole = 'student' | 'teacher' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  team_id: string | null;
  talent_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  total_talent: number;
  created_at: string;
}

export interface Attendance {
  id: string;
  user_id: string;
  date: string;
  is_present: boolean;
  talent_earned: number;
  created_at: string;
}

export interface QTSubmission {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  talent_earned: number;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface TalentTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'earn' | 'spend';
  reason: string;
  created_at: string;
  created_by: string;
}

export interface Quiz {
  id: string;
  title: string;
  question: string;
  options: string[];
  correct_answer: number;
  talent_reward: number;
  is_active: boolean;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  selected_answer: number;
  is_correct: boolean;
  talent_earned: number;
  attempted_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id'>>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at'>;
        Update: Partial<Omit<Team, 'id'>>;
      };
      attendance: {
        Row: Attendance;
        Insert: Omit<Attendance, 'id' | 'created_at'>;
        Update: Partial<Omit<Attendance, 'id'>>;
      };
      qt_submissions: {
        Row: QTSubmission;
        Insert: Omit<QTSubmission, 'id' | 'submitted_at'>;
        Update: Partial<Omit<QTSubmission, 'id'>>;
      };
      talent_transactions: {
        Row: TalentTransaction;
        Insert: Omit<TalentTransaction, 'id' | 'created_at'>;
        Update: Partial<Omit<TalentTransaction, 'id'>>;
      };
      quizzes: {
        Row: Quiz;
        Insert: Omit<Quiz, 'id' | 'created_at'>;
        Update: Partial<Omit<Quiz, 'id'>>;
      };
      quiz_attempts: {
        Row: QuizAttempt;
        Insert: Omit<QuizAttempt, 'id' | 'attempted_at'>;
        Update: Partial<Omit<QuizAttempt, 'id'>>;
      };
    };
  };
}
