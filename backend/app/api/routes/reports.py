from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.db import get_db
from app.models.report import Report, TelemetryEvent

router = APIRouter()

@router.get("/")
async def list_reports(db: AsyncSession = Depends(get_db)):
    """
    Fetch all reports for the UI dashboard sidebar.
    Returns basic metadata (molecule, status, date).
    """
    result = await db.execute(select(Report).order_by(Report.created_at.desc()))
    reports = result.scalars().all()
    
    return [
        {
            "id": r.id,
            "thread_id": r.thread_id,
            "molecule": r.molecule,
            "status": r.status,
            "created_at": r.created_at.isoformat()
        }
        for r in reports
    ]

@router.get("/{thread_id}")
async def get_report(thread_id: str, db: AsyncSession = Depends(get_db)):
    """
    Fetch the detailed insights and status for a specific report.
    Used to populate the 'Opportunity Insights' and final summary view.
    """
    result = await db.execute(select(Report).where(Report.thread_id == thread_id))
    report = result.scalar_one_or_none()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    return {
        "id": report.id,
        "thread_id": report.thread_id,
        "molecule": report.molecule,
        "status": report.status,
        "insights": report.insights,
        "pdf_path": report.pdf_path,
        "created_at": report.created_at.isoformat()
    }
