#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
간단한 상품 리스트 크롤러
"""

import pandas as pd
import requests
from bs4 import BeautifulSoup
import time
from datetime import datetime
import sys
import re
from urllib.parse import urljoin


class SimpleCrawler:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.products = []
    
    def extract_product_data(self, item, brand, category_info, source_url):
        """상품 데이터 추출"""
        try:
            product = {
                'brand': brand,
                'category_1': category_info.get('category_name_1', ''),
                'category_2': category_info.get('category_name_2', ''),
                'category_3': category_info.get('category_name_3', ''),
                'category_code_1': category_info.get('category_code_1', ''),
                'category_code_2': category_info.get('category_code_2', ''),
                'category_code_3': category_info.get('category_code_3', ''),
                'source_url': source_url,
                'crawled_at': datetime.now().isoformat(),
            }
            
            # 상품 번호
            product['product_no'] = item.get('data-prdno', '')
            
            # 상품 이미지
            img_elem = item.find('div', class_='god-img')
            if img_elem:
                img_tag = img_elem.find('img')
                if img_tag and img_tag.get('src'):
                    product['image_url'] = img_tag['src']
                else:
                    product['image_url'] = ''
            else:
                product['image_url'] = ''
            
            # 상품 정보
            info_elem = item.find('div', class_='god-info')
            if info_elem:
                # 브랜드 (비어있을 수 있음)
                brand_elem = info_elem.find('span', class_='brand')
                product['brand_text'] = brand_elem.get_text(strip=True) if brand_elem else ''
                
                # 상품명
                name_elem = info_elem.find('span', class_='name')
                product['name'] = name_elem.get_text(strip=True) if name_elem else ''
                
                # 가격
                price_elem = info_elem.find('span', class_='price')
                if price_elem:
                    price_text = price_elem.get_text(strip=True)
                    # 할인가격이 있는 경우와 일반 가격 처리
                    price_numbers = re.findall(r'[\d,]+', price_text)
                    if price_numbers:
                        # 마지막 숫자가 실제 판매가
                        product['price'] = price_numbers[-1].replace(',', '')
                        product['price_text'] = price_text
                    else:
                        product['price'] = ''
                        product['price_text'] = price_text
                else:
                    product['price'] = ''
                    product['price_text'] = ''
                
                # 별점, 리뷰, 좋아요 (score 영역)
                score_elem = info_elem.find('span', class_='score')
                if score_elem:
                    # 별점
                    point_elem = score_elem.find('span', class_='point')
                    if point_elem:
                        point_em = point_elem.find('em')
                        product['rating'] = point_em.get_text(strip=True) if point_em else ''
                    else:
                        product['rating'] = ''
                    
                    # 리뷰 개수
                    review_elem = score_elem.find('span', class_='review')
                    if review_elem:
                        review_em = review_elem.find('em')
                        product['review_count'] = review_em.get_text(strip=True) if review_em else ''
                    else:
                        product['review_count'] = ''
                    
                    # 좋아요 개수
                    heart_elem = score_elem.find('span', class_='heart')
                    if heart_elem:
                        heart_em = heart_elem.find('em')
                        product['like_count'] = heart_em.get_text(strip=True) if heart_em else ''
                    else:
                        product['like_count'] = ''
                else:
                    product['rating'] = ''
                    product['review_count'] = ''
                    product['like_count'] = ''
            
            # 품절 여부
            product['is_soldout'] = 'soldout' in item.get('class', [])
            
            return product
            
        except Exception as e:
            print(f"상품 데이터 추출 오류: {e}")
            return None
    
    def crawl_page(self, url, brand, category_info):
        """페이지 크롤링"""
        try:
            print(f"크롤링: {brand} - {category_info.get('category_name_1', '')} - {url}")
            
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 상품 리스트 찾기
            product_list = soup.find('ul', id='dspGood')
            if not product_list:
                print("상품 리스트를 찾을 수 없습니다.")
                return []
            
            # 각 상품 아이템 추출
            product_items = product_list.find_all('li', class_='god-item')
            products = []
            
            for item in product_items:
                product = self.extract_product_data(item, brand, category_info, url)
                if product:
                    products.append(product)
            
            print(f"완료: {len(products)} 개 상품")
            return products
            
        except Exception as e:
            print(f"크롤링 오류: {e}")
            return []
    
    def get_max_page(self, soup):
        """최대 페이지 수 확인"""
        try:
            paging_area = soup.find('div', class_='page', id='pagingArea')
            if paging_area:
                # 마지막 페이지 링크 찾기
                last_link = paging_area.find('a', class_='last')
                if last_link and last_link.get('pageno'):
                    return int(last_link['pageno'])
                
                # 페이지 번호 링크들에서 최대값 찾기
                page_links = paging_area.find_all('a', class_='btn_paging')
                if page_links:
                    pages = []
                    for link in page_links:
                        if link.get('pageno'):
                            pages.append(int(link['pageno']))
                    return max(pages) if pages else 1
            
            return 1
        except Exception:
            return 1
    
    def crawl_with_pagination(self, base_url, brand, category_info, max_pages=5):
        """페이지네이션을 포함한 크롤링"""
        all_products = []
        
        # 첫 번째 페이지 크롤링
        products = self.crawl_page(base_url, brand, category_info)
        all_products.extend(products)
        
        # 페이지네이션 확인
        try:
            response = self.session.get(base_url, timeout=30)
            soup = BeautifulSoup(response.content, 'html.parser')
            total_pages = min(self.get_max_page(soup), max_pages)
            
            print(f"총 {total_pages} 페이지 중 {max_pages} 페이지까지 크롤링")
            
            # 2페이지부터 크롤링
            for page in range(2, total_pages + 1):
                try:
                    # 페이지 URL 생성
                    if '?' in base_url:
                        page_url = f"{base_url}&page={page}"
                    else:
                        page_url = f"{base_url}?page={page}"
                    
                    products = self.crawl_page(page_url, brand, category_info)
                    all_products.extend(products)
                    
                    # 페이지 간 딜레이
                    time.sleep(1.0)
                    
                except Exception as e:
                    print(f"페이지 {page} 크롤링 오류: {e}")
                    continue
        
        except Exception as e:
            print(f"페이지네이션 처리 오류: {e}")
        
        return all_products
    
    def run(self, brands=None, max_pages=3):
        """크롤링 실행"""
        # categories.csv 읽기
        try:
            df = pd.read_csv('categories.csv', encoding='utf-8')
        except Exception as e:
            print(f"categories.csv 파일 오류: {e}")
            return
        
        # 특정 브랜드만 크롤링
        if brands:
            df = df[df['brand'].isin(brands)]
        
        print(f"총 {len(df)} 개 카테고리 크롤링 시작 (페이지당 최대 {max_pages}페이지)")
        
        for idx, row in df.iterrows():
            try:
                products = self.crawl_with_pagination(
                    row['url'], 
                    row['brand'], 
                    row.to_dict(),
                    max_pages
                )
                self.products.extend(products)
                
                # 카테고리 간 딜레이
                time.sleep(2.0)
                
                if (idx + 1) % 5 == 0:
                    print(f"진행률: {idx + 1}/{len(df)} ({len(self.products)} 개 상품 수집됨)")
            
            except Exception as e:
                print(f"카테고리 크롤링 실패 - {row['brand']}: {e}")
                continue
        
        # 결과 저장
        if self.products:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"products_{timestamp}.csv"
            
            result_df = pd.DataFrame(self.products)
            result_df.to_csv(filename, index=False, encoding='utf-8-sig')
            
            print(f"\n완료! 결과 저장: {filename}")
            print(f"총 상품 수: {len(self.products)}")
            
            # 간단한 통계
            if len(self.products) > 0:
                brand_counts = result_df['brand'].value_counts()
                print(f"\n브랜드별 상품 수:")
                for brand, count in brand_counts.items():
                    print(f"  - {brand}: {count}개")
        else:
            print("크롤링된 상품이 없습니다.")


def main():
    crawler = SimpleCrawler()
    
    # 명령행 인수 처리
    brands = None
    max_pages = 3  # 기본값
    
    if len(sys.argv) > 1:
        args = sys.argv[1:]
        # 숫자가 있으면 max_pages로 사용
        numeric_args = [arg for arg in args if arg.isdigit()]
        if numeric_args:
            max_pages = int(numeric_args[0])
            args = [arg for arg in args if not arg.isdigit()]
        
        # 나머지는 브랜드명
        if args:
            brands = args
            print(f"지정된 브랜드: {brands}")
    
    print(f"페이지당 최대 {max_pages} 페이지까지 크롤링")
    crawler.run(brands, max_pages)


if __name__ == "__main__":
    main() 