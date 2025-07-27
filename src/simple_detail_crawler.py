#!/usr/bin/env python3
"""
간단한 상품 상세정보 크롤러 테스트
"""

import pandas as pd
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("simple_test")

def main():
    """CSV 파일 구조 확인"""
    
    # CSV 파일 읽기
    csv_file = "data/products/products_full_20250721_230745.csv"
    
    try:
        df = pd.read_csv(csv_file)
        
        logger.info(f"✅ CSV 파일 로드 성공: {len(df)}개 행")
        logger.info(f"📋 사용 가능한 컬럼들:")
        for i, col in enumerate(df.columns, 1):
            logger.info(f"  {i}. {col}")
        
        # 필수 컬럼 체크
        required_columns = ['product_url', 'brand', 'product_name']
        logger.info(f"\n🔍 필수 컬럼 체크: {required_columns}")
        
        missing_columns = []
        for col in required_columns:
            if col in df.columns:
                logger.info(f"  ✅ {col} - 존재함")
            else:
                logger.info(f"  ❌ {col} - 누락됨")
                missing_columns.append(col)
        
        if missing_columns:
            logger.error(f"❌ 누락된 컬럼: {missing_columns}")
        else:
            logger.info("🎉 모든 필수 컬럼이 존재합니다!")
            
            # 첫 번째 행의 product_url 샘플 출력
            first_url = df.iloc[0]['product_url']
            logger.info(f"\n📝 첫 번째 상품 URL 샘플:")
            logger.info(f"  {first_url}")
            
            # JavaScript에서 상품 ID 추출 테스트
            import re
            pattern = r"goToProductDetail\('([^']+)','([^']+)'"
            match = re.search(pattern, first_url)
            
            if match:
                brand_id = match.group(1)
                product_id = match.group(2)
                logger.info(f"  🎯 추출된 브랜드 ID: {brand_id}")
                logger.info(f"  🎯 추출된 상품 ID: {product_id}")
            else:
                logger.error("  ❌ 상품 ID 추출 실패")
                
    except Exception as e:
        logger.error(f"❌ 오류 발생: {str(e)}")

if __name__ == "__main__":
    main() 