#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
상품 상세정보 크롤러
"""

import pandas as pd
import requests
from bs4 import BeautifulSoup
import time
from datetime import datetime
import sys
import re
from urllib.parse import parse_qs, urlparse


class ProductDetailCrawler:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.brand_shop_mapping = {}
    
    def extract_brand_shop_no(self, url):
        """URL에서 brandShopNo 추출"""
        try:
            parsed = urlparse(url)
            params = parse_qs(parsed.query)
            if 'brandShopNo' in params:
                return params['brandShopNo'][0]
            return None
        except Exception:
            return None
    
    def load_brand_mapping(self):
        """categories.csv에서 브랜드별 brandShopNo 매핑 로드"""
        try:
            df = pd.read_csv('categories.csv', encoding='utf-8')
            
            for _, row in df.iterrows():
                brand = row['brand']
                if brand not in self.brand_shop_mapping:
                    brand_shop_no = self.extract_brand_shop_no(row['url'])
                    if brand_shop_no:
                        self.brand_shop_mapping[brand] = brand_shop_no
            
            print(f"브랜드 매핑 로드 완료: {len(self.brand_shop_mapping)} 개 브랜드")
            for brand, shop_no in self.brand_shop_mapping.items():
                print(f"  - {brand}: {shop_no}")
            
        except Exception as e:
            print(f"브랜드 매핑 로드 실패: {e}")
    
    def get_product_detail(self, product_no, brand):
        """상품 상세정보 조회"""
        try:
            # 브랜드별 brandShopNo 가져오기
            brand_shop_no = self.brand_shop_mapping.get(brand)
            if not brand_shop_no:
                print(f"브랜드 {brand}의 brandShopNo를 찾을 수 없음")
                return ""
            
            # API URL 생성
            url = f"https://www.ssfshop.com/public/goods/detail/getGoodsTabInfo?godNo={product_no}&tabType=GOODS_INFO&brandShopNo={brand_shop_no}"
            
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 상품 설명 추출
            desc_elem = soup.find('p', class_='about-desc')
            if desc_elem:
                description = desc_elem.get_text(strip=True)
                return description
            else:
                print(f"상품 {product_no}: 설명을 찾을 수 없음")
                return ""
            
        except Exception as e:
            print(f"상품 {product_no} 상세정보 조회 실패: {e}")
            return ""
    
    def process_products(self, csv_file, limit=None):
        """products.csv 파일을 읽어서 상세정보 추가"""
        try:
            # CSV 파일 읽기
            df = pd.read_csv(csv_file, encoding='utf-8')
            print(f"상품 데이터 로드: {len(df)} 개 상품")
            
            # 제한이 있으면 적용
            if limit:
                df = df.head(limit)
                print(f"테스트용으로 {limit}개 상품만 처리")
            
            # 설명 컬럼 추가
            df['description'] = ''
            
            total_count = len(df)
            success_count = 0
            
            for idx, row in df.iterrows():
                product_no = row.get('product_no', '')
                brand = row.get('brand', '')
                
                if not product_no:
                    print(f"행 {idx + 1}: 상품번호가 없음")
                    continue
                
                print(f"[{idx + 1}/{total_count}] {brand} - {product_no} 처리 중...")
                
                # 상세정보 가져오기
                description = self.get_product_detail(product_no, brand)
                df.at[idx, 'description'] = description
                
                if description:
                    success_count += 1
                
                # 요청 간격
                time.sleep(0.1)
                
                # 진행률 출력
                if (idx + 1) % 10 == 0:
                    print(f"진행률: {idx + 1}/{total_count} ({success_count}/{idx + 1} 성공)")
            
            # 결과 저장
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_file = f"products_detail_{timestamp}.csv"
            
            df.to_csv(output_file, index=False, encoding='utf-8-sig')
            
            print(f"\n완료!")
            print(f"결과 파일: {output_file}")
            print(f"총 상품: {total_count}개")
            print(f"성공: {success_count}개")
            print(f"실패: {total_count - success_count}개")
            
        except Exception as e:
            print(f"처리 중 오류: {e}")
    
    def run(self, csv_file=None, limit=None):
        """메인 실행"""
        # 브랜드 매핑 로드
        self.load_brand_mapping()
        
        if not self.brand_shop_mapping:
            print("브랜드 매핑을 로드할 수 없습니다.")
            return
        
        # CSV 파일 찾기
        if not csv_file:
            # 최신 products_*.csv 파일 찾기
            import glob
            import os
            
            pattern = "products.csv"
            files = glob.glob(pattern)
            
            if not files:
                print("products_*.csv 파일을 찾을 수 없습니다.")
                print("먼저 상품 리스트 크롤링을 실행하세요: python crawler.py")
                return
            
            # 가장 최신 파일 선택
            csv_file = max(files, key=os.path.getctime)
            print(f"최신 파일 선택: {csv_file}")
        
        # 상품 처리
        self.process_products(csv_file, limit)


def main():
    crawler = ProductDetailCrawler()
    
    csv_file = None
    limit = None
    
    # 명령행 인수 처리
    if len(sys.argv) > 1:
        args = sys.argv[1:]
        
        # 숫자가 있으면 limit으로 사용
        for arg in args:
            if arg.isdigit():
                limit = int(arg)
                print(f"테스트 모드: {limit}개 상품만 처리")
            elif arg.endswith('.csv'):
                csv_file = arg
                print(f"지정된 파일: {csv_file}")
    
    crawler.run(csv_file, limit)


if __name__ == "__main__":
    main() 