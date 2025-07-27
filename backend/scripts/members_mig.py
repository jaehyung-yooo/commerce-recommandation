#!/usr/bin/env python3
"""
회원 데이터 마이그레이션 스크립트
- 크롤링된 리뷰 데이터에서 회원 정보 추출
- members.csv와 member_statistics.csv 생성
"""

import pandas as pd
import re
from pathlib import Path
import logging
from datetime import datetime
import hashlib

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MembersMigration:
    def __init__(self):
        self.members = {}  # reviewer_id -> member_data
        self.member_data = []
        self.member_statistics = []
        
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
    
    def generate_member_id(self, reviewer_id):
        """reviewer_id를 기반으로 고유한 member_id 생성"""
        if not reviewer_id:
            return None
        # 해시를 사용해서 고유하면서도 일관된 member_id 생성
        hash_object = hashlib.md5(reviewer_id.encode())
        return f"member_{hash_object.hexdigest()[:12]}"
    
    def is_valid_reviewer_id(self, reviewer_id):
        """유효한 reviewer_id인지 확인"""
        if pd.isna(reviewer_id) or not reviewer_id:
            return False
        
        reviewer_id = str(reviewer_id).strip()
        
        # 빈 문자열이거나 너무 짧은 경우
        if len(reviewer_id) < 3:
            return False
        
        # 이메일 형태인지 확인 (부분적으로 마스킹된 이메일 포함)
        email_pattern = r'^[a-zA-Z0-9*_.-]+@[a-zA-Z0-9*.-]+\.[a-zA-Z*]{2,}$'
        if re.match(email_pattern, reviewer_id):
            return True
        
        # 일반적인 ID 형태인지 확인 (마스킹된 ID 포함)
        id_pattern = r'^[a-zA-Z0-9*_.-]{3,}$'
        if re.match(id_pattern, reviewer_id):
            return True
        
        return False
    
    def extract_reviewer_name(self, reviewer_id):
        """reviewer_id에서 이름 부분 추출 (가능한 경우)"""
        if not reviewer_id:
            return "회원"
        
        reviewer_id = str(reviewer_id).strip()
        
        # 이메일인 경우 @ 앞부분을 이름으로 사용
        if '@' in reviewer_id:
            name_part = reviewer_id.split('@')[0]
            # *로 마스킹된 부분이 있으면 처리
            if '*' in name_part:
                # 앞 3글자 정도만 사용
                clean_name = re.sub(r'\*+', '', name_part)[:3]
                return f"{clean_name}***" if clean_name else "회원"
            return name_part[:10]  # 최대 10글자
        
        # 일반 ID인 경우
        if '*' in reviewer_id:
            clean_name = re.sub(r'\*+', '', reviewer_id)[:3]
            return f"{clean_name}***" if clean_name else "회원"
        
        return reviewer_id[:10]  # 최대 10글자
    
    def analyze_review_data(self, df):
        """리뷰 데이터 분석"""
        logger.info("🔍 리뷰 데이터 분석")
        
        total_reviews = len(df)
        logger.info(f"📊 총 리뷰 수: {total_reviews:,}개")
        
        # 컬럼 확인
        logger.info(f"📋 컬럼: {list(df.columns)}")
        
        # reviewer_id 컬럼 존재 확인
        if 'reviewer_id' not in df.columns:
            logger.error("❌ reviewer_id 컬럼이 없습니다!")
            return False
        
        # 유효한 reviewer_id 확인
        valid_reviewer_ids = df['reviewer_id'].apply(self.is_valid_reviewer_id)
        valid_count = valid_reviewer_ids.sum()
        
        logger.info(f"🎯 유효한 reviewer_id: {valid_count:,}개 ({valid_count/total_reviews*100:.1f}%)")
        
        # 고유한 reviewer_id 수
        unique_reviewers = df[valid_reviewer_ids]['reviewer_id'].nunique()
        logger.info(f"👥 고유 리뷰어: {unique_reviewers:,}명")
        
        # 샘플 reviewer_id 표시
        sample_reviewers = df[valid_reviewer_ids]['reviewer_id'].head(10).tolist()
        logger.info("📋 reviewer_id 샘플:")
        for reviewer in sample_reviewers:
            logger.info(f"   {reviewer}")
        
        return True
    
    def process_members(self, df):
        """회원 데이터 처리"""
        logger.info("👥 회원 데이터 처리 시작")
        
        if 'reviewer_id' not in df.columns:
            logger.error("❌ reviewer_id 컬럼이 없습니다!")
            return
        
        # 유효한 reviewer_id만 필터링
        valid_mask = df['reviewer_id'].apply(self.is_valid_reviewer_id)
        valid_df = df[valid_mask].copy()
        
        logger.info(f"📊 유효한 리뷰 데이터: {len(valid_df):,}개")
        
        # 고유한 reviewer_id별로 그룹화
        reviewer_groups = valid_df.groupby('reviewer_id')
        
        member_no = 1
        for reviewer_id, group in reviewer_groups:
            try:
                # 기본 정보 (reviewer_id를 그대로 member_id로 사용)
                member_id = reviewer_id
                
                # 첫 번째 리뷰와 마지막 리뷰 날짜
                review_dates = group['review_date'].dropna()
                first_review = None
                last_review = None
                
                if len(review_dates) > 0:
                    # 날짜 형식 정리 (예: "2025.07.20" -> "2025-07-20")
                    try:
                        date_strs = review_dates.apply(lambda x: str(x).replace('.', '-') if pd.notna(x) else None).dropna()
                        if len(date_strs) > 0:
                            first_review = min(date_strs)
                            last_review = max(date_strs)
                    except Exception as e:
                        logger.warning(f"⚠️ 날짜 파싱 오류 ({reviewer_id}): {e}")
                
                # 통계 계산
                total_reviews = len(group)
                ratings = group['rating'].dropna()
                avg_rating = ratings.mean() if len(ratings) > 0 else None
                
                # 가장 많이 리뷰한 브랜드
                brand_counts = group['brand'].value_counts()
                most_reviewed_brand = brand_counts.index[0] if len(brand_counts) > 0 else None
                
                # 회원 기본 정보 (간단하게)
                member_data = {
                    'member_no': member_no,
                    'member_id': member_id
                }
                
                # 회원 통계 정보
                statistics_data = {
                    'member_no': member_no,
                    'total_reviews': total_reviews,
                    'average_rating': round(avg_rating, 2) if avg_rating else None,
                    'first_review_date': first_review,
                    'last_review_date': last_review,
                    'most_reviewed_category_id': None,  # 카테고리 정보가 없으므로 null
                    'most_reviewed_category_name': most_reviewed_brand,  # 브랜드를 대신 사용
                    'preferred_price_range': self.determine_price_range(group)
                }
                
                self.member_data.append(member_data)
                self.member_statistics.append(statistics_data)
                
                member_no += 1
                
            except Exception as e:
                logger.warning(f"⚠️ 회원 처리 오류 ({reviewer_id}): {e}")
                continue
        
        logger.info(f"✅ 회원 처리 완료: {len(self.member_data):,}명")
    
    def determine_price_range(self, group):
        """리뷰 그룹에서 선호 가격대 결정 (제품 데이터가 있다면)"""
        # 현재는 제품 가격 정보가 없으므로 리뷰 수를 기반으로 간단하게 분류
        review_count = len(group)
        if review_count >= 10:
            return 'high'  # 많은 리뷰를 남긴 활성 사용자
        elif review_count >= 5:
            return 'medium'
        else:
            return 'low'
    
    def save_csv_files(self, output_dir="../../data/mysql_ready"):
        """CSV 파일 저장"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Members CSV
        if self.member_data:
            df_members = pd.DataFrame(self.member_data)
            members_file = output_path / 'members.csv'
            df_members.to_csv(members_file, index=False, encoding='utf-8-sig')
            logger.info(f"✅ {members_file} 저장 완료: {len(self.member_data):,}명")
        
        # Member Statistics CSV
        if self.member_statistics:
            df_statistics = pd.DataFrame(self.member_statistics)
            statistics_file = output_path / 'member_statistics.csv'
            df_statistics.to_csv(statistics_file, index=False, encoding='utf-8-sig')
            logger.info(f"✅ {statistics_file} 저장 완료: {len(self.member_statistics):,}명")
        
        logger.info(f"📁 출력 디렉토리: {output_path.resolve()}")
    
    def run(self, input_file=None):
        """전체 프로세스 실행"""
        logger.info("🚀 회원 마이그레이션 시작")
        
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
        
        self.process_members(df)
        
        # CSV 저장
        self.save_csv_files()
        
        # 요약 정보
        logger.info("=" * 60)
        logger.info("📋 회원 마이그레이션 요약")
        logger.info(f"📊 원본 리뷰 데이터: {len(df):,}행")
        logger.info(f"👥 생성된 회원: {len(self.member_data):,}명")
        logger.info(f"📈 생성된 통계: {len(self.member_statistics):,}건")
        
        # 리뷰 활동 통계
        if self.member_statistics:
            review_counts = [stat['total_reviews'] for stat in self.member_statistics]
            avg_reviews = sum(review_counts) / len(review_counts)
            max_reviews = max(review_counts)
            min_reviews = min(review_counts)
            
            logger.info(f"📊 리뷰 통계:")
            logger.info(f"   평균 리뷰 수: {avg_reviews:.1f}개")
            logger.info(f"   최대 리뷰 수: {max_reviews}개")
            logger.info(f"   최소 리뷰 수: {min_reviews}개")
            
            # 평점 통계
            ratings = [stat['average_rating'] for stat in self.member_statistics if stat['average_rating']]
            if ratings:
                avg_rating = sum(ratings) / len(ratings)
                logger.info(f"⭐ 평균 평점: {avg_rating:.2f}점")
            
            # 가격대 분포
            price_ranges = [stat['preferred_price_range'] for stat in self.member_statistics]
            price_dist = pd.Series(price_ranges).value_counts()
            logger.info(f"💰 선호 가격대 분포:")
            for price_range, count in price_dist.items():
                logger.info(f"   {price_range}: {count:,}명 ({count/len(price_ranges)*100:.1f}%)")
        
        # 샘플 데이터 출력
        logger.info("📋 생성된 회원 샘플:")
        for member in self.member_data[:5]:
            logger.info(f"   [{member['member_no']}] {member['member_id']}")
        
        logger.info("=" * 60)
        logger.info("🎉 회원 마이그레이션 완료!")
        return True

def main():
    migration = MembersMigration()
    success = migration.run()
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 