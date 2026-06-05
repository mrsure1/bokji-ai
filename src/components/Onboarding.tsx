'use client';

import React, { useState } from 'react';

// 온보딩 컴포넌트의 Props 인터페이스 정의
interface OnboardingProps {
  onComplete: (data: any) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  // 현재 설문 단계 상태 (1: 기본정보, 2: 상태 및 주거, 3: 관심분야 및 완료)
  const [step, setStep] = useState<number>(1);
  
  // 사용자 입력 폼 데이터 상태
  const [formData, setFormData] = useState({
    birthYear: '',
    regionSido: '',
    regionSigungu: '',
    currentStatus: '',
    householdType: '1인 가구',
    incomeBand: '잘 모르겠음',
    housingType: '',
    interests: [] as string[],
    notificationChannel: 'sms',
  });

  // 입력 필드 변경 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 관심 분야 다중 선택 핸들러
  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interest);
      return {
        ...prev,
        interests: exists
          ? prev.interests.filter((i) => i !== interest)
          : [...prev.interests, interest],
      };
    });
  };

  // 다음 단계 이동 핸들러
  const handleNext = () => {
    if (step < 3) {
      setStep((prev) => prev + 1);
    } else {
      onComplete(formData);
    }
  };

  // 이전 단계 이동 핸들러
  const handlePrev = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-[#FAFAF7] min-h-[600px] flex flex-col justify-between p-6">
      {/* 상단 프로그레스 바 및 타이틀 */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <span className="text-xs font-bold text-[#18A058] tracking-widest uppercase">
            프로필 설정 ({step}/3)
          </span>
          <div className="flex gap-1.5">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step ? 'w-6 bg-[#18A058]' : 'w-2 bg-[#EDEDEB]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 1단계: 기본 인적사항 입력 */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#202124] leading-snug">
                받을 수 있는 혜택 확인을 위해<br />기본 정보를 알려주세요.
              </h2>
              <p className="text-xs text-[#5F6368] mt-2">
                입력하신 정보는 오직 맞춤 복지 매칭 및 알림 목적으로만 안전하게 보관됩니다.
              </p>
            </div>

            <div className="space-y-4">
              {/* 태어난 년도 입력 */}
              <div>
                <label className="block text-xs font-bold text-[#202124] mb-2">출생년도</label>
                <input
                  type="number"
                  name="birthYear"
                  value={formData.birthYear}
                  onChange={handleChange}
                  placeholder="예: 1998"
                  className="w-full px-4 py-3 bg-white border border-[#E0E2E4] rounded-2xl text-sm focus:outline-none focus:border-[#18A058] transition-all"
                />
              </div>

              {/* 거주 지역 선택 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#202124] mb-2">시/도</label>
                  <select
                    name="regionSido"
                    value={formData.regionSido}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-[#E0E2E4] rounded-2xl text-sm focus:outline-none focus:border-[#18A058] transition-all"
                  >
                    <option value="">선택</option>
                    <option value="서울특별시">서울특별시</option>
                    <option value="경기도">경기도</option>
                    <option value="인천광역시">인천광역시</option>
                    <option value="부산광역시">부산광역시</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#202124] mb-2">시/군/구</label>
                  <select
                    name="regionSigungu"
                    value={formData.regionSigungu}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white border border-[#E0E2E4] rounded-2xl text-sm focus:outline-none focus:border-[#18A058] transition-all"
                  >
                    <option value="">선택</option>
                    {formData.regionSido === '서울특별시' && (
                      <>
                        <option value="마포구">마포구</option>
                        <option value="강남구">강남구</option>
                        <option value="성북구">성북구</option>
                      </>
                    )}
                    {formData.regionSido !== '서울특별시' && <option value="전체">전체</option>}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2단계: 현재 고용 상태 및 주거 환경 입력 */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#202124] leading-snug">
                현재 일자리 상태와<br />가구 환경은 어떤가요?
              </h2>
              <p className="text-xs text-[#5F6368] mt-2">
                정밀한 소득 및 가구 조건 매칭에 활용됩니다. (건너뛰기 가능)
              </p>
            </div>

            <div className="space-y-4">
              {/* 고용 상태 */}
              <div>
                <label className="block text-xs font-bold text-[#202124] mb-2">현재 직업/상태</label>
                <select
                  name="currentStatus"
                  value={formData.currentStatus}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-[#E0E2E4] rounded-2xl text-sm focus:outline-none focus:border-[#18A058] transition-all"
                >
                  <option value="">선택해 주세요</option>
                  <option value="대학생/대학원생">대학생/대학원생</option>
                  <option value="구직자/취업준비생">구직자/취업준비생</option>
                  <option value="직장인/회사원">직장인/회사원</option>
                  <option value="소상공인/자영업자">소상공인/자영업자</option>
                  <option value="프리랜서">프리랜서</option>
                  <option value="기타(무직 등)">기타(무직 등)</option>
                </select>
              </div>

              {/* 주거 형태 */}
              <div>
                <label className="block text-xs font-bold text-[#202124] mb-2">주거 형태</label>
                <select
                  name="housingType"
                  value={formData.housingType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white border border-[#E0E2E4] rounded-2xl text-sm focus:outline-none focus:border-[#18A058] transition-all"
                >
                  <option value="">선택해 주세요</option>
                  <option value="월세">월세 (매달 임대료 지불)</option>
                  <option value="전세">전세 (보증금 임대)</option>
                  <option value="자가">자가 (내 집)</option>
                  <option value="고시원/기숙사">고시원 / 기숙사 / 쉐어하우스</option>
                </select>
              </div>

              {/* 가구 구성원 */}
              <div>
                <label className="block text-xs font-bold text-[#202124] mb-2">가구 구성</label>
                <div className="grid grid-cols-3 gap-2">
                  {['1인 가구', '부부', '자녀 있음', '부모 부양'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, householdType: type }))}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        formData.householdType === type
                          ? 'bg-[#18A058]/10 border-[#18A058] text-[#18A058]'
                          : 'bg-white border-[#E0E2E4] text-[#5F6368]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3단계: 관심 분야 선택 및 동의 */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#202124] leading-snug">
                주로 관심이 있는<br />복지 분야를 골라주세요.
              </h2>
              <p className="text-xs text-[#5F6368] mt-2">
                선택하신 분야에 새로운 혜택이나 마감 공고가 등록되면 알림을 발송합니다.
              </p>
            </div>

            <div className="space-y-5">
              {/* 관심 분야 칩 */}
              <div>
                <label className="block text-xs font-bold text-[#202124] mb-2">관심사 (중복 선택 가능)</label>
                <div className="flex flex-wrap gap-2">
                  {['생계비 지원', '주거비/월세', '취업/역량개발', '교육/장학금', '의료/돌봄', '청년 특화', '창업/지원금'].map((interest) => {
                    const isSelected = formData.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleInterestToggle(interest)}
                        className={`px-3.5 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-[#18A058] border-[#18A058] text-white'
                            : 'bg-white border-[#E0E2E4] text-[#5F6368] hover:bg-[#FAFAF7]'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{interest}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 알림 동의 */}
              <div className="bg-white border border-[#E0E2E4] rounded-2xl p-4 space-y-3">
                <p className="text-xs font-bold text-[#202124]">🔔 선제 알림 수신 동의</p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-[#5F6368] cursor-pointer">
                    <input
                      type="radio"
                      name="notificationChannel"
                      value="sms"
                      checked={formData.notificationChannel === 'sms'}
                      onChange={handleChange}
                      className="accent-[#18A058]"
                    />
                    문자 수신 (권장)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[#5F6368] cursor-pointer">
                    <input
                      type="radio"
                      name="notificationChannel"
                      value="email"
                      checked={formData.notificationChannel === 'email'}
                      onChange={handleChange}
                      className="accent-[#18A058]"
                    />
                    이메일 수신
                  </label>
                </div>
                <p className="text-[10px] text-[#8C9196] leading-relaxed">
                  매일 밤 신규 공고 및 마감 임박 건을 정리하여 발송합니다. 언제든 설정에서 거부할 수 있습니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 하단 제어 버튼 */}
      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button
            onClick={handlePrev}
            className="flex-1 bg-white border border-[#E0E2E4] text-[#5F6368] font-bold text-sm py-3.5 rounded-full hover:bg-[#FAFAF7] transition-all"
          >
            이전
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={step === 1 && !formData.birthYear}
          className={`flex-[2] text-white font-bold text-sm py-3.5 rounded-full transition-all shadow-[0_4px_12px_rgba(24,160,88,0.15)] ${
            step === 1 && !formData.birthYear
              ? 'bg-[#8C9196] cursor-not-allowed shadow-none'
              : 'bg-[#18A058] hover:bg-[#148046] active:scale-95'
          }`}
        >
          {step === 3 ? 'WelfareFit 시작하기' : '다음 단계'}
        </button>
      </div>
    </div>
  );
};
