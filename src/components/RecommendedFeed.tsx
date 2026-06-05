'use client';

import React, { useState } from 'react';

// 복지 혜택 데이터 인터페이스 정의
interface Benefit {
  id: string;
  title: string;
  category: string;
  status: 'high' | 'check' | 'urgent' | 'new';
  description: string;
  benefitAmount: string;
  dDay?: string;
  tags: string[];
}

interface RecommendedFeedProps {
  onNavigateToChat: (initialQuery?: string) => void;
  onSelectBenefit: (benefitId: string) => void;
  savedIds: string[];
  onToggleSave: (benefitId: string) => void;
}

export const RecommendedFeed: React.FC<RecommendedFeedProps> = ({
  onNavigateToChat,
  onSelectBenefit,
  savedIds,
  onToggleSave,
}) => {
  // AI 챗봇 퀵 질의어 입력용 임시 상태
  const [chatInput, setChatInput] = useState('');

  // 복지 혜택 목업 데이터 리스트
  const mockBenefits: Benefit[] = [
    {
      id: 'bf-01',
      title: '청년 월세 한시 특별지원',
      category: '서울 청년',
      status: 'high',
      description: '부모님과 별도 거주하는 청년에게 월세를 한시적으로 지원하여 주거 안정을 돕습니다.',
      benefitAmount: '매달 최대 20만원 (최대 12개월)',
      dDay: 'D-14',
      tags: ['서울 거주', '만 19~34세', '무주택자']
    },
    {
      id: 'bf-02',
      title: '국민내일배움카드',
      category: '전국 공통',
      status: 'check',
      description: '급변하는 기술 트렌드 속에서 스스로 직무 능력을 개발할 수 있도록 훈련비를 지원합니다.',
      benefitAmount: '300만 ~ 500만원 한도 교육비',
      tags: ['구직자', '재직자', '일부 프리랜서']
    },
    {
      id: 'bf-03',
      title: '긴급복지 주거지원',
      category: '위기가구 지원',
      status: 'urgent',
      description: '갑작스러운 실직 또는 소득 단절로 인해 임대료가 체납되어 주거위기에 처한 가구를 지원합니다.',
      benefitAmount: '지자체 기준 임대료 전액 또는 일부 보조',
      dDay: 'D-3',
      tags: ['소득기준 충족', '체납가구', '위기상황']
    }
  ];

  // AI 상담 바로가기 트리거 핸들러
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onNavigateToChat(chatInput);
    }
  };

  // 상태 배지 매핑 함수 (Tailwind 커스텀 컬러 사용)
  const getStatusLabel = (status: Benefit['status']) => {
    switch (status) {
      case 'high':
        return { text: '가능성 높음', class: 'bg-[#EAF7F0] text-[#18A058]' };
      case 'check':
        return { text: '추가확인 필요', class: 'bg-[#FEF9E7] text-[#D9A100]' };
      case 'urgent':
        return { text: '마감 임박', class: 'bg-[#FDF2F2] text-[#EB5757]' };
      case 'new':
        return { text: '새 혜택', class: 'bg-[#EEF4FC] text-[#2F80ED]' };
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#FAFAF7] px-4 py-6 font-sans pb-24">
      {/* 상단 브랜딩 영역 */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-xs text-[#8C9196] font-medium tracking-wider">WELFAREFIT</h1>
          <p className="text-xl font-bold text-[#202124] mt-0.5">나를 위한 복지 피드</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#18A058] flex items-center justify-center text-white font-semibold shadow-sm">
          길동
        </div>
      </header>

      {/* AI 상담 빠른 입력 진입 창 (Glassmorphism 적용) */}
      <div className="glass-panel rounded-2xl p-5 mb-8 border border-white shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <p className="text-sm font-semibold text-[#202124] mb-1">💬 AI 복지 상담비서에게 물어보세요</p>
        <p className="text-xs text-[#5F6368] mb-4">"이번 달에 퇴사했는데 실업급여 받을 수 있을까?"</p>
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="상황이나 고민을 말해보세요..."
            className="flex-1 text-sm bg-white border border-[#E0E2E4] rounded-full px-4 py-2.5 focus:outline-none focus:border-[#18A058] transition-all"
          />
          <button
            type="submit"
            className="bg-[#18A058] hover:bg-[#148046] text-white rounded-full p-2.5 transition-all active:scale-95 flex items-center justify-center shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </div>

      {/* 복지 혜택 리스트 섹션 */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-base font-bold text-[#202124]">맞춤 추천 혜택</h2>
          <span className="text-xs text-[#18A058] font-semibold">총 {mockBenefits.length}건</span>
        </div>

        {mockBenefits.map((benefit) => {
          const statusInfo = getStatusLabel(benefit.status);
          const isSaved = savedIds.includes(benefit.id);

          return (
            <div
              key={benefit.id}
              onClick={() => onSelectBenefit(benefit.id)}
              className="welfare-card group bg-white rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:-translate-y-1 transition-all duration-300 relative border border-[#EDEDEB] cursor-pointer"
            >
              {/* 상단 태그 및 디데이 정보 */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${statusInfo.class}`}>
                    {statusInfo.text}
                  </span>
                  <span className="text-[10px] font-medium text-[#5F6368] px-2 py-1 bg-[#EDEDEB] rounded-md">
                    {benefit.category}
                  </span>
                </div>
                {benefit.dDay && (
                  <span className="text-xs font-bold text-[#EB5757]">{benefit.dDay}</span>
                )}
              </div>

              {/* 제목 및 짧은 설명 */}
              <h3 className="text-base font-bold text-[#202124] mb-1.5 group-hover:text-[#18A058] transition-colors">
                {benefit.title}
              </h3>
              <p className="text-xs text-[#5F6368] leading-relaxed mb-4">
                {benefit.description}
              </p>

              {/* 지원 내용 상자 */}
              <div className="bg-[#FAFAF7] rounded-xl p-3 mb-4">
                <span className="text-[10px] font-semibold text-[#8C9196] block mb-0.5">받는 지원 내용</span>
                <span className="text-xs font-bold text-[#202124]">{benefit.benefitAmount}</span>
              </div>

              {/* 하단 태그 리스트 */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {benefit.tags.map((tag, idx) => (
                  <span key={idx} className="text-[10px] text-[#5F6368] bg-[#FAFAF7] border border-[#EDEDEB] px-2 py-0.5 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* 액션 버튼 (클릭 전파 차단) */}
              <div className="flex gap-2 pt-2 border-t border-[#FAFAF7]" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onSelectBenefit(benefit.id)}
                  className="flex-1 bg-[#18A058]/10 hover:bg-[#18A058] text-[#18A058] hover:text-white text-xs font-bold py-2.5 rounded-xl transition-all text-center"
                >
                  자세히 보기
                </button>
                <button
                  onClick={() => onToggleSave(benefit.id)}
                  className={`px-3 py-2.5 rounded-xl border transition-all ${
                    isSaved
                      ? 'bg-[#18A058] border-[#18A058] text-white shadow-sm'
                      : 'border-[#E0E2E4] text-[#5F6368] hover:bg-[#FAFAF7]'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
