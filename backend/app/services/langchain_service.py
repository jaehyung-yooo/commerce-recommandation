"""
LangChain 기반 RAG 및 에이전트 서비스
"""

import os
import asyncio
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from loguru import logger

# LangChain imports
from langchain_core.documents import Document
from langchain_core.embeddings import Embeddings
from langchain_core.vectorstores import VectorStore
from langchain_core.retrievers import BaseRetriever
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableParallel
from langchain_community.vectorstores import OpenSearchVectorSearch
from langchain_google_vertexai import VertexAIEmbeddings, ChatVertexAI

# Custom imports
from app.core.opensearch_client import get_opensearch_client
from app.services.review_service import ReviewHybridSearchService


class LangChainVertexEmbeddings(Embeddings):
    """Vertex AI 임베딩을 위한 LangChain 래퍼"""
    
    def __init__(self):
        self.project_id = os.getenv("GOOGLE_CLOUD_PROJECT_ID")
        self.location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        self.model_name = os.getenv("VERTEX_EMBEDDING_MODEL", "text-multilingual-embedding-002")
        
        # LangChain Vertex AI 임베딩 초기화
        self.embeddings = VertexAIEmbeddings(
            model_name=self.model_name,
            project=self.project_id,
            location=self.location
        )
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """문서 임베딩"""
        return self.embeddings.embed_documents(texts)
    
    def embed_query(self, text: str) -> List[float]:
        """쿼리 임베딩"""
        return self.embeddings.embed_query(text)


