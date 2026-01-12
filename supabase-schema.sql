-- ============================================
-- 주일학교 달란트 플랫폼 - Supabase 스키마
-- 멀티테넌트 구조 (church_id 기반)
-- ============================================

-- 기존 테이블 삭제 (개발용, 운영 시 주석처리)
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS talent_settings CASCADE;
DROP TABLE IF EXISTS quest_records CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS churches CASCADE;

-- ============================================
-- 1. 테이블 생성
-- ============================================

-- 교회 (최상위 테넌트)
CREATE TABLE churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,  -- URL용 고유 코드 (예: "newlife")
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#F59E0B',  -- 테마 색상
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 팀
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',  -- hex 색상코드
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(church_id, name)
);

-- 학생
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  login_code VARCHAR(6) NOT NULL,  -- 6자리 로그인 코드
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  talent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(church_id, login_code)
);

-- 관리자 (교사)
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  login_id VARCHAR(50) NOT NULL,  -- 로그인 아이디
  password VARCHAR(255) NOT NULL,  -- 해시된 비밀번호 (운영 시 bcrypt 사용 권장)
  is_super BOOLEAN DEFAULT FALSE,  -- 슈퍼관리자 여부
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(church_id, login_id)
);

-- 퀘스트 기록 (출석, 암송, QT)
CREATE TABLE quest_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('attendance', 'recitation', 'qt')),
  date DATE NOT NULL,
  photo_url TEXT,
  talent_earned INTEGER NOT NULL DEFAULT 0,
  approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES admins(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, type, date)  -- 같은 날 같은 타입 중복 방지
);

-- 달란트 설정 (교회별)
CREATE TABLE talent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  quest_type VARCHAR(20) NOT NULL CHECK (quest_type IN ('attendance', 'recitation', 'qt')),
  amount INTEGER NOT NULL DEFAULT 10,
  UNIQUE(church_id, quest_type)
);

-- 퀴즈
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 게임 세션
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('quiz_board', 'team_pick')),
  status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. 인덱스 생성 (성능 최적화)
-- ============================================

CREATE INDEX idx_students_church_id ON students(church_id);
CREATE INDEX idx_students_team_id ON students(team_id);
CREATE INDEX idx_admins_church_id ON admins(church_id);
CREATE INDEX idx_teams_church_id ON teams(church_id);
CREATE INDEX idx_quest_records_church_id ON quest_records(church_id);
CREATE INDEX idx_quest_records_student_id ON quest_records(student_id);
CREATE INDEX idx_quest_records_date ON quest_records(date);
CREATE INDEX idx_quizzes_church_id ON quizzes(church_id);
CREATE INDEX idx_game_sessions_church_id ON game_sessions(church_id);

-- ============================================
-- 3. RLS (Row Level Security) - 일단 비활성화
-- ============================================

-- RLS 비활성화 (개발 단계)
ALTER TABLE churches DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE quest_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE talent_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. 기본 데이터 삽입
-- ============================================

-- 기본 교회 생성 (새생명교회)
INSERT INTO churches (id, name, code, primary_color) VALUES
  ('00000000-0000-0000-0000-000000000001', '새생명교회', 'newlife', '#F59E0B');

-- 기본 관리자 계정 (비밀번호: admin123)
-- 주의: 운영 환경에서는 반드시 비밀번호를 해시화하세요!
INSERT INTO admins (church_id, name, login_id, password, is_super) VALUES
  ('00000000-0000-0000-0000-000000000001', '관리자', 'admin', 'admin123', TRUE);

-- 기본 달란트 설정값
INSERT INTO talent_settings (church_id, quest_type, amount) VALUES
  ('00000000-0000-0000-0000-000000000001', 'attendance', 10),  -- 출석: 10 달란트
  ('00000000-0000-0000-0000-000000000001', 'recitation', 20),  -- 암송: 20 달란트
  ('00000000-0000-0000-0000-000000000001', 'qt', 15);          -- QT: 15 달란트

-- 기본 팀 생성
INSERT INTO teams (church_id, name, color) VALUES
  ('00000000-0000-0000-0000-000000000001', '사랑팀', '#EF4444'),
  ('00000000-0000-0000-0000-000000000001', '믿음팀', '#3B82F6'),
  ('00000000-0000-0000-0000-000000000001', '소망팀', '#10B981');

-- ============================================
-- 5. Storage 버킷 설정 안내
-- ============================================

/*
Supabase Dashboard에서 Storage 설정:

1. Storage 메뉴로 이동
2. "New bucket" 클릭
3. 버킷 이름: qt-photos
4. Public bucket: 체크 (또는 필요에 따라 Private)
5. File size limit: 5MB (권장)
6. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

RLS 정책 (나중에 활성화 시):
- INSERT: 로그인한 사용자만 업로드 가능
- SELECT: 같은 교회 소속만 조회 가능
- DELETE: 본인 업로드 파일만 삭제 가능
*/

-- ============================================
-- 6. 유용한 View 생성 (선택사항)
-- ============================================

-- 학생별 총 달란트 및 팀 정보
CREATE OR REPLACE VIEW student_summary AS
SELECT
  s.id,
  s.church_id,
  s.name,
  s.login_code,
  s.talent,
  s.created_at,
  t.name as team_name,
  t.color as team_color,
  c.name as church_name
FROM students s
LEFT JOIN teams t ON s.team_id = t.id
LEFT JOIN churches c ON s.church_id = c.id;

-- 팀별 총 달란트
CREATE OR REPLACE VIEW team_talent_summary AS
SELECT
  t.id,
  t.church_id,
  t.name,
  t.color,
  COALESCE(SUM(s.talent), 0) as total_talent,
  COUNT(s.id) as member_count
FROM teams t
LEFT JOIN students s ON t.id = s.team_id
GROUP BY t.id, t.church_id, t.name, t.color;

-- 오늘 출석 현황
CREATE OR REPLACE VIEW today_attendance AS
SELECT
  qr.church_id,
  qr.student_id,
  s.name as student_name,
  t.name as team_name,
  qr.approved
FROM quest_records qr
JOIN students s ON qr.student_id = s.id
LEFT JOIN teams t ON s.team_id = t.id
WHERE qr.type = 'attendance' AND qr.date = CURRENT_DATE;

-- ============================================
-- 완료!
-- ============================================

-- 테이블 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
