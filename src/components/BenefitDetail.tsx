'use client';

import React, { useState } from 'react';

// 상세화면에 전달될 복지 상세 데이터 구조 정의
interface BenefitDetailData {
  id: string;
  title: string;
  provider: string;
  plainSummary: string; // 쉬운 말 한 줄 요약
  benefitSummary: string; // 받을 수 있는 내용 요약
  targetSummary: string; // 신청 대상자 요약
  requirements: string[]; // 신청 자격 요건들
  documents: string[]; // 필요한 서류 목록
  applyUrl: string; // 정부 신청 링크
  deadline: string; // 신청 마감일
  rawContent: string; // 공공기관 원본 문구
}

interface BenefitDetailProps {
  benefitId: string;
  onBack: () => void;
  onToggleSave: (id: string) => void;
  savedIds: string[];
}

export const BenefitDetail: React.FC<BenefitDetailProps> = ({
  benefitId,
  onBack,
  onToggleSave,
  savedIds,
}) => {
  // 사용자가 완료한 구비 서류 체크 리스트 상태 관리
  const [completedDocs, setCompletedDocs] = useState<string[]>([]);
  
  // 정부 공고 원문 아코디언 열림 상태 관리
  const [showRaw, setShowRaw] = useState(false);

  // 목업 상세 데이터베이스
  const detailsDb: Record<string, BenefitDetailData> = {
    'bf-01': {
      id: 'bf-01',
      title: '청년 월세 한시 특별지원',
      provider: '국토교통부 주거복지지원과',
      plainSummary: '혼자 사는 청년들의 방세 걱정을 줄이기 위해 정부에서 1년 동안 매월 집세의 일부를 직접 현금으로 통장에 넣어주는 지원금입니다.',
      benefitSummary: '실제 내는 월세 범위 내에서 매달 최대 20만 원씩 최대 12개월(총 240만 원) 동안 나누어 받습니다.',
      targetSummary: '만 19세부터 34세 이하의 부모님과 떨어져 따로 사는 무주택 청년',
      requirements: [
        '나이: 신청 연도 기준 만 19세 ~ 34세 청년',
        '주거: 임차보증금 5천만 원 이하 및 월세 60만 원 이하의 주택에 거주',
        '소득 기준: 청년 본인 가구 소득이 기준 중위소득 60% 이하 (1인 가구 기준 약 월 133만 원)',
        '원가구 소득: 부모님을 포함한 가구 소득이 중위소득 100% 이하 (3인 가구 기준 약 월 471만 원)'
      ],
      documents: [
        '월세 지원 신청서 (앱 또는 행정복지센터 비치)',
        '임대차계약서 사본 (계약 내용 및 확정일자 확인용)',
        '최근 3개월간 월세 송금 이력 증빙 서류 (계좌 이체 내역서 등)',
        '가족관계증명서 (청년 본인 기준 및 부모님 기준 각 1부)',
        '서약서 및 통장 사본'
      ],
      applyUrl: 'https://www.bokjiro.go.kr',
      deadline: '2026년 12월 31일까지',
      rawContent: '본 사업은 주택법 제2조제1호에 따른 주택에 거주하는 무주택 청년(만19-34세 이하)을 대상으로 하며, 소득세법 제3조에 근거한 종합소득인정액이 가구원수별 기준 중위소득의 60%를 초과하지 아니하는 가구에 한해 월 임차료 실비 최대 20만원 한도 내에서 최장 1년간 매월 분할 지원을 실시함...'
    },
    'bf-02': {
      id: 'bf-02',
      title: '국민내일배움카드',
      provider: '고용노동부 직업능력정책과',
      plainSummary: '새로운 기술을 배우거나 취업 자격증을 따고 싶은 사람들에게 수강료의 일부 또는 전부를 정부가 지원해 주는 마법의 교육 카드입니다.',
      benefitSummary: '1인당 300만 원에서 500만 원까지의 직업 훈련 수강료를 카드 한도로 지급하여 교육 시 차감 사용합니다.',
      targetSummary: '취업을 준비하는 구직자, 현재 일하고 있는 직장인, 대학 졸업 예정자, 프리랜서 등 배움을 원하는 대부분의 국민',
      requirements: [
        '대상 범위: 일하고 싶거나 실력을 키우고 싶은 모든 국민 신청 가능',
        '제외 대상: 현직 공무원, 사립학교 교직원, 졸업예정자 이외의 재학생, 연 매출 1억 5천만 원 이상의 자영업자 등은 신청이 제한됩니다.',
        '지원 비율: 기초생활수급자 등 저소득층은 수강료 100% 전액 지원, 일반 참여자는 45%~85% 수준으로 차등 지원'
      ],
      documents: [
        '내일배움카드 발급 신청서',
        '신분증 사본',
        '직업훈련 참여 신청서 및 개인정보 동의서',
        '고용보험 자격 이력 내역서 (필요 시 자동 조회)'
      ],
      applyUrl: 'https://www.hrd.go.kr',
      deadline: '상시 신청 가능',
      rawContent: '근로자직업능력 개발법 제12조 및 제17조에 의거하여 구직자 및 재직자의 직무수행능력 습득 및 향상을 도모하고자 연간 소요 훈련비용의 일부를 신용/체크카드 형태로 크레딧을 부여하여 직업훈련개발훈련 과정을 이수하는 자에 대하여 차감 정산하는 제도임...'
    },
    'bf-03': {
      id: 'bf-03',
      title: '긴급복지 주거지원',
      provider: '보건복지부 기초생활보장과',
      plainSummary: '갑작스러운 실직이나 휴폐업으로 돈이 없어 밀린 월세 때문에 길거리에 나앉을 위기에 처한 가구에게 정부가 월세를 임시로 대신 내주는 긴급 구조 혜택입니다.',
      benefitSummary: '국가나 지자체에서 대행하여 임대인에게 임대료를 직접 입금해 주며, 가구원 수에 따라 월 지원 상한액이 다릅니다.',
      targetSummary: '주 소득자의 실직, 질병, 사망 등으로 월세가 연체되어 주거 상실 위기에 직면한 저소득 가구',
      requirements: [
        '소득 조건: 기준 중위소득 75% 이하 (1인 가구 기준 약 월 167만 원)',
        '재산 조건: 대도시는 2억 4천만 원 이하, 중소도시는 1억 5천만 원 이하의 재산 기준 충족 필요',
        '위기 사유: 실직, 폐업, 화재, 가출, 이혼 등 갑자기 주거 비용을 조달할 수 없게 된 사유 증빙'
      ],
      documents: [
        '긴급지원대상자 조사 및 보고서 (현장 조사 대행)',
        '월세 체납 및 임대차 계약 해지 예고장 (임대인 발급 또는 문자)',
        '소득 및 재산 증빙 서류 (계좌 내역 등)',
        '신분증 및 가족관계등록 서류'
      ],
      applyUrl: '',
      deadline: '상시 접수 (위기 상황 시 즉시 보건복지상담센터 129에 연락)',
      rawContent: '긴급복지지원법 제9조제1항제1호에 근거하여 주소득자 등의 실직, 질병, 재난 등 긴급한 위기사유 발생으로 주거 유지가 불가한 대상에게 긴급지원조사서 작성을 통한 현장 확인 후 지자체 재량 하에 임차 보증금 및 차임 등의 급여를 제공함...'
    }
  };

  const data = detailsDb[benefitId] || detailsDb['bf-01'];
  const isSaved = savedIds.includes(data.id);

  // 체크박스 클릭 핸들러
  const handleDocToggle = (doc: string) => {
    setCompletedDocs((prev) =>
      prev.includes(doc) ? prev.filter((d) => d !== doc) : [...prev, doc]
    );
  };

  return (
    <div className="max-w-md mx-auto bg-[#FAFAF7] min-h-screen px-4 py-6 font-sans pb-24">
      {/* 상단 네비게이션 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="text-[#5F6368] hover:text-[#202124] flex items-center gap-1 text-sm font-semibold transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg> Back
        </button>
        <button
          onClick={() => onToggleSave(data.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
            isSaved
              ? 'bg-[#18A058] border-[#18A058] text-white shadow-sm'
              : 'bg-white border-[#E0E2E4] text-[#5F6368]'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          {isSaved ? '저장됨' : '혜택 저장'}
        </button>
      </div>

      {/* 헤드라인 및 제공기관 */}
      <div className="mb-6">
        <span className="text-[10px] font-bold text-[#18A058] bg-[#EAF7F0] px-2.5 py-1 rounded-md">
          {data.provider}
        </span>
        <h1 className="text-xl font-bold text-[#202124] mt-2.5">{data.title}</h1>
        <p className="text-xs text-[#EB5757] font-semibold mt-1">신청 기한: {data.deadline}</p>
      </div>

      {/* AI 쉬운 말 요약 카드 (핵심) */}
      <div className="bg-white rounded-2xl p-5 border border-[#EDEDEB] shadow-sm mb-6 space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#18A058]">
          <span>✨</span> AI 쉬운 말 요약
        </div>
        <p className="text-xs text-[#202124] font-medium leading-relaxed bg-[#FAFAF7] p-3.5 rounded-xl border border-[#EDEDEB]">
          {data.plainSummary}
        </p>

        <div className="space-y-3">
          <div>
            <h4 className="text-[10px] font-bold text-[#8C9196] uppercase tracking-wide">누가 받나요?</h4>
            <p className="text-xs font-semibold text-[#202124] mt-0.5">{data.targetSummary}</p>
          </div>
          <div>
            <h4 className="text-[10px] font-bold text-[#8C9196] uppercase tracking-wide">무엇을 받나요?</h4>
            <p className="text-xs font-semibold text-[#18A058] mt-0.5">{data.benefitSummary}</p>
          </div>
        </div>
      </div>

      {/* 세부 자격 요건 아코디언 */}
      <div className="space-y-4 mb-6">
        <h3 className="text-sm font-bold text-[#202124] px-1">상세 신청 조건</h3>
        <div className="bg-white border border-[#EDEDEB] rounded-2xl p-4 space-y-2.5 shadow-sm">
          {data.requirements.map((req, idx) => (
            <div key={idx} className="flex gap-2.5 text-xs text-[#5F6368] leading-relaxed">
              <span className="text-[#18A058] font-bold mt-0.5">•</span>
              <span>{req}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 구비 서류 체크리스트 영역 */}
      <div className="space-y-4 mb-8">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-sm font-bold text-[#202124]">신청 준비 서류</h3>
          <span className="text-xs text-[#8C9196]">
            ({completedDocs.length}/{data.documents.length} 준비 완료)
          </span>
        </div>
        
        {/* 서류 진행 상태 바 */}
        <div className="h-1.5 w-full bg-[#EDEDEB] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#18A058] transition-all duration-500"
            style={{ width: `${(completedDocs.length / data.documents.length) * 100}%` }}
          />
        </div>

        {/* 체크리스트 아이템 */}
        <div className="bg-white border border-[#EDEDEB] rounded-2xl p-4 space-y-3.5 shadow-sm">
          {data.documents.map((doc, idx) => {
            const isChecked = completedDocs.includes(doc);
            return (
              <label
                key={idx}
                className="flex items-start gap-3 cursor-pointer group"
                onClick={() => handleDocToggle(doc)}
              >
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all mt-0.5 ${
                    isChecked
                      ? 'bg-[#18A058] border-[#18A058] text-white'
                      : 'border-[#E0E2E4] group-hover:border-[#18A058]'
                  }`}
                >
                  {isChecked && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`text-xs ${isChecked ? 'text-[#8C9196] line-through' : 'text-[#5F6368]'}`}>
                  {doc}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 정부 원문 공고 접기/펼치기 */}
      <div className="border border-[#EDEDEB] rounded-2xl mb-8 overflow-hidden bg-white shadow-sm">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="w-full px-4 py-3.5 flex justify-between items-center text-xs font-semibold text-[#5F6368] hover:bg-[#FAFAF7]"
        >
          <span>📄 정부 고시 원문 (참고용)</span>
          <span>{showRaw ? '접기' : '펼치기'}</span>
        </button>
        {showRaw && (
          <div className="p-4 bg-[#FAFAF7] border-t border-[#EDEDEB] text-[10px] text-[#8C9196] leading-relaxed font-mono">
            {data.rawContent}
          </div>
        )}
      </div>

      {/* 최하단 신청 바로가기 CTA 버튼 */}
      {data.applyUrl && (
        <a
          href={data.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full bg-[#18A058] hover:bg-[#148046] text-white text-center font-bold text-sm py-4 rounded-full shadow-[0_4px_12px_rgba(24,160,88,0.2)] active:scale-95 transition-all"
        >
          정부24 / 복지로로 신청하러 가기
        </a>
      )}
    </div>
  );
};
