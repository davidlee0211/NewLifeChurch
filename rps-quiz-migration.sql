-- ============================================
-- 가위바위보 퀴즈 기능 추가 마이그레이션
-- ============================================
-- Supabase Dashboard > SQL Editor 에서 전체 실행.
-- 멱등성 보장 (여러 번 실행해도 안전).

-- 1. rps_quizzes 테이블 생성 (bible_dice_quizzes와 동일 구조)
CREATE TABLE IF NOT EXISTS rps_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  quiz_type VARCHAR(20) NOT NULL DEFAULT 'multiple_choice'
    CHECK (quiz_type IN ('multiple_choice', 'short_answer')),
  question TEXT NOT NULL,
  option1 TEXT,
  option2 TEXT,
  option3 TEXT,
  option4 TEXT,
  correct_answer INT,                    -- 객관식용 (1~4)
  correct_answer_text TEXT,              -- 주관식용
  is_active BOOLEAN DEFAULT TRUE,
  order_index INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rps_quizzes_church_id ON rps_quizzes(church_id);
CREATE INDEX IF NOT EXISTS idx_rps_quizzes_order
  ON rps_quizzes(church_id, order_index);

-- 2. RLS 비활성화 (다른 테이블과 일관성)
ALTER TABLE rps_quizzes DISABLE ROW LEVEL SECURITY;

-- 3. quest_records.type CHECK 제약 갱신 (rps_quiz 타입 허용)
ALTER TABLE quest_records DROP CONSTRAINT IF EXISTS quest_records_type_check;
ALTER TABLE quest_records
  ADD CONSTRAINT quest_records_type_check
  CHECK (type IN ('attendance', 'recitation', 'qt', 'manual', 'bible_dice', 'rps_quiz'));

-- ============================================
-- 확인 쿼리
-- ============================================
-- SELECT * FROM rps_quizzes ORDER BY order_index;
