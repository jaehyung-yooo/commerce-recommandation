#!/usr/bin/env python3
"""
주문 데이터 마이그레이션 스크립트
- 리뷰 데이터를 기반으로 주문 정보 추론
- orders.csv와 order_items.csv 생성
"""

import pandas as pd
import re
from pathlib import Path
import logging
from datetime import datetime
from collections import defaultdict
import random

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class OrdersMigration:
    def __init__(self):
        self.order_data = []
        self.product_prices = {}  # product_no -> price
        self.member_mapping = {}  # member_id -> member_no
        self.product_mapping = {}  # product_id -> product_no
        
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
    
    def load_product_prices(self, products_file="../../data/mysql_ready/products.csv"):
        """상품 가격 정보 로드"""
        logger.info("💰 상품 가격 정보 로드")
        
        try:
            df_products = pd.read_csv(products_file)
            
            for _, row in df_products.iterrows():
                product_no = row['product_no']
                product_id = row['product_id']
                price = row.get('price', 0)
                
                # product_no별 가격 저장 (소수점 제거)
                if pd.notna(price) and price > 0:
                    self.product_prices[product_no] = int(price)
                else:
                    # 가격이 없으면 기본값 설정 (브랜드별로 차등, 소수점 제거)
                    brand = row.get('brand', 'UNKNOWN')
                    if 'BEANPOLE' in str(brand).upper():
                        self.product_prices[product_no] = random.randint(80000, 300000)
                    elif '8SECONDS' in str(brand).upper():
                        self.product_prices[product_no] = random.randint(30000, 150000)
                    else:
                        self.product_prices[product_no] = random.randint(50000, 200000)
                
                # product_id -> product_no 매핑도 저장
                if pd.notna(product_id):
                    self.product_mapping[product_id] = product_no
            
            logger.info(f"✅ 상품 가격 정보 로드 완료: {len(self.product_prices):,}개")
            
        except Exception as e:
            logger.error(f"❌ 상품 가격 정보 로드 실패: {e}")
            return False
        
        return True
    
    def load_member_mapping(self, members_file="../../data/mysql_ready/members.csv"):
        """회원 매핑 로드"""
        logger.info("👥 회원 매핑 로드")
        
        try:
            df_members = pd.read_csv(members_file)
            
            for _, row in df_members.iterrows():
                member_id = row['member_id']  # reviewer_id
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
        
        # 필수 컬럼 확인
        required_cols = ['product_no', 'reviewer_id', 'review_date']
        missing_cols = [col for col in required_cols if col not in df.columns]
        
        if missing_cols:
            logger.error(f"❌ 필수 컬럼 누락: {missing_cols}")
            return False
        
        # 데이터 품질 확인
        valid_product_no = df['product_no'].notna().sum()
        valid_reviewer_id = df['reviewer_id'].notna().sum()
        valid_review_date = df['review_date'].notna().sum()
        
        logger.info(f"🎯 유효한 product_no: {valid_product_no:,}개 ({valid_product_no/total_reviews*100:.1f}%)")
        logger.info(f"🎯 유효한 reviewer_id: {valid_reviewer_id:,}개 ({valid_reviewer_id/total_reviews*100:.1f}%)")
        logger.info(f"🎯 유효한 review_date: {valid_review_date:,}개 ({valid_review_date/total_reviews*100:.1f}%)")
        
        # 간소화된 구조: 1개 리뷰 = 1개 주문
        df_valid = df.dropna(subset=['reviewer_id', 'review_date'])
        estimated_orders = len(df_valid)
        
        logger.info(f"📦 생성될 주문 수: {estimated_orders:,}개 (1개 리뷰 = 1개 주문)")
        
        return True
    
    def process_orders(self, df):
        """주문 데이터 처리 (간소화: 1개 리뷰 = 1개 주문)"""
        logger.info("📦 주문 데이터 처리 시작")
        
        # 유효한 데이터만 필터링
        df_valid = df.dropna(subset=['product_no', 'reviewer_id', 'review_date']).copy()
        
        # 날짜 파싱
        df_valid['parsed_date'] = df_valid['review_date'].apply(self.parse_date)
        df_valid = df_valid.dropna(subset=['parsed_date'])
        
        logger.info(f"📊 유효한 리뷰 데이터: {len(df_valid):,}개")
        
        order_id = 1
        processed_orders = 0
        skipped_orders = 0
        
        for idx, row in df_valid.iterrows():
            try:
                reviewer_id = row['reviewer_id']
                order_date = row['parsed_date']
                product_no_or_id = row['product_no']
                
                # 회원 매핑 확인
                if reviewer_id not in self.member_mapping:
                    skipped_orders += 1
                    continue
                
                member_no = self.member_mapping[reviewer_id]
                
                # product_id -> product_no 변환
                if product_no_or_id in self.product_mapping:
                    product_no = self.product_mapping[product_no_or_id]
                else:
                    # 직접 product_no인 경우 (숫자)
                    try:
                        product_no = int(product_no_or_id)
                    except:
                        skipped_orders += 1
                        continue
                
                # 상품 가격 확인
                if product_no not in self.product_prices:
                    skipped_orders += 1
                    continue
                
                total_amount = self.product_prices[product_no]
                
                # 주문 데이터 생성 (간소화, 소수점 제거)
                order_data = {
                    'order_id': order_id,
                    'member_no': member_no,
                    'product_no': product_no,  # 여기에 직접 상품 번호 추가!
                    'order_date': order_date,
                    'total_amount': int(total_amount),  # 소수점 제거
                    'order_status': 'delivered'  # 리뷰가 있으므로 배송 완료로 가정
                }
                
                self.order_data.append(order_data)
                processed_orders += 1
                order_id += 1
                
                # 진행상황 표시
                if processed_orders % 10000 == 0:
                    logger.info(f"   처리 진행: {processed_orders:,}개 주문 완료...")
                
            except Exception as e:
                logger.warning(f"⚠️ 주문 처리 오류 (행 {idx}): {e}")
                skipped_orders += 1
                continue
        
        logger.info(f"✅ 주문 처리 완료: {processed_orders:,}개 주문")
        logger.info(f"⚠️ 스킵된 주문: {skipped_orders:,}개")
        
        # 성공률 계산
        total_input = len(df_valid)
        success_rate = (processed_orders / total_input) * 100 if total_input > 0 else 0
        logger.info(f"📊 처리 성공률: {success_rate:.1f}% ({processed_orders}/{total_input})")
    
    def save_csv_files(self, output_dir="../../data/mysql_ready"):
        """CSV 파일 저장"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Orders CSV (간소화된 구조)
        if self.order_data:
            df_orders = pd.DataFrame(self.order_data)
            orders_file = output_path / 'orders.csv'
            df_orders.to_csv(orders_file, index=False, encoding='utf-8-sig')
            logger.info(f"✅ {orders_file} 저장 완료: {len(self.order_data):,}개")
        
        logger.info(f"📁 출력 디렉토리: {output_path.resolve()}")
    
    def run(self, input_file=None):
        """전체 프로세스 실행"""
        logger.info("🚀 주문 마이그레이션 시작")
        
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
        if not self.load_product_prices():
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
        
        self.process_orders(df)
        
        # CSV 저장
        self.save_csv_files()
        
        # 요약 정보
        logger.info("=" * 60)
        logger.info("📋 주문 마이그레이션 요약 (간소화된 구조)")
        logger.info(f"📊 원본 리뷰 데이터: {len(df):,}행")
        logger.info(f"📦 생성된 주문: {len(self.order_data):,}개")
        logger.info(f"📝 구조: 1개 리뷰 = 1개 주문 (product_no 직접 포함)")
        
        # 통계 정보
        if self.order_data:
            order_amounts = [order['total_amount'] for order in self.order_data]
            avg_amount = sum(order_amounts) / len(order_amounts)
            max_amount = max(order_amounts)
            min_amount = min(order_amounts)
            
            logger.info(f"💰 주문 금액 통계:")
            logger.info(f"   평균 주문 금액: {avg_amount:,.0f}원")
            logger.info(f"   최대 주문 금액: {max_amount:,.0f}원")
            logger.info(f"   최소 주문 금액: {min_amount:,.0f}원")
            
            # 주문 날짜 분포
            order_dates = [order['order_date'] for order in self.order_data]
            earliest_date = min(order_dates)
            latest_date = max(order_dates)
            logger.info(f"📅 주문 기간: {earliest_date} ~ {latest_date}")
            
            # 고유 상품 수
            unique_products = set(order['product_no'] for order in self.order_data)
            logger.info(f"🛍️ 주문된 고유 상품: {len(unique_products):,}개")
            
            # 고유 회원 수
            unique_members = set(order['member_no'] for order in self.order_data)
            logger.info(f"👥 주문한 고유 회원: {len(unique_members):,}명")
        
        logger.info("=" * 60)
        logger.info("🎉 주문 마이그레이션 완료!")
        return True

def main():
    migration = OrdersMigration()
    success = migration.run()
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 