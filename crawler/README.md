# 간단 크롤러

## 설치
```bash
pip install -r requirements.txt
```

## 📋 크롤러 종류

### 1. 상품 리스트 크롤러 (`crawler.py`)
카테고리별 상품 리스트를 크롤링합니다.

### 2. 상품 상세정보 크롤러 (`detail_crawler.py`)
상품 리스트 결과를 기반으로 각 상품의 상세 설명을 가져옵니다.

### 3. 상품 리뷰 크롤러 (`review_crawler.py`)
상품 리스트 결과를 기반으로 각 상품의 리뷰를 수집합니다.

## 🚀 사용법

### 1단계: 상품 리스트 크롤링

```bash
# 모든 브랜드 크롤링
python crawler.py

# 특정 브랜드만 크롤링
python crawler.py BEANPOLE 8seconds

# 특정 브랜드 + 페이지 수 지정
python crawler.py BEANPOLE 8seconds 5
```

**결과**: `products_날짜시간.csv` 파일 생성

### 2단계: 상품 상세정보 크롤링

```bash
# 최신 products_*.csv 파일 자동 선택
python detail_crawler.py

# 특정 파일 지정
python detail_crawler.py products_20241201_143022.csv

# 테스트용 (처음 10개만)
python detail_crawler.py 10

# 특정 파일 + 개수 제한
python detail_crawler.py products_20241201_143022.csv 20
```

**결과**: `products_detail_날짜시간.csv` 파일 생성

### 3단계: 상품 리뷰 크롤링

```bash
# 최신 products*.csv 파일 자동 선택, 리뷰 3페이지까지
python review_crawler.py

# 리뷰 5페이지까지 수집
python review_crawler.py 5

# 테스트용 (상품 20개만, 리뷰 2페이지까지)
python review_crawler.py 20 2

# 특정 파일 지정
python review_crawler.py products.csv 3
```

**결과**: `reviews_날짜시간.csv` 파일 생성

## 📊 수집되는 데이터

### 상품 리스트 (`products_*.csv`)
- **brand**: 브랜드명
- **category_1, 2, 3**: 카테고리명
- **category_code_1, 2, 3**: 카테고리 코드
- **product_no**: 상품번호
- **name**: 상품명
- **price**: 가격 (숫자)
- **price_text**: 가격 텍스트
- **image_url**: 상품 이미지
- **rating**: 별점
- **review_count**: 리뷰 개수
- **like_count**: 좋아요 개수
- **is_soldout**: 품절 여부
- **source_url**: 크롤링 URL
- **crawled_at**: 크롤링 시간

### 상품 상세정보 (`products_detail_*.csv`)
위 모든 컬럼 + **description**: 상품 상세 설명

### 상품 리뷰 (`reviews_*.csv`)
- **product_no**: 상품번호
- **brand**: 브랜드명
- **reviewer_id**: 구매자 ID (마스킹됨)
- **review_content**: 리뷰 내용
- **rating**: 별점 (1-5)
- **review_date**: 리뷰 작성일
- **purchase_type**: 구매방식 (online/offline)
- **is_store_purchase**: 매장구매 여부
- **color**: 구매한 색상
- **size**: 구매한 사이즈
- **usual_size**: 평소 사이즈
- **length**: 길이감
- **review_images**: 리뷰 이미지 URL (|로 구분)
- **has_images**: 이미지 첨부 여부
- **review_id**: 리뷰 고유 ID
- **data_seq**: 리뷰 시퀀스
- **crawled_at**: 크롤링 시간

## ⚠️ 주의사항

1. **요청 간격**: 서버 부하 방지를 위해 적절한 간격으로 요청합니다.
2. **순차 실행**: 상품 리스트 → 상세정보 → 리뷰 순서로 실행하세요.
3. **테스트**: 처음에는 소량으로 테스트 후 전체 실행을 권장합니다.
4. **리뷰 데이터**: 리뷰가 많은 상품은 시간이 오래 걸릴 수 있습니다.

## 🔧 수정 필요한 부분

실제 사이트 구조 변경시 다음 부분을 수정하세요:

### `crawler.py`
```python
# 상품 컨테이너
product_list = soup.find('ul', id='dspGood')
product_items = product_list.find_all('li', class_='god-item')
```

### `detail_crawler.py`
```python
# 상품 설명
desc_elem = soup.find('p', class_='about-desc')
```

### `review_crawler.py`
```python
# 리뷰 리스트
review_list = soup.find('ul')
review_items = review_list.find_all('li')

# 구매자 ID
list_id_elem = item.find('span', class_='list-id')

# 리뷰 내용
review_txts_elem = item.find('p', class_='review-txts')
``` 