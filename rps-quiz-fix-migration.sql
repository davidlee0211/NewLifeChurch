-- ============================================
-- 가위바위보 퀴즈 수정 마이그레이션
-- - quiz_id 컬럼 추가 (어느 퀴즈에 대한 정답자인지 추적)
-- - UNIQUE 제약 완화 (rps_quiz는 학생당 하루 여러 번 가능)
-- ============================================
-- ⚠️ 반드시 rps-quiz-migration.sql 먼저 실행 후 이 파일을 실행.

-- 1. quest_records에 quiz_id 컬럼 추가 (어느 rps_quizzes를 위한 기록인지)
ALTER TABLE quest_records
  ADD COLUMN IF NOT EXISTS quiz_id UUID;

CREATE INDEX IF NOT EXISTS idx_quest_records_quiz_id
  ON quest_records(quiz_id);

-- 2. 기존 UNIQUE(student_id, type, date) 제약 제거
-- (rps_quiz 같이 하루에 여러 번 가능해야 하는 타입 때문)
ALTER TABLE quest_records
  DROP CONSTRAINT IF EXISTS quest_records_student_id_type_date_key;

-- 3. attendance/recitation/qt만 하루 1회 제한 유지 (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS quest_records_daily_unique
  ON quest_records(student_id, type, date)
  WHERE type IN ('attendance', 'recitation', 'qt');

-- ============================================
-- 확인 쿼리
-- ============================================
-- 인덱스 확인
-- SELECT indexname, indexdef FROM pg_indexes
-- WHERE tablename = 'quest_records';
