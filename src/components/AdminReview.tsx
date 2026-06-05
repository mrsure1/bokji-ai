'use client';

import React, { useState } from 'react';

// 검수용 공고 상세 데이터 인터페이스
interface ReviewItem {
  id: string;
  title: string;
  provider: string;
  collectedAt: string;
  rawNotice: string;
  aiPlainSummary: string;
  aiBenefitSummary: string;
  aiTargetSummary: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const AdminReview: React.FC = () => {
  // 모조 데이터 리스트
  const [items, setItems] = useState<ReviewItem[]>([
    {
      id: 'bf-01',
      title: '청년 월세 한시 특별지원',
      provider: '국토교통부',
      collectedAt: '2026-06-04 03:00',
      rawNotice: '본 사업은 주택법 제2조제1호에 따른 주택에 거주하는 무주택 청년(만19-34세 이하)을 대상으로 하며, 소득세법 제3조에 근거한 종합소득인정액이 가구원수별 기준 중위소득의 60%를 초과하지 아니하는 가구에 한해 월 임차료 실비 최대 20만원 한도 내에서 최장 1년간 매월 분할 지원을 실시함...',
      aiPlainSummary: '혼자 사는 청년들의 방세 걱정을 줄이기 위해 정부에서 1년 동안 매월 집세의 일부를 직접 현금으로 통장에 넣어주는 지원금입니다.',
      aiBenefitSummary: '실제 내는 월세 범위 내에서 매달 최대 20만 원씩 최대 12개월(총 240만 원) 동안 나누어 받습니다.',
      aiTargetSummary: '만 19세부터 34세 이하의 부모님과 떨어져 따로 사는 무주택 청년',
      status: 'pending',
    },
    {
      id: 'bf-02',
      title: '국민내일배움카드',
      provider: '고용노동부',
      collectedAt: '2026-06-04 03:15',
      rawNotice: '근로자직업능력 개발법 제12조 및 제17조에 의거하여 구직자 및 재직자의 직무수행능력 습득 및 향상을 도모하고자 연간 소요 훈련비용의 일부를 신용/체크카드 형태로 크레딧을 부여하여 직업훈련개발훈련 과정을 이수하는 자에 대하여 차감 정산하는 제도임...',
      aiPlainSummary: '새로운 기술을 배우거나 취업 자격증을 따고 싶은 사람들에게 수강료의 일부 또는 전부를 정부가 지원해 주는 마법의 교육 카드입니다.',
      aiBenefitSummary: '1인당 300만 원에서 500만 원까지의 직업 훈련 수강료를 카드 한도로 지급하여 교육 시 차감 사용합니다.',
      aiTargetSummary: '취업을 준비하는 구직자, 현재 일하고 있는 직장인, 대학 졸업 예정자, 프리랜서 등 배움을 원하는 대부분의 국민',
      status: 'pending',
    }
  ]);

  // 현재 선택된 검수 아이템 상태
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  
  // 편집용 로컬 폼 상태
  const activeItem = items[selectedIdx];
  const [editPlain, setEditPlain] = useState(activeItem?.aiPlainSummary || '');
  const [editBenefit, setEditBenefit] = useState(activeItem?.aiBenefitSummary || '');
  const [editTarget, setEditTarget] = useState(activeItem?.aiTargetSummary || '');

  // 선택된 항목이 변경될 때마다 폼 동기화
  const handleSelectItem = (idx: number) => {
    setSelectedIdx(idx);
    setEditPlain(items[idx].aiPlainSummary);
    setEditBenefit(items[idx].aiBenefitSummary);
    setEditTarget(items[idx].aiTargetSummary);
  };

  // 편집 내용 임시 저장 핸들러
  const handleSaveEdit = () => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === selectedIdx
          ? {
              ...item,
              aiPlainSummary: editPlain,
              aiBenefitSummary: editBenefit,
              aiTargetSummary: editTarget,
              status: 'approved',
            }
          : item
      )
    );
    alert('AI 쉬운 말 요약 및 가이드 수정이 완료되고 승인 처리되었습니다!');
  };

  return (
    <div className="w-full max-w-5xl mx-auto min-h-screen bg-[#F1F3F5] p-6 font-sans">
      {/* 어드민 대시보드 헤더 */}
      <header className="flex justify-between items-center mb-6 pb-4 border-b border-[#E9ECEF]">
        <div>
          <span className="text-[10px] font-bold text-[#18A058] tracking-widest uppercase">Admin Workspace</span>
          <h1 className="text-xl font-bold text-[#212529] mt-0.5">WelfareFit AI 요약 및 공고 검수 콘솔</h1>
        </div>
        <div className="text-xs text-[#495057] font-semibold">
          검수 대기: <span className="text-[#EB5757] font-bold">{items.filter((i) => i.status === 'pending').length}건</span>
        </div>
      </header>

      {/* 2열 스플릿 레이아웃 (좌: 목록, 우: 상세 편집기) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 좌측 패널: 수집된 공고 목록 */}
        <div className="bg-white rounded-2xl border border-[#E9ECEF] p-4 shadow-sm h-[75vh] overflow-y-auto space-y-3">
          <h2 className="text-xs font-bold text-[#868E96] uppercase tracking-wider mb-2">수집된 공고 리스트</h2>
          {items.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => handleSelectItem(idx)}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                idx === selectedIdx
                  ? 'bg-[#18A058]/5 border-[#18A058] shadow-sm'
                  : 'bg-[#FAFAF7] border-[#E9ECEF] hover:bg-white'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[9px] font-bold text-[#18A058] bg-[#EAF7F0] px-1.5 py-0.5 rounded">
                  {item.provider}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  item.status === 'approved' ? 'bg-[#EAF7F0] text-[#18A058]' : 'bg-[#FEF9E7] text-[#D9A100]'
                }`}>
                  {item.status === 'approved' ? '검수 완료' : '대기 중'}
                </span>
              </div>
              <h3 className="text-xs font-bold text-[#212529] line-clamp-1">{item.title}</h3>
              <span className="text-[8px] text-[#868E96] block mt-1">수집시각: {item.collectedAt}</span>
            </div>
          ))}
        </div>

        {/* 우측 패널: 2분할 스플릿뷰 편집기 */}
        <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-4 bg-white rounded-2xl border border-[#E9ECEF] p-5 shadow-sm h-[75vh] overflow-y-auto">
          
          {/* 상세 편집 좌열: 수집 원본 정부 공고문 */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-[#868E96] uppercase tracking-wider">공공 API 수집 원문</h2>
            <div className="bg-[#FAFAF7] border border-[#E9ECEF] rounded-xl p-4 h-[55vh] overflow-y-auto text-[11px] text-[#495057] leading-relaxed font-mono whitespace-pre-line">
              <strong className="text-xs text-[#212529] block mb-2">공고 제목: {activeItem?.title}</strong>
              {activeItem?.rawNotice}
            </div>
          </div>

          {/* 상세 편집 우열: AI 생성 쉬운 말 편집기 */}
          <div className="space-y-4 flex flex-col justify-between h-full">
            <div className="space-y-4 overflow-y-auto h-[55vh] pr-1">
              <h2 className="text-xs font-bold text-[#868E96] uppercase tracking-wider">AI 쉬운 말 번역 편집</h2>
              
              {/* 한 줄 요약 입력 */}
              <div>
                <label className="block text-[10px] font-bold text-[#495057] mb-1">쉬운 말 한 줄 요약</label>
                <textarea
                  value={editPlain}
                  onChange={(e) => setEditPlain(e.target.value)}
                  className="w-full text-xs p-3 bg-[#FAFAF7] border border-[#E9ECEF] rounded-xl h-24 focus:outline-none focus:border-[#18A058] transition-all leading-relaxed"
                />
              </div>

              {/* 지원 혜택 입력 */}
              <div>
                <label className="block text-[10px] font-bold text-[#495057] mb-1">지원 내용 (무엇을 받나요?)</label>
                <textarea
                  value={editBenefit}
                  onChange={(e) => setEditBenefit(e.target.value)}
                  className="w-full text-xs p-3 bg-[#FAFAF7] border border-[#E9ECEF] rounded-xl h-20 focus:outline-none focus:border-[#18A058] transition-all leading-relaxed"
                />
              </div>

              {/* 신청 대상 입력 */}
              <div>
                <label className="block text-[10px] font-bold text-[#495057] mb-1">신청 대상자 (누가 받나요?)</label>
                <input
                  type="text"
                  value={editTarget}
                  onChange={(e) => setEditTarget(e.target.value)}
                  className="w-full text-xs p-3 bg-[#FAFAF7] border border-[#E9ECEF] rounded-xl focus:outline-none focus:border-[#18A058] transition-all"
                />
              </div>
            </div>

            {/* 검수 승인 저장 버튼 */}
            <div className="pt-4 border-t border-[#E9ECEF]">
              <button
                onClick={handleSaveEdit}
                className="w-full bg-[#18A058] hover:bg-[#148046] text-white font-bold text-xs py-3.5 rounded-full transition-all active:scale-95 shadow-sm"
              >
                검수 승인 및 퍼블리싱 저장
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
