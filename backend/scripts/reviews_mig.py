#!/usr/bin/env python3
"""
리뷰 데이터 마이그레이션 스크립트
- 크롤링된 리뷰 데이터를 MySQL 스키마에 맞게 변환
- reviews.csv 생성
"""

import pandas as pd
import re
from pathlib import Path
import logging
from datetime import datetime

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ReviewsMigration:
    def __init__(self):
        self.review_data = []
        self.product_mapping = {}  # product_no -> product_no (확인용)
        self.member_mapping = {}   # reviewer_id -> member_no
        
    def clean_text(self, text):
        """텍스트 정리"""
        if pd.isna(text) or text is None:
            return ""
        text = str(text).strip()
        # HTML 태그 제거
        text = re.sub(r'<[^>]+>', '', text)
        # 연속 공백 제거
        text = re.sub(r'\s+', ' ', text)
        return text.strip()
    
    def parse_date(self, date_str):
        """날짜 파싱 (2025.07.20 -> 2025-07-20)"""
        if pd.isna(date_str) or not date_str:
            return None
        
        try:
            # 점으로 구분된 날짜 형식 처리
            date_str = str(date_str).strip()
            if '.' in date_str:
                date_str = date_str.replace('.', '-')
            
            # 날짜 유효성 검사
            datetime.strptime(date_str, '%Y-%m-%d')
            return date_str
        except:
            logger.warning(f"⚠️ 날짜 파싱 실패: {date_str}")
            return None
    
    def load_product_mapping(self, products_file="../../data/mysql_ready/products.csv"):
        """상품 매핑 로드"""
        logger.info("📦 상품 매핑 로드")
        
        try:
            df_products = pd.read_csv(products_file)
            
            # product_id -> product_no 매핑 생성 (크롤링 데이터의 product_no는 실제로는 product_id)
            for _, row in df_products.iterrows():
                product_id = row['product_id']  # 크롤링 데이터와 매칭되는 ID
                product_no = row['product_no']  # MySQL의 순차 번호
                
                if pd.notna(product_id):
                    self.product_mapping[product_id] = product_no
            
            logger.info(f"✅ 상품 매핑 로드 완료: {len(self.product_mapping):,}개")
            
        except Exception as e:
            logger.error(f"❌ 상품 매핑 로드 실패: {e}")
            return False
        
        return True
    
    def load_member_mapping(self, members_file="../../data/mysql_ready/members.csv"):
        """회원 매핑 로드"""
        logger.info("👥 회원 매핑 로드")
        
        try:
            df_members = pd.read_csv(members_file)
            
            # reviewer_id(member_id) -> member_no 매핑 생성
            for _, row in df_members.iterrows():
                member_id = row['member_id']  # 이게 reviewer_id
                member_no = row['member_no']
                self.member_mapping[member_id] = member_no
            
            logger.info(f"✅ 회원 매핑 로드 완료: {len(self.member_mapping):,}개")
            
        except Exception as e:
            logger.error(f"❌ 회원 매핑 로드 실패: {e}")
            return False
        
        return True
    
    def analyze_review_data(self, df):
        """리뷰 데이터 분석"""
        logger.info("🔍 리뷰 데이터 분석")
        
        total_reviews = len(df)
        logger.info(f"📊 총 리뷰 수: {total_reviews:,}개")
        
        # 컬럼 확인
        logger.info(f"📋 컬럼: {list(df.columns)}")
        
        # 필수 컬럼 확인
        required_cols = ['product_no', 'reviewer_id', 'rating', 'review_content', 'review_date']
        missing_cols = [col for col in required_cols if col not in df.columns]
        
        if missing_cols:
            logger.error(f"❌ 필수 컬럼 누락: {missing_cols}")
            return False
        
        # 데이터 품질 확인
        valid_product_no = df['product_no'].notna().sum()
        valid_reviewer_id = df['reviewer_id'].notna().sum()
        valid_rating = df['rating'].between(1, 5).sum()
        
        logger.info(f"🎯 유효한 product_no: {valid_product_no:,}개 ({valid_product_no/total_reviews*100:.1f}%)")
        logger.info(f"🎯 유효한 reviewer_id: {valid_reviewer_id:,}개 ({valid_reviewer_id/total_reviews*100:.1f}%)")
        logger.info(f"🎯 유효한 rating: {valid_rating:,}개 ({valid_rating/total_reviews*100:.1f}%)")
        
        # 평점 분포
        rating_dist = df['rating'].value_counts().sort_index()
        logger.info("⭐ 평점 분포:")
        for rating, count in rating_dist.items():
            logger.info(f"   {rating}점: {count:,}개 ({count/total_reviews*100:.1f}%)")
        
        return True
    
    def process_reviews(self, df):
        """리뷰 데이터 처리"""
        logger.info("📝 리뷰 데이터 처리 시작")
        
        processed_count = 0
        skipped_count = 0
        
        for idx, row in df.iterrows():
            try:
                # 필수 데이터 확인
                product_no = row.get('product_no')
                reviewer_id = row.get('reviewer_id')
                rating = row.get('rating')
                
                # 유효성 검사
                if pd.isna(product_no) or pd.isna(reviewer_id) or pd.isna(rating):
                    skipped_count += 1
                    continue
                
                # 상품 매핑 확인
                if product_no not in self.product_mapping:
                    skipped_count += 1
                    continue
                
                # 회원 매핑 확인
                if reviewer_id not in self.member_mapping:
                    skipped_count += 1
                    continue
                
                # 평점 유효성 확인
                if not (1 <= rating <= 5):
                    skipped_count += 1
                    continue
                
                # 매핑된 번호 가져오기
                mapped_product_no = self.product_mapping[product_no]
                mapped_member_no = self.member_mapping[reviewer_id]
                
                # 리뷰 텍스트 정리
                review_text = self.clean_text(row.get('review_content', ''))
                if not review_text:
                    review_text = None  # 빈 리뷰는 NULL로 처리
                
                # 리뷰 날짜 파싱
                review_date = self.parse_date(row.get('review_date'))
                
                # 리뷰 데이터 생성
                review_data = {
                    'product_no': mapped_product_no,
                    'member_no': mapped_member_no,
                    'rating': int(rating),
                    'review_text': review_text,
                    'review_date': review_date,
                    'helpful_count': 0  # 기본값
                }
                
                self.review_data.append(review_data)
                processed_count += 1
                
                # 진행상황 표시
                if processed_count % 10000 == 0:
                    logger.info(f"   처리 진행: {processed_count:,}개 완료...")
                
            except Exception as e:
                logger.warning(f"⚠️ 리뷰 처리 오류 (행 {idx}): {e}")
                skipped_count += 1
                continue
        
        logger.info(f"✅ 리뷰 처리 완료: {processed_count:,}개 처리, {skipped_count:,}개 스킵")
        
        # 매핑 실패 통계
        total_input = len(df)
        success_rate = (processed_count / total_input) * 100 if total_input > 0 else 0
        logger.info(f"📊 처리 성공률: {success_rate:.1f}% ({processed_count}/{total_input})")
        
    def save_csv_files(self, output_dir="../../data/mysql_ready"):
        """CSV 파일 저장"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Reviews CSV
        if self.review_data:
            df_reviews = pd.DataFrame(self.review_data)
            reviews_file = output_path / 'reviews.csv'
            df_reviews.to_csv(reviews_file, index=False, encoding='utf-8-sig')
            logger.info(f"✅ {reviews_file} 저장 완료: {len(self.review_data):,}개")
        
        logger.info(f"📁 출력 디렉토리: {output_path.resolve()}")
    
    def run(self, input_file=None):
        """전체 프로세스 실행"""
        logger.info("🚀 리뷰 마이그레이션 시작")
        
        # 입력 파일 찾기
        if not input_file:
            possible_files = [
                "../../crawler/reviews.csv",
                "reviews.csv"
            ]
            
            for file_path in possible_files:
                if Path(file_path).exists():
                    input_file = file_path
                    break
            
            if not input_file:
                logger.error(f"❌ 리뷰 데이터 파일을 찾을 수 없습니다: {possible_files}")
                return False
        
        # 매핑 데이터 로드
        if not self.load_product_mapping():
            return False
        
        if not self.load_member_mapping():
            return False
        
        # 데이터 로드
        logger.info(f"📁 데이터 로드: {input_file}")
        try:
            df = pd.read_csv(input_file, encoding='utf-8')
            logger.info(f"📊 로드된 데이터: {len(df):,}행 x {len(df.columns):,}열")
        except Exception as e:
            logger.error(f"❌ 파일 로드 실패: {e}")
            return False
        
        # 데이터 분석 및 처리
        if not self.analyze_review_data(df):
            return False
        
        self.process_reviews(df)
        
        # CSV 저장
        self.save_csv_files()
        
        # 요약 정보
        logger.info("=" * 60)
        logger.info("📋 리뷰 마이그레이션 요약")
        logger.info(f"📊 원본 리뷰 데이터: {len(df):,}행")
        logger.info(f"📝 생성된 리뷰: {len(self.review_data):,}개")
        
        # 통계 정보
        if self.review_data:
            ratings = [review['rating'] for review in self.review_data]
            avg_rating = sum(ratings) / len(ratings)
            rating_dist = pd.Series(ratings).value_counts().sort_index()
            
            logger.info(f"⭐ 평균 평점: {avg_rating:.2f}점")
            logger.info("📊 평점 분포:")
            for rating, count in rating_dist.items():
                logger.info(f"   {rating}점: {count:,}개 ({count/len(ratings)*100:.1f}%)")
            
            # 텍스트 리뷰 비율
            text_reviews = sum(1 for review in self.review_data if review['review_text'])
            text_rate = (text_reviews / len(self.review_data)) * 100
            logger.info(f"📝 텍스트 리뷰 비율: {text_rate:.1f}% ({text_reviews:,}/{len(self.review_data):,})")
            
            # 날짜 정보
            dated_reviews = sum(1 for review in self.review_data if review['review_date'])
            date_rate = (dated_reviews / len(self.review_data)) * 100
            logger.info(f"📅 날짜 정보 비율: {date_rate:.1f}% ({dated_reviews:,}/{len(self.review_data):,})")
        
        logger.info("=" * 60)
        logger.info("🎉 리뷰 마이그레이션 완료!")
        return True

def main():
    migration = ReviewsMigration()
    success = migration.run()
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 