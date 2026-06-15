-- 벡터 의미검색 RPC. benefit_embeddings(vector(1536), HNSW cosine) 기반.
-- 코사인 유사도 = 1 - (embedding <=> query). 가장 유사한 순으로 match_count개 반환.
create or replace function match_benefits(query_embedding vector(1536), match_count int default 30)
returns table (benefit_id uuid, similarity float)
language sql stable
as $$
  select e.benefit_id, 1 - (e.embedding <=> query_embedding) as similarity
  from benefit_embeddings e
  where e.content_type = 'catalog'
  order by e.embedding <=> query_embedding
  limit match_count
$$;
