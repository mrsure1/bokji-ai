'use client';

import React from 'react';

// 저장된 혜택의 데이터 인터페이스 정의
interface SavedBenefit {
  id: string;
  title: string;
  provider: string;
  dDay: string;
  deadline: string;
  docCount: number;
  completedDocCount: number;
}

interface SavedChecklistProps {
  savedIds: string[];
  onSelectBenefit: (id: string) => void;
  onRemove: (id: string) => void;
}

export const SavedChecklist: React.FC<SavedChecklistProps> = ({
  savedIds,
  onSelectBenefit,
  onRemove,
}) => {
  // 모조 저장 리스트 생성 데이터베이스
  const mockSavedDatabase: Record<string, SavedBenefit> = {
    'bf-01': {
      id: 'bf-01',
      title: '청년 월세 한시 특별지원',
      provider: '국토교통부',
      dDay: 'D-14',
      deadline: '26년 12월 31일',
      docCount: 5,
      completedDocCount: 3,
    },
    'bf-02': {
      id: 'bf-02',
      title: '국민내일배움카드',
      provider: '고용노동부',
      dDay: '상시',
      deadline: '상시 모집',
      docCount: 4,
      completedDocCount: 1,
    },
    'bf-03': {
      id: 'bf-03',
      title: '긴급복지 주거지원',
      provider: '보건복지부',
      dDay: 'D-3',
      deadline: '연중 상시 위기 가구 대상',
      docCount: 4,
      completedDocCount: 0,
    },
  };

  // 실제 사용자가 저장한 ID들에 부합하는 아이템 필터링
  const savedBenefits = savedIds
    .map((id) => mockSavedDatabase[id])
    .filter((b): b is SavedBenefit => !!b);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#FAFAF7] px-4 py-6 font-sans pb-24">
      {/* 타이틀 헤더 */}
      <header className="mb-6">
        <h1 className="text-xl font-bold text-[#202124]">저장한 혜택 보관함</h1>
        <p className="text-xs text-[#5F6368] mt-1">
          신청 준비 서류와 남은 일정을 관리하고 준비해 보세요.
        </p>
      </header>

      {/* 저장한 혜택 목록이 없는 경우 예외 처리 */}
      {savedBenefits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[#EDEDEB] flex items-center justify-center text-xl mb-4">
            📂
          </div>
          <p className="text-xs font-bold text-[#5F6368]">아직 저장된 복지 혜택이 없어요.</p>
          <p className="text-[10px] text-[#8C9196] mt-1 leading-relaxed">
            나를 위한 복지 피드나 AI 상담실에서<br />관심 있는 혜택의 북마크를 눌러 저장해보세요.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {savedBenefits.map((benefit) => {
            const progress = (benefit.completedDocCount / benefit.docCount) * 100;
            const isDDayUrgent = benefit.dDay.includes('D-3') || benefit.dDay.includes('D-1');

            return (
              <div
                key={benefit.id}
                onClick={() => onSelectBenefit(benefit.id)}
                className="bg-white border border-[#EDEDEB] rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative"
              >
                {/* 상단 뱃지 및 마감 D-Day */}
                <div className="flex justify-between items-start mb-2.5">
                  <span className="text-[9px] font-bold text-[#8C9196] bg-[#FAFAF7] px-2 py-0.5 border border-[#EDEDEB] rounded">
                    {benefit.provider}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      isDDayUrgent ? 'text-[#EB5757]' : 'text-[#18A058]'
                    }`}
                  >
                    {benefit.dDay}
                  </span>
                </div>

                {/* 혜택명 */}
                <h3 className="text-sm font-bold text-[#202124] mb-4 hover:text-[#18A058] transition-all">
                  {benefit.title}
                </h3>

                {/* 서류 준비 트래커 */}
                <div className="space-y-2 pt-3 border-t border-[#FAFAF7]">
                  <div className="flex justify-between items-center text-[10px] font-bold text-[#5F6368]">
                    <span>신청 서류 준비 상황</span>
                    <span>
                      {benefit.completedDocCount} / {benefit.docCount} 건
                    </span>
                  </div>
                  {/* 진행상황 바 */}
                  <div className="h-1.5 w-full bg-[#FAFAF7] border border-[#EDEDEB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#18A058] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* 삭제 및 상세보기 제어 버튼 (클릭 버블 방지) */}
                <div
                  className="flex justify-end gap-2.5 mt-4 pt-3 border-t border-[#FAFAF7]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onRemove(benefit.id)}
                    className="text-[10px] text-[#EB5757] font-semibold hover:underline"
                  >
                    보관함 삭제
                  </button>
                  <button
                    onClick={() => onSelectBenefit(benefit.id)}
                    className="text-[10px] text-[#18A058] font-bold hover:underline"
                  >
                    체크리스트 열기 →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
