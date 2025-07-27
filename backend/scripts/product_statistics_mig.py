#!/usr/bin/env python3
"""
상품 통계 마이그레이션 스크립트
- 리뷰 데이터에서 상품별 통계 집계
- product_statistics.csv 생성
"""

import pandas as pd
import json
from pathlib import Path
import logging
from datetime import datetime, timedelta
from collections import defaultdict

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProductStatisticsMigration:
    def __init__(self):
        self.product_statistics = []
        self.products_info = {}  # product_no -> product info
        
    def load_products_info(self, products_file="../../data/mysql_ready/products.csv"):
        """상품 정보 로드"""
        logger.info("📦 상품 정보 로드")
        
        try:
            df_products = pd.read_csv(products_file)
            
            for _, row in df_products.iterrows():
                product_no = row['product_no']
                self.products_info[product_no] = {
                    'product_id': row.get('product_id'),
                    'product_name': row.get('product_name'),
                    'brand': row.get('brand')
                }
            
            logger.info(f"✅ 상품 정보 로드 완료: {len(self.products_info):,}개")
            return True
            
        except Exception as e:
            logger.error(f"❌ 상품 정보 로드 실패: {e}")
            return False
    
    def calculate_review_velocity(self, reviews_group):
        """월평균 리뷰 수 계산"""
        try:
            review_dates = pd.to_datetime(reviews_group['review_date'])
            if len(review_dates) < 2:
                return 0.0
            
            first_date = review_dates.min()
            last_date = review_dates.max()
            
            # 기간 계산 (월 단위)
            date_diff = last_date - first_date
            months = max(1, date_diff.days / 30.44)  # 평균 월 일수
            
            # 월평균 리뷰 수
            velocity = len(reviews_group) / months
            return round(velocity, 2)
            
        except Exception as e:
            logger.warning(f"⚠️ 리뷰 속도 계산 오류: {e}")
            return 0.0
    
    def analyze_reviews_data(self, df):
        """리뷰 데이터 분석"""
        logger.info("🔍 리뷰 데이터 분석")
        
        total_reviews = len(df)
        logger.info(f"📊 총 리뷰 수: {total_reviews:,}개")
        
        # 필수 컬럼 확인
        required_cols = ['product_no', 'rating', 'review_date']
        missing_cols = [col for col in required_cols if col not in df.columns]
        
        if missing_cols:
            logger.error(f"❌ 필수 컬럼 누락: {missing_cols}")
            return False
        
        # 유효한 데이터 확인
        valid_product_no = df['product_no'].notna().sum()
        valid_rating = df['rating'].between(1, 5).sum()
        valid_date = df['review_date'].notna().sum()
        
        logger.info(f"🎯 유효한 product_no: {valid_product_no:,}개 ({valid_product_no/total_reviews*100:.1f}%)")
        logger.info(f"🎯 유효한 rating: {valid_rating:,}개 ({valid_rating/total_reviews*100:.1f}%)")
        logger.info(f"🎯 유효한 review_date: {valid_date:,}개 ({valid_date/total_reviews*100:.1f}%)")
        
        # 고유 상품 수
        unique_products = df['product_no'].nunique()
        logger.info(f"🛍️ 리뷰가 있는 상품: {unique_products:,}개")
        
        return True
    
    def process_product_statistics(self, df):
        """상품별 통계 처리"""
        logger.info("📊 상품별 통계 처리 시작")
        
        # 유효한 데이터만 필터링
        df_valid = df.dropna(subset=['product_no', 'rating', 'review_date']).copy()
        df_valid = df_valid[df_valid['rating'].between(1, 5)]
        
        logger.info(f"📊 유효한 리뷰 데이터: {len(df_valid):,}개")
        
        # 상품별로 그룹화
        product_groups = df_valid.groupby('product_no')
        
        processed_count = 0
        skipped_count = 0
        
        for product_no, group in product_groups:
            try:
                # 기본 통계
                total_reviews = len(group)
                average_rating = group['rating'].mean()
                
                # 평점 분포 계산 (JSON 형태)
                rating_counts = group['rating'].value_counts()
                rating_distribution = {}
                for rating in range(1, 6):
                    rating_distribution[str(rating)] = int(rating_counts.get(rating, 0))
                
                # 날짜 정보
                review_dates = pd.to_datetime(group['review_date'])
                last_review_date = review_dates.max().strftime('%Y-%m-%d')
                
                # 월평균 리뷰 수
                review_velocity = self.calculate_review_velocity(group)
                
                # 상품 통계 데이터 생성
                product_stat = {
                    'product_no': int(product_no),
                    'total_reviews': total_reviews,
                    'average_rating': round(average_rating, 2),
                    'rating_distribution': json.dumps(rating_distribution),
                    'last_review_date': last_review_date,
                    'review_velocity': review_velocity
                }
                
                self.product_statistics.append(product_stat)
                processed_count += 1
                
                # 진행상황 표시
                if processed_count % 100 == 0:
                    logger.info(f"   처리 진행: {processed_count:,}개 상품 완료...")
                
            except Exception as e:
                logger.warning(f"⚠️ 상품 통계 처리 오류 (product_no: {product_no}): {e}")
                skipped_count += 1
                continue
        
        logger.info(f"✅ 상품 통계 처리 완료: {processed_count:,}개 처리, {skipped_count:,}개 스킵")
        
        # 처리 성공률
        total_products = len(product_groups)
        success_rate = (processed_count / total_products) * 100 if total_products > 0 else 0
        logger.info(f"📊 처리 성공률: {success_rate:.1f}% ({processed_count}/{total_products})")
    
    def save_csv_file(self, output_dir="../../data/mysql_ready"):
        """CSV 파일 저장"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Product Statistics CSV
        if self.product_statistics:
            df_stats = pd.DataFrame(self.product_statistics)
            stats_file = output_path / 'product_statistics.csv'
            df_stats.to_csv(stats_file, index=False, encoding='utf-8-sig')
            logger.info(f"✅ {stats_file} 저장 완료: {len(self.product_statistics):,}개")
        
        logger.info(f"📁 출력 디렉토리: {output_path.resolve()}")
    
    def run(self, reviews_file=None):
        """전체 프로세스 실행"""
        logger.info("🚀 상품 통계 마이그레이션 시작")
        
        # 입력 파일 찾기
        if not reviews_file:
            reviews_file = "../../data/mysql_ready/reviews.csv"
            
            if not Path(reviews_file).exists():
                logger.error(f"❌ 리뷰 데이터 파일을 찾을 수 없습니다: {reviews_file}")
                return False
        
        # 상품 정보 로드
        if not self.load_products_info():
            return False
        
        # 리뷰 데이터 로드
        logger.info(f"📁 리뷰 데이터 로드: {reviews_file}")
        try:
            df = pd.read_csv(reviews_file)
            logger.info(f"📊 로드된 데이터: {len(df):,}행 x {len(df.columns):,}열")
        except Exception as e:
            logger.error(f"❌ 파일 로드 실패: {e}")
            return False
        
        # 데이터 분석 및 처리
        if not self.analyze_reviews_data(df):
            return False
        
        self.process_product_statistics(df)
        
        # CSV 저장
        self.save_csv_file()
        
        # 요약 정보
        logger.info("=" * 60)
        logger.info("📋 상품 통계 마이그레이션 요약")
        logger.info(f"📊 원본 리뷰 데이터: {len(df):,}행")
        logger.info(f"📈 생성된 상품 통계: {len(self.product_statistics):,}개")
        
        # 통계 정보
        if self.product_statistics:
            # 리뷰 수 통계
            review_counts = [stat['total_reviews'] for stat in self.product_statistics]
            avg_reviews = sum(review_counts) / len(review_counts)
            max_reviews = max(review_counts)
            min_reviews = min(review_counts)
            
            logger.info(f"📊 상품별 리뷰 수 통계:")
            logger.info(f"   평균 리뷰 수: {avg_reviews:.1f}개")
            logger.info(f"   최대 리뷰 수: {max_reviews}개")
            logger.info(f"   최소 리뷰 수: {min_reviews}개")
            
            # 평점 통계
            ratings = [stat['average_rating'] for stat in self.product_statistics]
            avg_rating = sum(ratings) / len(ratings)
            max_rating = max(ratings)
            min_rating = min(ratings)
            
            logger.info(f"⭐ 상품별 평점 통계:")
            logger.info(f"   전체 평균 평점: {avg_rating:.2f}점")
            logger.info(f"   최고 평점: {max_rating:.2f}점")
            logger.info(f"   최저 평점: {min_rating:.2f}점")
            
            # 리뷰 속도 통계
            velocities = [stat['review_velocity'] for stat in self.product_statistics if stat['review_velocity'] > 0]
            if velocities:
                avg_velocity = sum(velocities) / len(velocities)
                max_velocity = max(velocities)
                logger.info(f"🚀 리뷰 속도 통계:")
                logger.info(f"   평균 월 리뷰 수: {avg_velocity:.1f}개")
                logger.info(f"   최대 월 리뷰 수: {max_velocity:.1f}개")
            
            # 평점 분포 샘플 출력
            logger.info("📊 평점 분포 샘플 (상위 3개 상품):")
            top_products = sorted(self.product_statistics, key=lambda x: x['total_reviews'], reverse=True)[:3]
            for i, product in enumerate(top_products, 1):
                rating_dist = json.loads(product['rating_distribution'])
                dist_str = ", ".join([f"{k}점:{v}개" for k, v in rating_dist.items() if v > 0])
                logger.info(f"   {i}. 상품 {product['product_no']} ({product['total_reviews']}개 리뷰): {dist_str}")
        
        logger.info("=" * 60)
        logger.info("🎉 상품 통계 마이그레이션 완료!")
        return True

def main():
    migration = ProductStatisticsMigration()
    success = migration.run()
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 