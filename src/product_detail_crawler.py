#!/usr/bin/env python3
"""
상품 상세정보 크롤러
상품 리스트에서 개별 상품의 상세 정보를 크롤링
"""

import requests
import csv
import re
import logging
import time
import pandas as pd
from datetime import datetime
from typing import List, Dict, Optional
from urllib.parse import urljoin

from bs4 import BeautifulSoup
from fake_useragent import UserAgent

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)

logger = logging.getLogger("product_detail_crawler")


class ProductDetailCrawler:
    """상품 상세정보 크롤러"""
    
    def __init__(self, delay_between_requests: float = 2.0):
        """
        크롤러 초기화
        
        Args:
            delay_between_requests: 요청 간 지연 시간(초)
        """
        self.delay = delay_between_requests
        self.ua = UserAgent()
        self.session = requests.Session()
        
        # 기본 헤더 설정
        self.session.headers.update({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def extract_product_id_from_url(self, javascript_url: str) -> Optional[str]:
        """JavaScript URL에서 상품 ID 추출"""
        try:
            # javascript:goToProductDetail('BEANPOLE-MEN','GM0025012354227','1',this, 'godList');
            pattern = r"goToProductDetail\('([^']+)','([^']+)'"
            match = re.search(pattern, javascript_url)
            
            if match:
                brand_id = match.group(1)  # 'BEANPOLE-MEN'
                product_id = match.group(2)  # 'GM0025012354227'
                return product_id
            
            return None
            
        except Exception as e:
            logger.error(f"상품 ID 추출 실패: {str(e)}")
            return None
    
    def build_product_detail_url(self, product_id: str, brand: str = "BEANPOLE") -> str:
        """상품 상세 페이지 URL 생성"""
        # BEANPOLE 브랜드의 상품 상세 페이지 URL 패턴
        if brand.upper() == "BEANPOLE":
            return f"https://www.ssfshop.com/BEANPOLE-MEN/sfma/{product_id}/Product"
        else:
            # 다른 브랜드는 추후 추가
            return f"https://www.ssfshop.com/{brand}/sfma/{product_id}/Product"
    
    def get_page(self, url: str, retries: int = 3) -> Optional[BeautifulSoup]:
        """웹페이지 요청 및 파싱"""
        for attempt in range(retries):
            try:
                # User-Agent 로테이션
                self.session.headers['User-Agent'] = self.ua.random
                
                logger.info(f"페이지 요청 (시도 {attempt + 1}/{retries}): {url}")
                
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 요청 간 지연
                if attempt < retries - 1:
                    time.sleep(self.delay)
                
                return soup
                
            except requests.exceptions.RequestException as e:
                logger.error(f"요청 실패 (시도 {attempt + 1}): {str(e)}")
                if attempt < retries - 1:
                    time.sleep(self.delay * 2)  # 실패 시 더 긴 지연
                continue
                
        logger.error(f"모든 시도 실패: {url}")
        return None
    
    def extract_product_detail(self, soup: BeautifulSoup, product_id: str) -> Dict:
        """상품 상세 정보 추출"""
        detail = {
            'product_id': product_id,
            'detailed_description': '',
            'size_options': '',
            'color_options': '',
            'material': '',
            'care_instructions': '',
            'model_info': '',
            'stock_status': '',
            'additional_images': '',
            'product_reviews': '',
            'average_rating': '',
            'total_reviews': '',
            'crawled_at': datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        try:
            # 상세 설명 추출
            description_elem = soup.select_one('.product-detail-info, .prd-detail-info, .detail-info')
            if description_elem:
                detail['detailed_description'] = description_elem.get_text(strip=True)
            
            # 사이즈 옵션 추출
            size_elems = soup.select('.size-option, .option-size, [data-size]')
            sizes = []
            for size_elem in size_elems:
                size_text = size_elem.get_text(strip=True)
                if size_text and size_text not in sizes:
                    sizes.append(size_text)
            detail['size_options'] = '|'.join(sizes) if sizes else ''
            
            # 색상 옵션 추출
            color_elems = soup.select('.color-option, .option-color, [data-color]')
            colors = []
            for color_elem in color_elems:
                color_text = color_elem.get('title') or color_elem.get_text(strip=True)
                if color_text and color_text not in colors:
                    colors.append(color_text)
            detail['color_options'] = '|'.join(colors) if colors else ''
            
            # 소재 정보 추출
            material_elem = soup.select_one('.material, .fabric, .composition')
            if material_elem:
                detail['material'] = material_elem.get_text(strip=True)
            
            # 세탁 방법 추출
            care_elem = soup.select_one('.care, .washing, .laundry')
            if care_elem:
                detail['care_instructions'] = care_elem.get_text(strip=True)
            
            # 모델 정보 추출
            model_elem = soup.select_one('.model-info, .model-size')
            if model_elem:
                detail['model_info'] = model_elem.get_text(strip=True)
            
            # 재고 상태 추출
            stock_elem = soup.select_one('.stock, .inventory, .soldout, .available')
            if stock_elem:
                detail['stock_status'] = stock_elem.get_text(strip=True)
            
            # 추가 이미지 URL 추출
            img_elems = soup.select('.product-images img, .detail-images img')
            img_urls = []
            for img in img_elems:
                src = img.get('src') or img.get('data-src')
                if src and src.startswith('http'):
                    img_urls.append(src)
            detail['additional_images'] = '|'.join(img_urls[:5]) if img_urls else ''  # 최대 5개
            
            # 평점 정보 추출
            rating_elem = soup.select_one('.rating, .review-score, .star-rating')
            if rating_elem:
                rating_text = rating_elem.get_text(strip=True)
                # 숫자만 추출 (예: "4.5점" -> "4.5")
                rating_match = re.search(r'(\d+\.?\d*)', rating_text)
                if rating_match:
                    detail['average_rating'] = rating_match.group(1)
            
            # 리뷰 수 추출
            review_count_elem = soup.select_one('.review-count, .review-num')
            if review_count_elem:
                review_text = review_count_elem.get_text(strip=True)
                # 숫자만 추출
                review_match = re.search(r'(\d+)', review_text)
                if review_match:
                    detail['total_reviews'] = review_match.group(1)
            
            # 리뷰 내용 추출 (처음 3개)
            review_elems = soup.select('.review-item, .review-content')[:3]
            reviews = []
            for review in review_elems:
                review_text = review.get_text(strip=True)
                if review_text:
                    reviews.append(review_text[:100])  # 최대 100자
            detail['product_reviews'] = '|||'.join(reviews) if reviews else ''
            
            logger.debug(f"상품 상세 정보 추출 완료: {product_id}")
            
        except Exception as e:
            logger.error(f"상품 상세 정보 추출 실패 ({product_id}): {str(e)}")
        
        return detail
    
    def crawl_product_detail(self, product_id: str, brand: str = "BEANPOLE") -> Optional[Dict]:
        """단일 상품 상세 정보 크롤링"""
        try:
            # 상품 상세 페이지 URL 생성
            detail_url = self.build_product_detail_url(product_id, brand)
            logger.info(f"상품 상세 크롤링 시작: {product_id}")
            
            # 페이지 요청
            soup = self.get_page(detail_url)
            if not soup:
                logger.error(f"상품 페이지 로딩 실패: {product_id}")
                return None
            
            # 상세 정보 추출
            detail = self.extract_product_detail(soup, product_id)
            detail['detail_url'] = detail_url
            
            return detail
            
        except Exception as e:
            logger.error(f"상품 상세 크롤링 실패 ({product_id}): {str(e)}")
            return None
    
    def crawl_products_from_csv(self, products_csv_file: str, output_file: str, 
                              max_products: int = None) -> int:
        """CSV 파일의 상품들 상세 정보 크롤링"""
        try:
            # 상품 리스트 파일 읽기
            df = pd.read_csv(products_csv_file)
            logger.info(f"상품 리스트 파일 로딩: {products_csv_file}")
            logger.info(f"총 {len(df)}개 상품 발견")
            
            if max_products:
                df = df.head(max_products)
                logger.info(f"크롤링 대상을 {max_products}개로 제한")
            
            details = []
            success_count = 0
            
            for idx, row in df.iterrows():
                try:
                    # JavaScript URL에서 상품 ID 추출
                    product_id = self.extract_product_id_from_url(row['product_url'])
                    if not product_id:
                        logger.warning(f"상품 ID 추출 실패: {row['product_url']}")
                        continue
                    
                    # 상품 상세 정보 크롤링
                    detail = self.crawl_product_detail(product_id, row['brand'])
                    
                    if detail:
                        # 기본 상품 정보와 상세 정보 병합
                        merged_data = {
                            'product_id': product_id,
                            'brand': row['brand'],
                            'category_1': row['category_1'],
                            'category_2': row['category_2'],
                            'product_name': row['product_name'],
                            'sale_price': row['sale_price'],
                            'original_price': row['original_price'],
                            'image_url': row['image_url'],
                            **detail  # 상세 정보 추가
                        }
                        details.append(merged_data)
                        success_count += 1
                        
                        logger.info(f"상품 {idx+1}/{len(df)} 완료: {product_id} (성공 {success_count}개)")
                        
                        # 중간 저장 (10개마다)
                        if len(details) % 10 == 0:
                            self._save_details_to_csv(details, output_file)
                            logger.info(f"중간 저장: {len(details)}개 상품")
                    
                    # 요청 간 지연
                    time.sleep(self.delay)
                    
                except Exception as e:
                    logger.error(f"상품 처리 실패 ({idx+1}): {str(e)}")
                    continue
            
            # 최종 저장
            if details:
                self._save_details_to_csv(details, output_file)
                logger.info(f"크롤링 완료: 총 {len(details)}개 상품 상세 정보 저장")
            
            return len(details)
            
        except Exception as e:
            logger.error(f"CSV 파일 크롤링 실패: {str(e)}")
            return 0
    
    def _save_details_to_csv(self, details: List[Dict], output_file: str):
        """상품 상세 정보를 CSV 파일로 저장"""
        try:
            df = pd.DataFrame(details)
            df.to_csv(output_file, index=False, encoding='utf-8-sig')
            logger.debug(f"상품 상세 정보 저장 완료: {output_file} ({len(details)}개)")
            
        except Exception as e:
            logger.error(f"파일 저장 실패: {str(e)}")


def main():
    """메인 실행 함수"""
    import glob
    import os
    
    # 가장 최근 상품 리스트 파일 자동 찾기
    pattern = "data/products/products_full_*.csv"
    files = glob.glob(pattern)
    
    if not files:
        logger.error("상품 리스트 파일을 찾을 수 없습니다.")
        return
    
    # 가장 최근 파일 선택
    products_file = max(files, key=os.path.getctime)
    logger.info(f"가장 최근의 CSV 파일을 자동으로 찾았습니다: {products_file}")
    
    # 출력 파일명 생성
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = f"data/products/product_details_{timestamp}.csv"
    
    # 크롤러 실행
    crawler = ProductDetailCrawler(delay_between_requests=2.0)
    
    start_time = datetime.now()
    logger.info("⏱️ 크롤링 시작 시간: " + start_time.strftime("%Y-%m-%d %H:%M:%S"))
    logger.info(f"사용할 상품 목록 파일: {products_file}")
    
    try:
        # CSV 파일 구조 확인
        df = pd.read_csv(products_file)
        logger.info(f"상품 목록 CSV 파일에서 {len(df)}개 상품 로드됨")
        
        # 필수 컬럼 확인
        required_columns = ['product_url', 'brand', 'product_name']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            logger.error(f"CSV 파일에 필수 열이 없습니다: {missing_columns}")
            logger.info(f"사용 가능한 열: {list(df.columns)}")
            return
        
        # 테스트로 처음 5개 상품만 크롤링
        total_crawled = crawler.crawl_products_from_csv(
            products_csv_file=products_file,
            output_file=output_file,
            max_products=5  # 테스트용
        )
        
        logger.info(f"=== 크롤링 완료: {total_crawled}개 상품 ===")
        logger.info(f"결과 파일: {output_file}")
        
    except Exception as e:
        logger.error(f"크롤링 실행 중 오류: {str(e)}")
    finally:
        end_time = datetime.now()
        duration = end_time - start_time
        duration_seconds = duration.total_seconds()
        duration_minutes = duration_seconds / 60
        
        logger.info("⏱️ 크롤링 종료 시간: " + end_time.strftime("%Y-%m-%d %H:%M:%S"))
        logger.info(f"⏱️ 총 소요 시간: {duration_seconds:.1f}초 ({duration_minutes:.1f}분)")


if __name__ == "__main__":
    main() 