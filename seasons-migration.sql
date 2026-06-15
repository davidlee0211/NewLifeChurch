-- ============================================
-- 시즌(Season) 기능 추가 마이그레이션
-- ============================================
-- 실행 전 백업 권장.
-- Supabase Dashboard > SQL Editor 에서 전체 실행하면 됩니다.

-- 1. seasons 테이블 생성
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  season_number INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,                 -- NULL = 진행 중
  archived_data JSONB,                  -- 종료 시 학생/팀 최종 스냅샷
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(church_id, season_number)
);

CREATE INDEX IF NOT EXISTS idx_seasons_church_id ON seasons(church_id);
-- 진행 중인 시즌 빠르게 찾기
CREATE INDEX IF NOT EXISTS idx_seasons_active
  ON seasons(church_id) WHERE ended_at IS NULL;

-- 2. 모든 교회에 대해 "시즌 1" 자동 생성 (없으면)
INSERT INTO seasons (church_id, season_number, name, started_at)
SELECT c.id, 1, '시즌 1', c.created_at
FROM churches c
WHERE NOT EXISTS (
  SELECT 1 FROM seasons s WHERE s.church_id = c.id
);

-- 3. quest_records 에 season_id 컬럼 추가
ALTER TABLE quest_records
  ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES seasons(id) ON DELETE SET NULL;

-- 4. 기존 quest_records를 시즌 1로 백필
UPDATE quest_records qr
SET season_id = (
  SELECT id FROM seasons s
  WHERE s.church_id = qr.church_id AND s.season_number = 1
)
WHERE qr.season_id IS NULL;

-- 5. 인덱스 추가 (시즌별 조회용)
CREATE INDEX IF NOT EXISTS idx_quest_records_season_id ON quest_records(season_id);

-- 6. RLS 비활성화 (다른 테이블과 일관성 유지 — 개발 단계 기본값)
-- 운영 환경에서 본격 보안 적용할 때 일괄로 켜야 함.
ALTER TABLE seasons DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 확인 쿼리
-- ============================================
-- 시즌 목록
-- SELECT * FROM seasons ORDER BY church_id, season_number;
--
-- 시즌별 quest_records 개수
-- SELECT s.name, COUNT(qr.id) AS record_count
-- FROM seasons s
-- LEFT JOIN quest_records qr ON qr.season_id = s.id
-- GROUP BY s.id, s.name
-- ORDER BY s.season_number;
