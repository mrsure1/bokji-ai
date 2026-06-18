-- 선제 알림(SMS) — 발송 대상 식별에 필요한 전화번호 저장.
-- alarm_sms 컬럼은 initial_schema에 이미 존재(문자 수신 동의). 여기서는 phone만 추가한다.
-- phone: 정규화된 휴대폰 번호(숫자만, 예: 01012345678). 수신 동의(alarm_sms)가 true이고
--        phone이 있는 사용자만 크론에서 문자 발송 대상이 된다.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone text;

-- 발송 동의 시각(법적 근거 보관용). 동의 토글을 켠 시점을 기록한다.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sms_consent_at timestamptz;
