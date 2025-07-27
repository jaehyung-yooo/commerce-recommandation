#!/usr/bin/env python3
"""
상품 데이터 마이그레이션 스크립트
- 크롤링된 상품 데이터를 MySQL 스키마에 맞게 변환
- categories.csv와 products.csv 생성
"""

import pandas as pd
import re
from pathlib import Path
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class ProductsMigration:
    def __init__(self):
        self.categories = {}  # category_name -> category_id
        self.category_data = []
        self.product_data = []
        
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
    
    def parse_price(self, price_str):
        """가격 파싱"""
        if pd.isna(price_str) or price_str is None:
            return None
        
        # 숫자만 추출
        price_num = re.sub(r'[^\d.]', '', str(price_str))
        try:
            price = float(price_num) if price_num else None
            if price and 0 < price < 999999999:
                return price
            return None
        except ValueError:
            return None
    
    def get_category_hierarchy_info(self, df):
        """카테고리 계층 구조 정보 분석"""
        logger.info("🔍 카테고리 계층 구조 분석")
        
        depth_1 = df['category_1'].dropna().nunique() if 'category_1' in df.columns else 0
        depth_2 = df['category_2'].dropna().nunique() if 'category_2' in df.columns else 0
        depth_3 = df['category_3'].dropna().nunique() if 'category_3' in df.columns else 0
        
        logger.info(f"📊 1단계 카테고리: {depth_1}개")
        logger.info(f"📊 2단계 카테고리: {depth_2}개") 
        logger.info(f"📊 3단계 카테고리: {depth_3}개")
        
        # 코드 정보도 확인
        code_cols = ['category_code_1', 'category_code_2', 'category_code_3']
        available_code_cols = [col for col in code_cols if col in df.columns]
        if available_code_cols:
            logger.info(f"🏷️ 카테고리 코드 컬럼: {len(available_code_cols)}개")
        
        # 샘플 표시 (이름 + 코드)
        if 'category_1' in df.columns:
            sample_cols = ['category_1', 'category_2', 'category_3'] + available_code_cols
            available_sample_cols = [col for col in sample_cols if col in df.columns]
            sample_cats = df[available_sample_cols].dropna().head(3)
            
            logger.info("📋 카테고리 계층 예시:")
            for _, row in sample_cats.iterrows():
                hierarchy = []
                codes = []
                for col in ['category_1', 'category_2', 'category_3']:
                    if col in row and not pd.isna(row[col]):
                        hierarchy.append(str(row[col]))
                
                for col in ['category_code_1', 'category_code_2', 'category_code_3']:
                    if col in row and not pd.isna(row[col]):
                        codes.append(str(row[col]))
                
                category_display = ' > '.join(hierarchy)
                if codes:
                    code_display = ' > '.join(codes)
                    logger.info(f"   {category_display} ({code_display})")
                else:
                    logger.info(f"   {category_display}")
    
    def process_categories(self, df):
        """카테고리 데이터 처리 (단순화된 구조)"""
        logger.info("📂 카테고리 처리 시작")
        
        # 계층별 카테고리 컬럼 확인
        category_cols = ['category_1', 'category_2', 'category_3']
        code_cols = ['category_code_1', 'category_code_2', 'category_code_3']
        
        available_cols = [col for col in category_cols if col in df.columns]
        available_code_cols = [col for col in code_cols if col in df.columns]
        
        if not available_cols:
            logger.warning("⚠️ 카테고리 컬럼이 없습니다")
            return
        
        logger.info(f"📋 사용 가능한 카테고리 컬럼: {available_cols}")
        logger.info(f"📋 사용 가능한 코드 컬럼: {available_code_cols}")
        
        # 단계별로 카테고리 생성 (계층 순서 보장)
        category_idx = 1
        
        # 1단계: depth 0 (최상위)
        if 'category_1' in df.columns:
            level1_data = df[['category_1', 'category_code_1']].dropna().drop_duplicates()
            for _, row in level1_data.iterrows():
                name = self.clean_text(str(row['category_1']))
                code = str(row['category_code_1']).strip() if 'category_code_1' in row and not pd.isna(row['category_code_1']) else ""
                
                if name and name not in self.categories:
                    self.category_data.append({
                        'category_id': category_idx,
                        'category_name': name,
                        'category_code': code,
                        'parent_category_id': None,
                        'depth': 0
                    })
                    self.categories[name] = category_idx
                    category_idx += 1
        
        # 2단계: depth 1
        if 'category_2' in df.columns:
            level2_data = df[['category_1', 'category_2', 'category_code_2']].dropna().drop_duplicates()
            for _, row in level2_data.iterrows():
                parent_name = self.clean_text(str(row['category_1']))
                child_name = self.clean_text(str(row['category_2']))
                full_name = f"{parent_name} > {child_name}"
                code = str(row['category_code_2']).strip() if 'category_code_2' in row and not pd.isna(row['category_code_2']) else ""
                
                if full_name and full_name not in self.categories:
                    parent_id = self.categories.get(parent_name)
                    
                    self.category_data.append({
                        'category_id': category_idx,
                        'category_name': full_name,
                        'category_code': code,
                        'parent_category_id': parent_id,
                        'depth': 1
                    })
                    self.categories[full_name] = category_idx
                    category_idx += 1
        
        # 3단계: depth 2
        if 'category_3' in df.columns:
            level3_data = df[['category_1', 'category_2', 'category_3', 'category_code_3']].dropna().drop_duplicates()
            for _, row in level3_data.iterrows():
                parent_name = self.clean_text(str(row['category_1']))
                middle_name = self.clean_text(str(row['category_2']))
                child_name = self.clean_text(str(row['category_3']))
                full_name = f"{parent_name} > {middle_name} > {child_name}"
                parent_full_name = f"{parent_name} > {middle_name}"
                code = str(row['category_code_3']).strip() if 'category_code_3' in row and not pd.isna(row['category_code_3']) else ""
                
                if full_name and full_name not in self.categories:
                    parent_id = self.categories.get(parent_full_name)
                    
                    self.category_data.append({
                        'category_id': category_idx,
                        'category_name': full_name,
                        'category_code': code,
                        'parent_category_id': parent_id,
                        'depth': 2
                    })
                    self.categories[full_name] = category_idx
                    category_idx += 1
        
        logger.info(f"✅ 카테고리 처리 완료: {len(self.category_data)}개")
    
    def process_products(self, df):
        """상품 데이터 처리 (새 구조에 맞게)"""
        logger.info("📦 상품 처리 시작")
        
        processed_count = 0
        
        for idx, row in df.iterrows():
            # 상품명 확인 (name 컬럼 사용)
            product_name = self.clean_text(row.get('name', ''))
            
            if not product_name:
                logger.warning(f"⚠️ 상품명이 없는 행 스킵: {idx}")
                continue
            
            # 필드 매핑 (product_no는 이미 있으므로 그대로 사용)
            product_no = row.get('product_no', processed_count + 1)
            product_id = str(row.get('product_id', '')) if 'product_id' in row else None
            if product_id and pd.isna(product_id):
                product_id = None
            
            # 카테고리 매핑 (계층 구조로 조합)
            category_parts = []
            for col in ['category_1', 'category_2', 'category_3']:
                if col in row and not pd.isna(row[col]) and str(row[col]).strip():
                    category_parts.append(self.clean_text(str(row[col])))
                else:
                    break
            
            category_id = None
            if category_parts:
                # 전체 카테고리 경로로 매핑
                full_category_path = ' > '.join(category_parts)
                category_id = self.categories.get(full_category_path)
            
            # 기타 필드 (새 구조 반영)
            brand = self.clean_text(row.get('brand', ''))[:255] if row.get('brand') else None
            price = self.parse_price(row.get('price', ''))
            description = self.clean_text(row.get('description', ''))
            image_url = str(row.get('image_url', ''))[:1000] if 'image_url' in row else None
            
            self.product_data.append({
                'product_no': product_no,
                'product_id': product_id,
                'product_name': product_name[:500],  # 길이 제한
                'category_id': category_id,
                'brand': brand,
                'price': price,
                'description': description if description else None,
                'image_url': image_url if image_url else None
            })
            
            processed_count += 1
        
        logger.info(f"✅ 상품 처리 완료: {processed_count:,}개")
    
    def save_csv_files(self, output_dir="../../data/mysql_ready"):
        """CSV 파일 저장"""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Categories CSV
        if self.category_data:
            df_categories = pd.DataFrame(self.category_data)
            categories_file = output_path / 'categories.csv'
            df_categories.to_csv(categories_file, index=False, encoding='utf-8-sig')
            logger.info(f"✅ {categories_file} 저장 완료: {len(self.category_data)}개")
        
        # Products CSV
        if self.product_data:
            df_products = pd.DataFrame(self.product_data)
            products_file = output_path / 'products.csv'
            df_products.to_csv(products_file, index=False, encoding='utf-8-sig')
            logger.info(f"✅ {products_file} 저장 완료: {len(self.product_data)}개")
        
        logger.info(f"📁 출력 디렉토리: {output_path.resolve()}")
    
    def run(self, input_file=None):
        """전체 프로세스 실행"""
        logger.info("🚀 상품 마이그레이션 시작")
        
        # 입력 파일 찾기
        if not input_file:
            possible_files = [
                "../../crawler/products_detail.csv",
                "../../crawler/products.csv"
            ]
            
            for file_path in possible_files:
                if Path(file_path).exists():
                    input_file = file_path
                    break
            
            if not input_file:
                logger.error(f"❌ 상품 데이터 파일을 찾을 수 없습니다: {possible_files}")
                return False
        
        # 데이터 로드
        logger.info(f"📁 데이터 로드: {input_file}")
        try:
            df = pd.read_csv(input_file)
            logger.info(f"📊 로드된 데이터: {len(df):,}행 x {len(df.columns)}열")
            logger.info(f"📋 컬럼: {list(df.columns)}")
        except Exception as e:
            logger.error(f"❌ 파일 로드 실패: {e}")
            return False
        
        # 데이터 분석 및 처리
        self.get_category_hierarchy_info(df)
        self.process_categories(df)
        self.process_products(df)
        
        # CSV 저장
        self.save_csv_files()
        
        # 요약 정보
        logger.info("=" * 60)
        logger.info("📋 마이그레이션 요약")
        logger.info(f"📊 원본 데이터: {len(df):,}행")
        logger.info(f"📂 생성된 카테고리: {len(self.category_data):,}개")
        logger.info(f"📦 처리된 상품: {len(self.product_data):,}개")
        
        # 카테고리 매핑 성공률
        mapped_products = sum(1 for p in self.product_data if p['category_id'] is not None)
        mapping_rate = (mapped_products / len(self.product_data)) * 100 if self.product_data else 0
        logger.info(f"🎯 카테고리 매핑률: {mapping_rate:.1f}% ({mapped_products}/{len(self.product_data)})")
        
        # 브랜드 통계
        brands = set(p['brand'] for p in self.product_data if p['brand'])
        logger.info(f"🏷️ 고유 브랜드: {len(brands)}개")
        
        # 가격 통계
        prices = [p['price'] for p in self.product_data if p['price']]
        if prices:
            avg_price = sum(prices) / len(prices)
            logger.info(f"💰 평균 가격: {avg_price:,.0f}원 (범위: {min(prices):,.0f}~{max(prices):,.0f}원)")
        
        # 카테고리 샘플 출력 (깊이별로 정렬하여 표시)
        logger.info("📋 생성된 카테고리 샘플:")
        sorted_cats = sorted(self.category_data, key=lambda x: (x['depth'], x['category_name']))
        for cat in sorted_cats[:10]:  # 상위 10개만
            name = cat['category_name']
            code = cat['category_code']
            depth = cat['depth']
            parent_id = cat['parent_category_id']
            
            indent = "  " * depth
            parent_info = f" (parent: {parent_id})" if parent_id else ""
            
            if code:
                logger.info(f"   {indent}[{cat['category_id']}] {name} ({code}){parent_info}")
            else:
                logger.info(f"   {indent}[{cat['category_id']}] {name}{parent_info}")
        
        logger.info("=" * 60)
        
        logger.info("🎉 상품 마이그레이션 완료!")
        return True

def main():
    migration = ProductsMigration()
    success = migration.run()
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 