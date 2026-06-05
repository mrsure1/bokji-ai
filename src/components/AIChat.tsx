'use client';

import React, { useState, useEffect, useRef } from 'react';

// 메시지 객체 정의 인터페이스
interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  benefits?: {
    id: string;
    title: string;
    description: string;
    amount: string;
    tags: string[];
  }[];
  quickReplies?: string[];
}

interface AIChatProps {
  initialQuery?: string;
  onSelectBenefit: (id: string) => void;
  onToggleSave: (id: string) => void;
  savedIds: string[];
}

export const AIChat: React.FC<AIChatProps> = ({
  initialQuery,
  onSelectBenefit,
  onToggleSave,
  savedIds,
}) => {
  // 메시지 리스트 상태 관리
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: '안녕하세요! 복지 상담 비서 WelfareFit AI입니다. 복잡한 행정 용어를 몰라도 괜찮아요. 지금 처하신 생활 상황이나 고민을 편하게 말씀해 주세요.',
      timestamp: new Date(),
    },
  ]);
  
  // 챗봇 입력 필드 상태
  const [inputValue, setInputValue] = useState('');
  
  // 대화창 자동 스크롤 참조
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 자동 스크롤 함수
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 첫 진입 시 initialQuery가 존재하는 경우 자동 질의 발송
  useEffect(() => {
    if (initialQuery) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  // 메시지 발송 함수
  const handleSendMessage = (textToSend: string) => {
    if (!textToSend.trim()) return;

    // 1. 유저 메시지 추가
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    // 2. AI 답변 시뮬레이션 (1.5초 대기 후 응답)
    setTimeout(() => {
      let aiResponseText = '';
      let recommendedBenefits: Message['benefits'] = [];
      let quickReplies: string[] = [];

      // 유저 텍스트에 따른 시나리오성 응답 분기
      const text = textToSend.toLowerCase();
      if (text.includes('퇴사') || text.includes('실직') || text.includes('월세') || text.includes('돈이')) {
        aiResponseText = '갑작스러운 일자리 상실로 주거비 부담이 크시겠어요. 주거 불안을 덜어드릴 수 있는 맞춤 복지 혜택 2건을 찾았습니다. 신청 조건 확인을 위해 소득 요건이 추가 검토되어야 합니다.';
        recommendedBenefits = [
          {
            id: 'bf-01',
            title: '청년 월세 한시 특별지원',
            description: '월세 부담이 큰 무주택 청년에게 매월 일정 임대료를 직접 보조합니다.',
            amount: '최대 월 20만원 지원 (12개월)',
            tags: ['청년', '무주택', '소득기준 충족']
          },
          {
            id: 'bf-03',
            title: '긴급복지 주거지원',
            description: '실직 등 위기상황으로 임대료가 연체되어 퇴거 위험에 처한 경우 긴급 주거비를 제공합니다.',
            amount: '지자체 기준 임대료 전액 또는 일부',
            tags: ['소득기준 충족', '위기상황']
          }
        ];
        quickReplies = ['서울특별시 지원 보기', '경기도 지원 보기', '소득 기준 확인하기'];
      } else if (text.includes('내일배움') || text.includes('교육') || text.includes('공부') || text.includes('자격증')) {
        aiResponseText = '직무 능력 향상과 취업 준비를 위한 국비 교육 혜택을 추천해 드립니다. 카드를 발급하시면 제휴된 교육 과정에 비용을 지원받을 수 있습니다.';
        recommendedBenefits = [
          {
            id: 'bf-02',
            title: '국민내일배움카드',
            description: '개인의 직무능력 향상 교육비 및 훈련 과정을 국비로 지원하는 대표적인 직업훈련 지원금입니다.',
            amount: '300만 ~ 500만원 한도 교육비',
            tags: ['구직자', '재직자', '일부 프리랜서']
          }
        ];
        quickReplies = ['신청 방법 알려줘', '무슨 강의 들을 수 있어?'];
      } else {
        aiResponseText = '말씀해 주신 내용과 매칭되는 전용 혜택을 수집 중입니다. 더 정확한 추천을 위해 현재 하시는 일(대학생, 구직 중, 프리랜서 등)이나 거주 지역을 알려주시겠어요?';
        quickReplies = ['청년 혜택 전체보기', '거주지 등록하기', '처음으로 돌아가기'];
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date(),
        benefits: recommendedBenefits.length > 0 ? recommendedBenefits : undefined,
        quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
      };

      setMessages((prev) => [...prev, aiMsg]);
    }, 1200);
  };

  return (
    <div className="max-w-md mx-auto bg-[#FAFAF7] h-[90vh] flex flex-col justify-between font-sans relative">
      {/* 챗 상단 타이틀 */}
      <div className="px-4 py-4 bg-white border-b border-[#EDEDEB] flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#18A058]/10 flex items-center justify-center">
          <span className="text-[#18A058] font-bold text-sm">AI</span>
        </div>
        <div>
          <h2 className="text-sm font-bold text-[#202124]">WelfareFit AI 상담사</h2>
          <span className="text-[10px] text-[#18A058] flex items-center gap-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#18A058] animate-pulse" /> 실시간 맞춤 분석 중
          </span>
        </div>
      </div>

      {/* 대화 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[85%] space-y-2">
                {/* 챗 풍선 */}
                <div
                  className={`rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-[#202124] text-white rounded-tr-none'
                      : 'bg-white text-[#202124] rounded-tl-none border border-[#EDEDEB]'
                  }`}
                >
                  {msg.text}
                </div>

                {/* 첨부된 추천 혜택 카드 캐러셀 */}
                {msg.benefits && (
                  <div className="flex gap-3 overflow-x-auto py-1 scrollbar-none w-full">
                    {msg.benefits.map((benefit) => {
                      const isSaved = savedIds.includes(benefit.id);
                      return (
                        <div
                          key={benefit.id}
                          className="min-w-[240px] bg-white border border-[#E0E2E4] rounded-xl p-4 shadow-sm flex flex-col justify-between"
                        >
                          <div>
                            <span className="text-[9px] font-bold text-[#18A058] bg-[#EAF7F0] px-1.5 py-0.5 rounded">
                              AI 추천
                            </span>
                            <h4 className="text-xs font-bold text-[#202124] mt-2 mb-1">
                              {benefit.title}
                            </h4>
                            <p className="text-[10px] text-[#5F6368] leading-normal line-clamp-2">
                              {benefit.description}
                            </p>
                            <div className="mt-2 bg-[#FAFAF7] p-2 rounded-lg">
                              <span className="text-[8px] text-[#8C9196] block font-medium">지원 혜택</span>
                              <span className="text-[10px] font-bold text-[#202124]">{benefit.amount}</span>
                            </div>
                          </div>

                          <div className="flex gap-1.5 mt-3 pt-2 border-t border-[#FAFAF7]">
                            <button
                              onClick={() => onSelectBenefit(benefit.id)}
                              className="flex-1 bg-[#18A058] text-white text-[10px] font-bold py-1.5 rounded-lg text-center"
                            >
                              상세보기
                            </button>
                            <button
                              onClick={() => onToggleSave(benefit.id)}
                              className={`p-1.5 rounded-lg border text-[#5F6368] ${
                                isSaved ? 'bg-[#18A058]/10 border-[#18A058] text-[#18A058]' : 'border-[#E0E2E4]'
                              }`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill={isSaved ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 퀵 리플라이 버튼 묶음 */}
                {!isUser && msg.quickReplies && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {msg.quickReplies.map((reply, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(reply)}
                        className="bg-white border border-[#E0E2E4] hover:border-[#18A058] hover:bg-[#18A058]/5 text-[#5F6368] hover:text-[#18A058] text-[10px] px-3 py-1.5 rounded-full transition-all"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* 챗 입력 하단 영역 */}
      <div className="p-3 bg-white border-t border-[#EDEDEB] shadow-[0_-4px_16px_rgba(0,0,0,0.02)]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputValue);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="예: 이번 달 월세가 밀려서 주거비 지원을 원해..."
            className="flex-1 text-xs bg-[#FAFAF7] border border-[#E0E2E4] rounded-2xl px-4 py-3 focus:outline-none focus:border-[#18A058] transition-all"
          />
          <button
            type="submit"
            className="bg-[#202124] text-white hover:bg-black rounded-2xl px-4 py-3 text-xs font-bold transition-all active:scale-95 shadow-sm"
          >
            전송
          </button>
        </form>
      </div>
    </div>
  );
};
