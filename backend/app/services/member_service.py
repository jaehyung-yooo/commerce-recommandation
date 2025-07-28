from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.schemas.member import Member
from loguru import logger


class MemberService:
    def __init__(self, db: Session):
        self.db = db

    def get_member_by_no(self, member_no: int) -> Optional[Member]:
        """member_no로 회원 정보 조회"""
        try:
            # MySQL에서 직접 조회 (SQLAlchemy 모델이 없으므로)
            query = """
            SELECT member_no, member_id, name, email, created_at, updated_at
            FROM members 
            WHERE member_no = %s
            """
            
            cursor = self.db.execute(query, (member_no,))
            result = cursor.fetchone()
            
            if result:
                return Member(
                    member_id=str(result.member_no),
                    name=result.name or f"회원{result.member_no}",
                    email=result.email,
                    created_at=result.created_at,
                    updated_at=result.updated_at
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting member {member_no}: {e}")
            return None

    def get_members_batch(self, member_nos: list[int]) -> Dict[int, Member]:
        """여러 회원 정보를 한 번에 조회"""
        try:
            if not member_nos:
                return {}
            
            # IN 절을 위한 플레이스홀더 생성
            placeholders = ','.join(['%s'] * len(member_nos))
            query = f"""
            SELECT member_no, member_id, name, email, created_at, updated_at
            FROM members 
            WHERE member_no IN ({placeholders})
            """
            
            cursor = self.db.execute(query, member_nos)
            results = cursor.fetchall()
            
            members = {}
            for result in results:
                members[result.member_no] = Member(
                    member_id=str(result.member_no),
                    name=result.name or f"회원{result.member_no}",
                    email=result.email,
                    created_at=result.created_at,
                    updated_at=result.updated_at
                )
            
            return members
            
        except Exception as e:
            logger.error(f"Error getting members batch: {e}")
            return {} 