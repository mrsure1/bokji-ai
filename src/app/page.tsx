'use client';

import React, { useState } from 'react';
import { Onboarding } from '@/components/Onboarding';
import { RecommendedFeed } from '@/components/RecommendedFeed';
import { AIChat } from '@/components/AIChat';
import { BenefitDetail } from '@/components/BenefitDetail';
import { SavedChecklist } from '@/components/SavedChecklist';
import { AdminReview } from '@/components/AdminReview';

// 데모 페이지에서 사용할 가능한 화면 키 정의
type ScreenType = 'onboarding' | 'feed' | 'chat' | 'detail' | 'saved' | 'admin';

export default function Home() {
  // 현재 활성화된 시안 화면 상태
  const [activeScreen, setActiveScreen] = useState<ScreenType>('feed');
  
  // 사용자가 저장한 혜택 ID 배열 상태 (컴포넌트 간 공유)
  const [savedIds, setSavedIds] = useState<string[]>(['bf-01']);
  
  // 피드 검색창에서 상담창으로 넘어갈 때 전달할 검색어 상태
  const [initialChatQuery, setInitialChatQuery] = useState<string | undefined>(undefined);
  
  // 현재 상세조회 중인 복지 혜택 ID 상태
  const [selectedBenefitId, setSelectedBenefitId] = useState<string>('bf-01');

  // 북마크 저장/취소 토글 핸들러
  const handleToggleSave = (id: string) => {
    setSavedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // 피드에서 AI상담으로 이동할 때 핸들러
  const handleNavigateToChat = (query?: string) => {
    setInitialChatQuery(query);
    setActiveScreen('chat');
  };

  // 피드/채팅에서 상세보기로 이동할 때 핸들러
  const handleSelectBenefit = (id: string) => {
    setSelectedBenefitId(id);
    setActiveScreen('detail');
  };

  // 온보딩 완료 시 피드로 이동
  const handleOnboardingComplete = (data: any) => {
    console.log('온보딩 완료 데이터:', data);
    setActiveScreen('feed');
  };

  return (
    <div className="min-h-screen bg-[#F1F3F5] flex flex-col">
      {/* 최상단 데모 컨트롤 바 */}
      <nav className="bg-[#202124] text-white px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-md z-10">
        <div className="flex items-center gap-3">
          <span className="bg-[#18A058] text-white text-xs font-bold px-2.5 py-1 rounded-md">WelfareFit</span>
          <span className="text-sm font-semibold tracking-wide text-zinc-300">
            Calm Pop Welfare 디자인 시안 데모 플레이그라운드
          </span>
        </div>
        {/* 6종 시안 스위처 버튼 묶음 */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {(['onboarding', 'feed', 'chat', 'detail', 'saved', 'admin'] as const).map((screen) => {
            const labels: Record<ScreenType, string> = {
              onboarding: '1. 온보딩 폼',
              feed: '2. 추천 피드',
              chat: '3. AI 상담실',
              detail: '4. 요약 상세',
              saved: '5. 보관함/체크',
              admin: '6. 어드민 콘솔',
            };
            return (
              <button
                key={screen}
                onClick={() => {
                  setActiveScreen(screen);
                  // 채팅 탭 클릭 시에는 이전 쿼리 제거하여 빈 채팅으로 리로드 가능하게 처리
                  if (screen === 'chat') setInitialChatQuery(undefined);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeScreen === screen
                    ? 'bg-[#18A058] text-white shadow-sm'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
                }`}
              >
                {labels[screen]}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 메인 레이아웃 구역 */}
      <main className="flex-1 flex flex-col lg:flex-row p-6 gap-6 justify-center items-stretch">
        
        {/* 시안 화면에 따른 뷰포트 분기 */}
        {activeScreen === 'admin' ? (
          // 6. 관리자 화면: 넓은 데스크톱 뷰포트
          <div className="w-full bg-[#FAFAF7] rounded-3xl border border-[#EDEDEB] shadow-lg overflow-hidden p-6 self-start">
            <div className="mb-4 text-xs font-medium text-zinc-500">
              * 본 화면은 어드민 웹 서비스 데스크톱 시안 사양을 나타냅니다.
            </div>
            <AdminReview />
          </div>
        ) : (
          // 1~5. 모바일 PWA용 컴포넌트: 모바일 기기 프레임 적용
          <div className="flex flex-col lg:flex-row gap-6 w-full max-w-5xl justify-center items-start">
            
            {/* 왼쪽: 모바일 기기 시뮬레이터 (PWA 형태) */}
            <div className="w-[375px] h-[812px] bg-white rounded-[40px] border-[12px] border-zinc-900 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none mx-auto lg:mx-0 shrink-0">
              
              {/* 모바일 노치바 시뮬레이션 */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-zinc-900 rounded-b-2xl z-20 flex justify-center items-end pb-1">
                <div className="w-12 h-1 bg-zinc-800 rounded-full" />
              </div>

              {/* 기기 배터리/시간 표시 영역 */}
              <div className="h-10 bg-white border-b border-[#FAFAF7] flex justify-between items-center px-6 pt-3 text-[10px] font-bold text-zinc-500 z-10 shrink-0">
                <span>17:30</span>
                <div className="flex gap-1.5 items-center">
                  <span>5G</span>
                  <div className="w-5 h-2.5 border border-zinc-500 rounded-sm p-0.5 flex items-center">
                    <div className="w-full h-full bg-zinc-600 rounded-2xs" />
                  </div>
                </div>
              </div>

              {/* 실제 PWA 앱 구동 화면 */}
              <div className="flex-1 overflow-y-auto bg-[#FAFAF7]">
                {activeScreen === 'onboarding' && (
                  <Onboarding onComplete={handleOnboardingComplete} />
                )}
                {activeScreen === 'feed' && (
                  <RecommendedFeed
                    onNavigateToChat={handleNavigateToChat}
                    onSelectBenefit={handleSelectBenefit}
                    savedIds={savedIds}
                    onToggleSave={handleToggleSave}
                  />
                )}
                {activeScreen === 'chat' && (
                  <AIChat
                    initialQuery={initialChatQuery}
                    onSelectBenefit={handleSelectBenefit}
                    onToggleSave={handleToggleSave}
                    savedIds={savedIds}
                  />
                )}
                {activeScreen === 'detail' && (
                  <BenefitDetail
                    benefitId={selectedBenefitId}
                    onBack={() => setActiveScreen('feed')}
                    onToggleSave={handleToggleSave}
                    savedIds={savedIds}
                  />
                )}
                {activeScreen === 'saved' && (
                  <SavedChecklist
                    savedIds={savedIds}
                    onSelectBenefit={handleSelectBenefit}
                    onRemove={handleToggleSave}
                  />
                )}
              </div>

              {/* PWA 전용 하단 탭바 메뉴 */}
              <div className="h-20 bg-white border-t border-[#EDEDEB] flex justify-around items-center px-4 pb-4 shrink-0 z-10">
                {([
                  { key: 'feed', icon: '🏠', label: '홈 피드' },
                  { key: 'chat', icon: '💬', label: 'AI 상담' },
                  { key: 'saved', icon: '📂', label: '보관함' },
                ] as const).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveScreen(tab.key);
                      if (tab.key === 'chat') setInitialChatQuery(undefined);
                    }}
                    className={`flex flex-col items-center justify-center gap-1 w-16 h-12 transition-all ${
                      activeScreen === tab.key
                        ? 'text-[#18A058] scale-105 font-bold'
                        : 'text-zinc-400 font-medium'
                    }`}
                  >
                    <span className="text-lg">{tab.icon}</span>
                    <span className="text-[9px]">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* 모바일 하단 홈바 인디케이터 */}
              <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-zinc-900 rounded-full z-20" />
            </div>

            {/* 오른쪽: 가이드라인 및 설명 판넬 */}
            <div className="flex-1 bg-white border border-[#EDEDEB] rounded-3xl p-6 shadow-md flex flex-col justify-between min-h-[400px]">
              <div>
                <span className="text-[10px] font-bold text-[#18A058] bg-[#EAF7F0] px-2.5 py-1 rounded-md uppercase tracking-wider">
                  시안 가이드
                </span>
                
                {activeScreen === 'onboarding' && (
                  <div className="mt-4 space-y-3">
                    <h3 className="text-lg font-bold text-[#202124]">1. 온보딩 폼 프로필 입력</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      사용자의 기초 정보(출생년도, 지역, 취업상태, 관심분야)를 부담스럽지 않게 한 단계씩 순차 수집하는 UI입니다.
                    </p>
                    <ul className="text-xs text-zinc-500 list-disc pl-4 space-y-1">
                      <li>진행 단계(1~3)를 직관적으로 나타내는 바 및 점 디자인</li>
                      <li>모바일 접근성(터치 영역)을 고려한 큼직한 폼 구성</li>
                      <li>마지막 단계에 야간 발송 방지용 SMS 알림 동의 포함</li>
                    </ul>
                  </div>
                )}

                {activeScreen === 'feed' && (
                  <div className="mt-4 space-y-3">
                    <h3 className="text-lg font-bold text-[#202124]">2. 맞춤 추천 혜택 피드 (홈)</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      로그인 시 첫 화면으로, 사용자 조건에 필터링된 복지 목록을 매칭 적합도 뱃지와 함께 나타내는 피드형 UI입니다.
                    </p>
                    <ul className="text-xs text-zinc-500 list-disc pl-4 space-y-1">
                      <li>자연어 상담으로 바로 유도하는 통합 AI 질의바 최상단 고정</li>
                      <li>가능성 높음(Green), 마감 임박(Red), 확인 필요(Yellow) 배지 구분</li>
                      <li>북마크 저장 버튼으로 즉시 피드백 제공</li>
                    </ul>
                  </div>
                )}

                {activeScreen === 'chat' && (
                  <div className="mt-4 space-y-3">
                    <h3 className="text-lg font-bold text-[#202124]">3. 자연어 AI 상담실 (챗봇)</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      "퇴직해서 월세가 부담돼" 같은 일상 고민을 치면 AI가 이를 분석하여 추천 혜택 카드 캐러셀과 함께 친절히 응답하는 대화형 UI입니다.
                    </p>
                    <ul className="text-xs text-zinc-500 list-disc pl-4 space-y-1">
                      <li>긴 행정 텍스트를 AI가 상황 공감 요약문과 가로 카드 스크롤로 구성</li>
                      <li>사용자가 더 쉽게 답할 수 있도록 지자체 퀵 리플라이 버튼 연동</li>
                      <li>"반드시 지원받는다" 대신 "신청 조건 검토 필요" 등 안내</li>
                    </ul>
                  </div>
                )}

                {activeScreen === 'detail' && (
                  <div className="mt-4 space-y-3">
                    <h3 className="text-lg font-bold text-[#202124]">4. 혜택 상세 및 AI 쉬운 말 요약</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      행정 전문 문장을 배제하고, AI가 해독한 초등학생 눈높이의 한 줄 요약 및 무엇을, 언제, 어떻게 받는지 일목요연하게 표시합니다.
                    </p>
                    <ul className="text-xs text-zinc-500 list-disc pl-4 space-y-1">
                      <li>상세 준비 서류를 미리 챙길 수 있는 다이내믹 서류 체크리스트</li>
                      <li>신뢰성을 보장하기 위해 하단에 원문 접기/펼치기 아코디언 제공</li>
                      <li>원클릭으로 정부24 등 신청 페이지 아웃링크 연결</li>
                    </ul>
                  </div>
                )}

                {activeScreen === 'saved' && (
                  <div className="mt-4 space-y-3">
                    <h3 className="text-lg font-bold text-[#202124]">5. 저장한 혜택 보관함 & 체크리스트</h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      저장된 혜택의 마감 일정을 확인하고, 준비한 서류 체크 개수를 게이지로 직관적으로 추적하는 트래커 화면입니다.
                    </p>
                    <ul className="text-xs text-zinc-500 list-disc pl-4 space-y-1">
                      <li>마감 3일 전 임박 시 Coral Red D-Day 강조</li>
                      <li>준비 완료 개수에 맞게 동적으로 늘어나는 진행 바 시각 효과</li>
                      <li>원클릭 삭제 및 체크리스트 바로가기 퀵 메뉴 지원</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* 하단 트랜드 가이드 칩 */}
              <div className="pt-6 border-t border-[#EDEDEB] space-y-2">
                <span className="text-[10px] font-bold text-[#8C9196] block uppercase">Calm Pop UI Tech</span>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  본 플레이그라운드는 Next.js 15와 Tailwind CSS v4를 활용하여 렌더링되고 있습니다.
                  CSS Variables 기반의 디자인 시스템을 사용하여 다크모드 및 모바일 PWA 환경에 기민하게 반응합니다.
                </p>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}

