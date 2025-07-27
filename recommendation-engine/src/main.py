from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Commerce Recommendation Engine",
    description="AI-powered product recommendation service",
    version="1.0.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Commerce Recommendation Engine is running!"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "recommendation-engine"}

@app.post("/recommendations/products/{user_id}")
async def get_product_recommendations(user_id: str, limit: int = 10):
    """Get product recommendations for a user"""
    # 기본 구현: 더미 데이터 반환
    return {
        "user_id": user_id,
        "recommendations": [],
        "limit": limit,
        "message": "Recommendation engine is under development"
    }

@app.post("/recommendations/similar/{product_id}")
async def get_similar_products(product_id: str, limit: int = 5):
    """Get similar products"""
    # 기본 구현: 더미 데이터 반환
    return {
        "product_id": product_id,
        "similar_products": [],
        "limit": limit,
        "message": "Similar products feature is under development"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001) 