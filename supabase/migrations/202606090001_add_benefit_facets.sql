-- add_benefit_facets: 검색·하드필터용 정규화 facet 컬럼 추가
-- profiles(region_sido/region_sigungu/household_type/interests …)와 대응시켜
-- "프로필 ↔ 혜택" 결정적 매칭을 가능하게 함.

alter table public.benefits
  add column if not exists region_sido text,
  add column if not exists region_sigungu text,
  add column if not exists life_stages text[] not null default '{}',
  add column if not exists household_types text[] not null default '{}',
  add column if not exists themes text[] not null default '{}',
  add column if not exists category text;

-- 하드필터 인덱스
create index if not exists benefits_region_sido_idx on public.benefits (region_sido);
create index if not exists benefits_category_idx on public.benefits (category);
create index if not exists benefits_life_stages_idx on public.benefits using gin (life_stages);
create index if not exists benefits_household_types_idx on public.benefits using gin (household_types);
create index if not exists benefits_themes_idx on public.benefits using gin (themes);

comment on column public.benefits.region_sido is '시도명. null=전국 공통';
comment on column public.benefits.region_sigungu is '시군구명. null=시도 전역 또는 전국';
comment on column public.benefits.life_stages is '생애주기(영유아/아동/청소년/청년/중장년/노년/임신·출산)';
comment on column public.benefits.household_types is '가구유형(다문화·탈북민/다자녀/보훈대상자/장애인/저소득/한부모·조손)';
comment on column public.benefits.themes is '관심주제(복지로 코드표 기반)';
comment on column public.benefits.category is '코스 카테고리(주거/의료/일자리/생계/육아/교육/장애/노인/돌봄/문화/기타)';
