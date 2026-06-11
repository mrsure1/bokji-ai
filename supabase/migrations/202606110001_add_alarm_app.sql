-- 알림 채널을 문자/이메일(외부 발송)에서 앱 내 알림으로 단순화.
-- alarm_app: 앱 알림 수신 여부 (기본 켜짐). 기존 alarm_sms/email/night은 보존하되 미사용.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS alarm_app boolean DEFAULT true;
UPDATE profiles SET alarm_app = true WHERE alarm_app IS NULL;
