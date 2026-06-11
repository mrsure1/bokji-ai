-- 가구 형태를 단일 선택(household_type)에서 복수 선택(household_situations)으로 전환.
-- 혼인/거주/부양이 동시에 성립할 수 있으므로(예: 1인 가구이면서 부모 부양) 배열로 저장한다.
-- 기존 household_type은 보존하되 신규 매칭은 household_situations를 사용한다.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS household_situations text[] DEFAULT '{}';

UPDATE profiles SET household_situations = CASE household_type
    WHEN '1인 가구' THEN ARRAY['혼자 살아요']
    WHEN '부부' THEN ARRAY['배우자와 함께']
    WHEN '자녀 있음' THEN ARRAY['미성년 자녀 양육']
    WHEN '부모 부양' THEN ARRAY['부모님(어르신) 부양']
    WHEN '한부모·조손' THEN ARRAY['한부모 가정']
    WHEN '다자녀' THEN ARRAY['다자녀 가정']
    ELSE '{}'
  END
WHERE (household_situations IS NULL OR household_situations = '{}') AND household_type IS NOT NULL;