class LangChainRAGService:
    """LangChain 기반 RAG 서비스"""
    
    def __init__(self, db: Session, redis_client=None, opensearch_client=None):
        self.db = db
        self.redis_client = redis_client
        self.opensearch_client = opensearch_client
        
        # LangChain 컴포넌트 초기화
        self.embeddings = LangChainVertexEmbeddings()
        self.llm = ChatVertexAI(
            model_name="gemini-pro",
            project=os.getenv("GOOGLE_CLOUD_PROJECT_ID"),
            location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"),
            temperature=0.1
        )
        
        # OpenSearch 벡터 스토어 설정
        self.vector_store = self._setup_vector_store()
        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
        
        # RAG 체인 구성
        self.rag_chain = self._create_rag_chain()
    
    def _setup_vector_store(self) -> VectorStore:
        """OpenSearch 벡터 스토어 설정"""
        try:
            opensearch_url = "http://localhost:9200"
            
            vector_store = OpenSearchVectorSearch(
                opensearch_url=opensearch_url,
                index_name="reviews",
                embedding_function=self.embeddings,
                # OpenSearch 설정
                engine="nmslib",
                space_type="cosinesimil",
                ef_construction=512,
                ef_search=512,
                m=16
            )
            
            logger.info("OpenSearch vector store initialized")
            return vector_store
            
        except Exception as e:
            logger.error(f"Failed to setup vector store: {e}")
            # 임시 더미 벡터 스토어 반환
            return None
    
    def _create_rag_chain(self):
        """RAG 체인 생성"""
        # 프롬프트 템플릿
        rag_prompt = ChatPromptTemplate.from_template("""
당신은 전문적인 상품 추천 어시스턴트입니다. 
주어진 리뷰 정보를 바탕으로 사용자의 질문에 정확하고 도움이 되는 답변을 제공하세요.

컨텍스트 (리뷰 정보):
{context}

사용자 질문: {question}

답변 가이드라인:
1. 리뷰 데이터를 근거로 한 객관적인 정보 제공
2. 상품의 장단점을 균형있게 설명
3. 사용자의 니즈에 맞는 구체적인 추천
4. 리뷰에서 언급된 실제 사용 경험 인용

답변:
""")
        
        # RAG 체인 구성
        if self.vector_store:
            rag_chain = (
                RunnableParallel({
                    "context": self.retriever | self._format_docs,
                    "question": RunnablePassthrough()
                })
                | rag_prompt
                | self.llm
                | StrOutputParser()
            )
        else:
            # 벡터 스토어가 없는 경우 기본 체인
            rag_chain = (
                rag_prompt
                | self.llm
                | StrOutputParser()
            )
        
        return rag_chain
    
    def _format_docs(self, docs: List[Document]) -> str:
        """문서를 문자열로 포맷"""
        if not docs:
            return "관련 리뷰 정보를 찾을 수 없습니다."
        
        formatted = []
        for i, doc in enumerate(docs[:5], 1):
            content = doc.page_content[:500]  # 길이 제한
            metadata = doc.metadata
            
            formatted.append(f"""
리뷰 {i}:
- 상품: {metadata.get('product_name', 'N/A')}
- 평점: {metadata.get('rating', 'N/A')}/5
- 내용: {content}
""")
        
        return "\n".join(formatted)
    
    async def ask_about_product(self, question: str, product_id: Optional[str] = None) -> Dict[str, Any]:
        """상품에 대한 질문-답변 (RAG)"""
        try:
            if product_id:
                # 특정 상품에 대한 질문
                context_filter = {"product_no": product_id}
                question_with_context = f"상품 ID {product_id}에 대한 질문: {question}"
            else:
                # 일반적인 질문
                question_with_context = question
            
            # RAG 체인 실행
            response = await self.rag_chain.ainvoke(question_with_context)
            
            return {
                "question": question,
                "answer": response,
                "method": "langchain_rag",
                "product_id": product_id
            }
            
        except Exception as e:
            logger.error(f"RAG query failed: {e}")
            return {
                "question": question,
                "answer": "죄송합니다. 현재 답변을 생성할 수 없습니다.",
                "method": "langchain_rag",
                "error": str(e)
            }
    
    async def generate_product_summary(self, product_id: str) -> Dict[str, Any]:
        """상품 리뷰 기반 요약 생성"""
        try:
            # 상품 리뷰 검색
            review_service = ReviewHybridSearchService(
                self.db, 
                self.redis_client, 
                self.opensearch_client
            )
            
            reviews = await review_service.search_reviews_hybrid(
                query=f"product_no:{product_id}",
                size=10
            )
            
            if not reviews.get("reviews"):
                return {
                    "product_id": product_id,
                    "summary": "리뷰 정보가 부족하여 요약을 생성할 수 없습니다.",
                    "method": "langchain_summary"
                }
            
            # 요약 프롬프트
            summary_prompt = PromptTemplate.from_template("""
다음 리뷰들을 바탕으로 상품의 종합적인 요약을 작성해주세요:

리뷰 데이터:
{reviews}

요약 형식:
1. 전체적인 평가 (별점 평균과 주요 의견)
2. 주요 장점 (3가지)
3. 주요 단점 (2-3가지)
4. 추천 대상
5. 구매 시 주의사항

요약:
""")
            
            # 리뷰 데이터 포맷
            review_text = "\n".join([
                f"- 평점: {review.get('rating', 'N/A')}/5, 내용: {review.get('review_text', '')[:200]}"
                for review in reviews["reviews"][:10]
            ])
            
            # LLM으로 요약 생성
            summary_chain = summary_prompt | self.llm | StrOutputParser()
            summary = await summary_chain.ainvoke({"reviews": review_text})
            
            return {
                "product_id": product_id,
                "summary": summary,
                "review_count": len(reviews["reviews"]),
                "method": "langchain_summary"
            }
            
        except Exception as e:
            logger.error(f"Product summary generation failed: {e}")
            return {
                "product_id": product_id,
                "summary": "요약 생성 중 오류가 발생했습니다.",
                "error": str(e)
            }
    
    async def recommend_products_by_conversation(self, conversation: str) -> Dict[str, Any]:
        """대화형 상품 추천"""
        try:
            # 추천 프롬프트
            recommendation_prompt = ChatPromptTemplate.from_template("""
사용자와의 대화를 바탕으로 상품을 추천해주세요.

사용자 대화:
{conversation}

관련 상품 정보:
{context}

추천 기준:
1. 사용자의 명시적/암시적 니즈 분석
2. 리뷰 데이터 기반 상품 품질 평가
3. 가격 대비 만족도
4. 사용자 프로필에 적합성

추천 형식:
1. 1순위 추천 상품 (이유 포함)
2. 2순위 추천 상품 (이유 포함)
3. 대안 상품 (예산/니즈에 따른)

추천:
""")
            
            # 관련 상품 검색 (대화에서 키워드 추출 후 검색)
            search_keywords = self._extract_keywords_from_conversation(conversation)
            context_docs = []
            
            if search_keywords and self.vector_store:
                context_docs = await self.retriever.ainvoke(search_keywords)
            
            context = self._format_docs(context_docs)
            
            # 추천 체인 실행
            recommendation_chain = recommendation_prompt | self.llm | StrOutputParser()
            recommendation = await recommendation_chain.ainvoke({
                "conversation": conversation,
                "context": context
            })
            
            return {
                "conversation": conversation,
                "recommendation": recommendation,
                "context_products": len(context_docs),
                "method": "langchain_conversation"
            }
            
        except Exception as e:
            logger.error(f"Conversational recommendation failed: {e}")
            return {
                "conversation": conversation,
                "recommendation": "추천 생성 중 오류가 발생했습니다.",
                "error": str(e)
            }
    
    def _extract_keywords_from_conversation(self, conversation: str) -> str:
        """대화에서 검색 키워드 추출 (간단한 구현)"""
        # 실제로는 더 정교한 NLP 처리 필요
        keywords = []
        
        # 기본적인 상품 관련 키워드 매칭
        product_keywords = [
            "노트북", "컴퓨터", "모니터", "키보드", "마우스",
            "헤드폰", "이어폰", "스피커", "의자", "책상",
            "가방", "지갑", "신발", "옷", "화장품"
        ]
        
        for keyword in product_keywords:
            if keyword in conversation:
                keywords.append(keyword)
        
        return " ".join(keywords) if keywords else "추천 상품"


class LangChainAgentService:
    """LangChain 에이전트 서비스"""
    
    def __init__(self, rag_service: LangChainRAGService):
        self.rag_service = rag_service
        self.llm = rag_service.llm
    
    async def smart_search_agent(self, user_input: str) -> Dict[str, Any]:
        """지능형 검색 에이전트"""
        try:
            # 에이전트 프롬프트
            agent_prompt = ChatPromptTemplate.from_template("""
당신은 전문적인 상품 검색 어시스턴트입니다.
사용자의 입력을 분석하여 최적의 검색 전략을 결정하고 실행하세요.

사용자 입력: {user_input}

가능한 액션:
1. keyword_search: 키워드 기반 검색
2. review_search: 리뷰 기반 검색  
3. recommendation: 개인화 추천
4. comparison: 상품 비교
5. question_answer: 질문 답변

분석 결과:
- 사용자 의도:
- 추천 액션:
- 검색 쿼리:
- 예상 결과:
""")
            
            # 에이전트 실행
            agent_response = await (agent_prompt | self.llm | StrOutputParser()).ainvoke({
                "user_input": user_input
            })
            
            return {
                "user_input": user_input,
                "agent_analysis": agent_response,
                "method": "langchain_agent"
            }
            
        except Exception as e:
            logger.error(f"Agent execution failed: {e}")
            return {
                "user_input": user_input,
                "agent_analysis": "에이전트 분석 중 오류가 발생했습니다.",
                "error": str(e)
            } 