#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
상품 리뷰 크롤러

기능:
- SSF Shop 상품 리뷰 크롤링
- 리뷰가 없을 때까지 모든 페이지 자동 크롤링
- 일정 개수마다 중간저장 (기본: 100개)
- 단일 파일에 실시간 저장
- 메모리 효율적 크롤링

사용법:
  python review_crawler.py                    # 기본 실행 (100개마다 저장, 모든 페이지)
  python review_crawler.py --batch 50        # 50개마다 저장
  python review_crawler.py -b 200           # 200개마다 저장
  python review_crawler.py --batch=75       # 75개마다 저장
  python review_crawler.py 100              # 테스트: 100개 상품만
  python review_crawler.py products.csv     # 특정 파일 사용

주요 특징:
- 리뷰가 있는 만큼 모든 페이지를 자동으로 크롤링
- 페이지 수 제한 없음 (리뷰가 없으면 자동 중단)
- 최대 50페이지 안전장치 (무한 루프 방지)
"""

import pandas as pd
import requests
from bs4 import BeautifulSoup
import time
from datetime import datetime
import sys
import re
from urllib.parse import parse_qs, urlparse


class ReviewCrawler:
    def __init__(self, batch_save_size=100):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.brand_shop_mapping = {}
        self.reviews = []
        self.batch_save_size = batch_save_size  # 중간저장 단위
        self.batch_counter = 0  # 배치 카운터
        self.total_saved_reviews = 0  # 총 저장된 리뷰 수
        self.output_file = None  # 단일 출력 파일
        self.is_first_save = True  # 첫 번째 저장 여부
    
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
            
        except Exception as e:
            print(f"브랜드 매핑 로드 실패: {e}")
    
    def extract_rating(self, rate_elem):
        """별점 추출"""
        try:
            if 'point5' in rate_elem.get('class', []):
                return 5
            elif 'point4' in rate_elem.get('class', []):
                return 4
            elif 'point3' in rate_elem.get('class', []):
                return 3
            elif 'point2' in rate_elem.get('class', []):
                return 2
            elif 'point1' in rate_elem.get('class', []):
                return 1
            else:
                return 0
        except Exception:
            return 0
    
    def extract_review_options(self, pick_opts_elem):
        """구매 옵션 정보 추출"""
        options = {}
        try:
            spans = pick_opts_elem.find_all('span')
            for span in spans:
                # <em> 태그들을 찾아서 파싱
                em_tags = span.find_all('em')
                if len(em_tags) >= 2:
                    # 첫 번째 em이 레이블, 두 번째 em이 값
                    label = em_tags[0].get_text(strip=True)
                    value = em_tags[1].get_text(strip=True)
                    
                    if '색상:' in label:
                        options['color'] = value
                    elif '사이즈:' in label:
                        options['size'] = value
                    elif '평소 사이즈:' in label:
                        options['usual_size'] = value
                    elif '길이:' in label:
                        options['length'] = value
                else:
                    # fallback: 전체 텍스트에서 파싱
                    text = span.get_text(strip=True)
                    if '색상:' in text:
                        options['color'] = text.split('색상:')[-1].strip()
                    elif '사이즈:' in text:
                        options['size'] = text.split('사이즈:')[-1].strip()
                    elif '평소 사이즈:' in text:
                        options['usual_size'] = text.split('평소 사이즈:')[-1].strip()
                    elif '길이:' in text:
                        options['length'] = text.split('길이:')[-1].strip()
        except Exception as e:
            print(f"옵션 파싱 오류: {e}")
            pass
        
        return options
    
    def extract_review_images(self, review_photos_elem):
        """리뷰 이미지 URL 추출"""
        images = []
        try:
            if review_photos_elem:
                img_tags = review_photos_elem.find_all('img')
                for img in img_tags:
                    img_url = img.get('data-original') or img.get('src')
                    if img_url and 'noImg' not in img_url:
                        images.append(img_url)
        except Exception:
            pass
        
        return images
    
    def save_batch_reviews(self, force_save=False):
        """배치 단위로 리뷰 중간저장 (단일 파일에 추가)"""
        if len(self.reviews) < self.batch_save_size and not force_save:
            return
        
        if not self.reviews:
            return
        
        try:
            # 첫 번째 저장시 파일명 생성
            if self.output_file is None:
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                self.output_file = f"reviews_final_{timestamp}.csv"
            
            self.batch_counter += 1
            result_df = pd.DataFrame(self.reviews)
            
            # 첫 번째 저장시에는 헤더와 함께 새 파일 생성
            if self.is_first_save:
                result_df.to_csv(self.output_file, index=False, encoding='utf-8-sig', mode='w')
                self.is_first_save = False
                print(f"✅ 새 파일 생성: {self.output_file}")
            else:
                # 이후에는 헤더 없이 append 모드로 추가
                result_df.to_csv(self.output_file, index=False, encoding='utf-8-sig', mode='a', header=False)
            
            self.total_saved_reviews += len(self.reviews)
            
            print(f"✅ 배치 {self.batch_counter} 저장 완료: {len(self.reviews)}개 리뷰 추가")
            print(f"   파일: {self.output_file}")
            print(f"   총 저장된 리뷰: {self.total_saved_reviews}개")
            
            # 메모리에서 리뷰 데이터 제거
            self.reviews = []
            
        except Exception as e:
            print(f"❌ 배치 저장 실패: {e}")
    
    def merge_batch_files(self):
        """단일 파일이므로 병합 불필요 - 최종 통계만 출력"""
        if not self.output_file:
            print("저장된 파일이 없습니다.")
            return None
        
        try:
            # 최종 파일 통계 출력
            final_df = pd.read_csv(self.output_file, encoding='utf-8-sig')
            print(f"✅ 최종 파일: {self.output_file} (총 {len(final_df)}개 리뷰)")
            return self.output_file
            
        except Exception as e:
            print(f"❌ 파일 읽기 실패: {e}")
            return self.output_file
    
    def cleanup_batch_files(self):
        """단일 파일이므로 정리 불필요"""
        print("✅ 단일 파일로 저장되어 정리 과정 생략")
        pass
    
    def get_max_review_pages(self, soup):
        """리뷰 최대 페이지 수 확인"""
        try:
            page_div = soup.find('div', class_='page')
            print(f"🔍 페이지네이션 div 발견: {page_div is not None}")
            
            if page_div:
                # 모든 페이지 링크 찾기
                page_links = page_div.find_all('a')
                max_page = 1
                print(f"   📄 페이지 링크 개수: {len(page_links)}")
                
                for link in page_links:
                    onclick = link.get('onclick', '')
                    text = link.get_text(strip=True)
                    class_list = link.get('class', [])
                    
                    print(f"   🔗 링크 분석: text='{text}', onclick='{onclick}', class={class_list}")
                    
                    if 'getReviewList' in onclick:
                        # onclick="javascript:getReviewList('3','','','');" 에서 페이지 번호 추출
                        import re
                        match = re.search(r"getReviewList\('(\d+)'", onclick)
                        if match:
                            page_num = int(match.group(1))
                            max_page = max(max_page, page_num)
                            print(f"   ✓ onClick에서 페이지 {page_num} 발견")
                    
                    # 현재 페이지 (class="on"인 경우)
                    if 'on' in class_list and text.isdigit():
                        page_num = int(text)
                        max_page = max(max_page, page_num)
                        print(f"   ✓ 현재 페이지(class=on)에서 페이지 {page_num} 발견")
                    
                    # 텍스트로 된 페이지 번호도 확인 (onclick이 없는 경우)
                    elif text.isdigit() and not onclick:
                        page_num = int(text)
                        max_page = max(max_page, page_num)
                        print(f"   ✓ 텍스트에서 페이지 {page_num} 발견")
                
                print(f"   📊 최대 페이지 수: {max_page}")
                return max_page
            else:
                print("   ❌ 페이지네이션 div를 찾을 수 없음")
            
            return 1
        except Exception as e:
            print(f"   ⚠️ 페이지 수 확인 오류: {e}")
            return 1
    
    def get_product_reviews(self, product_no, brand, max_pages=50):
        """상품 리뷰 조회 (리뷰가 없을 때까지 모든 페이지 크롤링)"""
        try:
            # 브랜드별 brandShopNo 가져오기
            brand_shop_no = self.brand_shop_mapping.get(brand)
            if not brand_shop_no:
                print(f"브랜드 {brand}의 brandShopNo를 찾을 수 없음")
                return []
            
            all_reviews = []
            
            print(f"🎯 상품 {product_no}: 리뷰가 없을 때까지 모든 페이지 크롤링 (최대 {max_pages}페이지 안전장치)")
            
            # 1페이지부터 리뷰가 없을 때까지 계속 크롤링
            page = 1
            while page <= max_pages:
                try:
                    print(f"\n📄 페이지 {page} 크롤링 중...")
                    
                    # 리뷰 API URL 생성
                    url = f"https://www.ssfshop.com/public/goods/detail/listReview?pageNo={page}&sortFlag=&godNo={product_no}&selectAllYn=Y"
                    print(f"   🔗 요청 URL: {url}")
                    
                    response = self.session.get(url, timeout=30)
                    response.raise_for_status()
                    print(f"   ✅ HTTP 응답: {response.status_code}")
                    print(f"   📊 응답 크기: {len(response.content)} bytes")
                    
                    soup = BeautifulSoup(response.content, 'html.parser')
                    
                    # 리뷰 리스트 찾기 (더 정확한 선택자 사용)
                    review_container = soup.find('div', {'id': 'searchGoodsReviewList'}) or \
                                     soup.find('div', {'class': 'review-detail-lists'})
                    
                    review_list = None
                    if review_container:
                        review_list = review_container.find('ul')
                        print(f"   📝 컨테이너 내 ul 태그 발견: {review_list is not None}")
                    else:
                        # fallback: 일반적인 ul 태그
                        review_list = soup.find('ul')
                        print(f"   📝 fallback ul 태그 발견: {review_list is not None}")
                    
                    if not review_list:
                        print(f"   ❌ 페이지 {page}: 리뷰 리스트를 찾을 수 없음 - 크롤링 종료")
                        break
                    
                    # 각 리뷰 아이템 추출
                    review_items = review_list.find_all('li')
                    print(f"   📝 페이지 {page}: {len(review_items)}개 리뷰 아이템 발견")
                    
                    if not review_items:
                        print(f"   ✅ 페이지 {page}: 리뷰가 없음 - 모든 리뷰 수집 완료!")
                        break
                    
                    page_reviews = []
                    for idx, item in enumerate(review_items):
                        try:
                            review = {
                                'product_no': product_no,
                                'brand': brand,
                                'crawled_at': datetime.now().isoformat(),
                            }
                            
                            # 리뷰 ID와 시퀀스 (새로운 구조에 맞게)
                            review['review_id'] = item.get('id', '')
                            review['data_seq'] = item.get('data-seq', '')
                            review['data_godno'] = item.get('data-godno', '')  # 새로운 속성 추가
                            
                            # 구매 방식 (온라인/오프라인)
                            inflow_cd = item.get('data-inflow-ord-sect-cd', '')
                            review['purchase_type'] = 'online' if inflow_cd == 'ONLNE_ORD' else 'offline'
                            
                            # 디버깅: 첫 번째 리뷰 아이템의 상세 정보 출력
                            if idx == 0 and page == 1:
                                print(f"   🔍 첫 번째 리뷰 샘플:")
                                print(f"      ID: {review['review_id']}")
                                print(f"      Data-seq: {review['data_seq']}")
                                print(f"      Data-godno: {review['data_godno']}")
                                print(f"      Purchase type: {review['purchase_type']}")
                            
                            # 별점
                            rate_elem = item.find('span', class_='rate')
                            review['rating'] = self.extract_rating(rate_elem) if rate_elem else 0
                            
                            # 매장구매 여부
                            badge_elem = item.find('div', class_='badge')
                            review['is_store_purchase'] = badge_elem is not None
                            
                            # 구매 옵션
                            pick_opts_elem = item.find('div', class_='pick-opts')
                            if pick_opts_elem:
                                options = self.extract_review_options(pick_opts_elem)
                                review['color'] = options.get('color', '')
                                review['size'] = options.get('size', '')
                                review['usual_size'] = options.get('usual_size', '')
                                review['length'] = options.get('length', '')
                            else:
                                review['color'] = ''
                                review['size'] = ''
                                review['usual_size'] = ''
                                review['length'] = ''
                            
                            # 리뷰 내용
                            review_txts_elem = item.find('p', class_='review-txts')
                            if review_txts_elem:
                                review_text = review_txts_elem.get_text(strip=True)
                                # <br> 태그를 줄바꿈으로 변환
                                review_text = review_text.replace('\n', ' ').strip()
                                review['review_content'] = review_text
                            else:
                                review['review_content'] = ''
                            
                            # 구매자 ID
                            list_id_elem = item.find('span', class_='list-id')
                            review['reviewer_id'] = list_id_elem.get_text(strip=True) if list_id_elem else ''
                            
                            # 리뷰 날짜
                            list_date_elem = item.find('span', class_='list-date')
                            review['review_date'] = list_date_elem.get_text(strip=True) if list_date_elem else ''
                            
                            # 리뷰 이미지
                            review_photos_elem = item.find('div', class_='review-photos')
                            images = self.extract_review_images(review_photos_elem)
                            review['review_images'] = '|'.join(images) if images else ''
                            review['has_images'] = len(images) > 0
                            
                            page_reviews.append(review)
                            
                        except Exception as e:
                            print(f"   ⚠️ 리뷰 파싱 오류 (페이지 {page}, 아이템 {idx+1}): {e}")
                            continue
                    
                    all_reviews.extend(page_reviews)
                    print(f"   ✅ 페이지 {page}: {len(page_reviews)}개 리뷰 수집 완료")
                    
                    # 페이지 간 딜레이
                    time.sleep(0.5)
                    
                    # 수집된 리뷰가 없으면 종료
                    if not page_reviews:
                        print(f"   ✅ 페이지 {page}: 수집된 리뷰가 없음 - 모든 리뷰 수집 완료!")
                        break
                    
                    # 다음 페이지로
                    page += 1
                
                except Exception as e:
                    print(f"   ❌ 페이지 {page} 크롤링 오류: {e}")
                    # 에러가 나도 다음 페이지 시도
                    page += 1
                    continue
            
            if page > max_pages:
                print(f"   ⚠️ 안전장치 도달: {max_pages}페이지까지 크롤링 완료")
            
            print(f"🎉 상품 {product_no}: 총 {len(all_reviews)}개 리뷰 수집 완료 ({page-1}페이지까지 크롤링)")
            return all_reviews
            
        except Exception as e:
            print(f"❌ 상품 {product_no} 리뷰 조회 실패: {e}")
            return []
    
    def process_products(self, csv_file, limit=None, max_review_pages=50):
        """products.csv 파일을 읽어서 리뷰 수집"""
        try:
            # CSV 파일 읽기
            df = pd.read_csv(csv_file, encoding='utf-8')
            print(f"상품 데이터 로드: {len(df)} 개 상품")
            
            # 제한이 있으면 적용
            if limit:
                df = df.head(limit)
                print(f"테스트용으로 {limit}개 상품만 처리")
            
            total_count = len(df)
            total_reviews = 0
            
            for idx, row in df.iterrows():
                product_no = row.get('product_no', '')
                brand = row.get('brand', '')
                
                if not product_no:
                    print(f"행 {idx + 1}: 상품번호가 없음")
                    continue
                
                print(f"\n[{idx + 1}/{total_count}] {brand} - {product_no} 리뷰 수집 중...")
                
                # 리뷰 가져오기
                reviews = self.get_product_reviews(product_no, brand, max_review_pages)
                self.reviews.extend(reviews)
                total_reviews += len(reviews)
                
                # 배치 크기에 도달하면 중간저장
                if len(self.reviews) >= self.batch_save_size:
                    self.save_batch_reviews()
                
                # 상품 간 딜레이
                time.sleep(1.0)
                
                # 진행률 출력
                if (idx + 1) % 5 == 0:
                    print(f"📊 진행률: {idx + 1}/{total_count} (현재 배치: {len(self.reviews)}개, 총 저장: {self.total_saved_reviews}개)")
            
            # 마지막 배치 저장 (남은 리뷰가 있는 경우)
            if self.reviews:
                self.save_batch_reviews(force_save=True)
            
            # 최종 결과 처리
            if self.output_file:
                print(f"\n🎉 크롤링 완료!")
                print(f"총 상품: {total_count}개")
                print(f"총 리뷰: {self.total_saved_reviews}개")
                print(f"결과 파일: {self.output_file}")
                
                # 최종 파일 통계 출력
                final_file = self.merge_batch_files()
                
                if final_file:
                    # 최종 파일로 통계 출력
                    try:
                        final_df = pd.read_csv(final_file, encoding='utf-8-sig')
                        brand_counts = final_df['brand'].value_counts()
                        print(f"\n📈 브랜드별 리뷰 수:")
                        for brand, count in brand_counts.head(10).items():
                            print(f"  - {brand}: {count}개")
                    except Exception as e:
                        print(f"통계 출력 실패: {e}")
                        
            else:
                print("수집된 리뷰가 없습니다.")
            
        except Exception as e:
            print(f"처리 중 오류: {e}")
    
    def run(self, csv_file=None, limit=None, max_review_pages=50):
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
            
            pattern = "products*.csv"
            files = glob.glob(pattern)
            
            if not files:
                print("products*.csv 파일을 찾을 수 없습니다.")
                print("먼저 상품 리스트 크롤링을 실행하세요: python crawler.py")
                return
            
            # 가장 최신 파일 선택
            csv_file = max(files, key=os.path.getctime)
            print(f"최신 파일 선택: {csv_file}")
        
        # 리뷰 수집
        self.process_products(csv_file, limit, max_review_pages)


def main():
    csv_file = None
    limit = None
    max_review_pages = 100  # 안전장치: 최대 50페이지까지 (리뷰가 없으면 자동 중단)
    batch_save_size = 100  # 기본 배치 크기
    
    # 명령행 인수 처리
    if len(sys.argv) > 1:
        args = sys.argv[1:]
        
        i = 0
        while i < len(args):
            arg = args[i]
            
            if arg == '--batch' or arg == '-b':
                # 다음 인수가 배치 크기
                if i + 1 < len(args) and args[i + 1].isdigit():
                    batch_save_size = int(args[i + 1])
                    print(f"배치 저장 크기: {batch_save_size}개")
                    i += 1  # 다음 인수 건너뛰기
                i += 1
                continue
            elif arg.startswith('--batch='):
                batch_save_size = int(arg.split('=')[1])
                print(f"배치 저장 크기: {batch_save_size}개")
            elif arg.isdigit():
                # 숫자는 모두 상품 개수 제한으로 처리
                limit = int(arg)
                print(f"테스트 모드: {limit}개 상품만 처리")
            elif arg.endswith('.csv'):
                csv_file = arg
                print(f"지정된 파일: {csv_file}")
            
            i += 1
    
    # 크롤러 생성 (배치 크기 설정)
    crawler = ReviewCrawler(batch_save_size=batch_save_size)
    
    print(f"\n⚙️  설정:")
    print(f"   배치 저장 크기: {batch_save_size}개 리뷰마다 중간저장")
    print(f"   리뷰 크롤링: 리뷰가 없을 때까지 모든 페이지 수집 (최대 {max_review_pages}페이지 안전장치)")
    if limit:
        print(f"   테스트 모드: {limit}개 상품만 처리")
    print()
    
    crawler.run(csv_file, limit, max_review_pages)


if __name__ == "__main__":
    main() 