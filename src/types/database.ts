// 퀘스트 타입
export type QuestType = 'attendance' | 'recitation' | 'qt';

// 게임 세션 타입
export type GameType = 'quiz_board' | 'team_pick';
export type GameStatus = 'waiting' | 'playing' | 'finished';

// ============================================
// 테이블 Row 타입들 (멀티테넌트: church_id 포함)
// ============================================

// 교회 (최상위 테넌트)
export interface Church {
  id: string;
  name: string;
  code: string;              // URL용 고유 코드 (예: "newlife")
  logo_url: string | null;
  primary_color: string;     // 테마 색상
  created_at: string;
}

// 학생
export interface Student {
  id: string;
  church_id: string;
  name: string;
  login_code: string;        // 6자리 로그인 코드
  team_id: string | null;
  talent: number;
  created_at: string;
}

// 관리자 (교사)
export interface Admin {
  id: string;
  church_id: string;
  name: string;
  login_id: string;          // 관리자 아이디 (비밀번호 없음)
  is_super: boolean;         // 슈퍼관리자 여부
  created_at: string;
}

// 팀
export interface Team {
  id: string;
  church_id: string;
  name: string;
  color: string;
  created_at: string;
}

// 퀘스트 기록 (출석, 암송, QT)
export interface QuestRecord {
  id: string;
  church_id: string;
  student_id: string;
  type: QuestType;
  date: string;              // YYYY-MM-DD
  photo_url: string | null;
  talent_earned: number;
  approved: boolean;
  approved_by: string | null; // 승인한 관리자 ID
  created_at: string;
}

// 달란트 설정 (교회별)
export interface TalentSetting {
  id: string;
  church_id: string;
  quest_type: QuestType;
  amount: number;
}

// 퀴즈
export interface Quiz {
  id: string;
  church_id: string;
  question: string;
  answer: string;
  category: string | null;
  created_at: string;
}

// 게임 세션
export interface GameSession {
  id: string;
  church_id: string;
  type: GameType;
  status: GameStatus;
  data: Record<string, unknown>;
  created_at: string;
}

// QT 주제 (교사가 등록)
export interface QTTopic {
  id: string;
  church_id: string;
  date: string;              // YYYY-MM-DD
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

// ============================================
// 관계 포함 타입 (조인용)
// ============================================

export interface StudentWithTeam extends Student {
  team: Team | null;
}

export interface QuestRecordWithStudent extends QuestRecord {
  student: Student;
}

export interface ChurchWithStats extends Church {
  student_count: number;
  team_count: number;
}

// ============================================
// Supabase Database 타입
// ============================================

export interface Database {
  public: {
    Tables: {
      churches: {
        Row: Church;
        Insert: Omit<Church, 'id' | 'created_at'>;
        Update: Partial<Omit<Church, 'id' | 'created_at'>>;
      };
      students: {
        Row: Student;
        Insert: Omit<Student, 'id' | 'created_at' | 'talent'> & { talent?: number };
        Update: Partial<Omit<Student, 'id' | 'created_at' | 'church_id'>>;
      };
      admins: {
        Row: Admin;
        Insert: Omit<Admin, 'id' | 'created_at' | 'is_super'> & { is_super?: boolean };
        Update: Partial<Omit<Admin, 'id' | 'created_at' | 'church_id'>>;
      };
      teams: {
        Row: Team;
        Insert: Omit<Team, 'id' | 'created_at'>;
        Update: Partial<Omit<Team, 'id' | 'created_at' | 'church_id'>>;
      };
      quest_records: {
        Row: QuestRecord;
        Insert: Omit<QuestRecord, 'id' | 'created_at' | 'approved' | 'approved_by'> & {
          approved?: boolean;
          approved_by?: string | null;
        };
        Update: Partial<Omit<QuestRecord, 'id' | 'created_at' | 'church_id' | 'student_id'>>;
      };
      talent_settings: {
        Row: TalentSetting;
        Insert: Omit<TalentSetting, 'id'>;
        Update: Partial<Omit<TalentSetting, 'id' | 'church_id'>>;
      };
      quizzes: {
        Row: Quiz;
        Insert: Omit<Quiz, 'id' | 'created_at'>;
        Update: Partial<Omit<Quiz, 'id' | 'created_at' | 'church_id'>>;
      };
      game_sessions: {
        Row: GameSession;
        Insert: Omit<GameSession, 'id' | 'created_at'>;
        Update: Partial<Omit<GameSession, 'id' | 'created_at' | 'church_id'>>;
      };
      qt_topics: {
        Row: QTTopic;
        Insert: Omit<QTTopic, 'id' | 'created_at'>;
        Update: Partial<Omit<QTTopic, 'id' | 'created_at' | 'church_id'>>;
      };
    };
  };
}
