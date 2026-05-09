from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete, update

from app.core.db import get_db
from app.models.report import Report, TelemetryEvent

router = APIRouter()

@router.get("/")
async def list_reports(db: AsyncSession = Depends(get_db)):
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

@router.delete("/{thread_id}")
async def delete_report(thread_id: str, db: AsyncSession = Depends(get_db)):
    """Delete a single run and its telemetry from the database."""
    result = await db.execute(select(Report).where(Report.thread_id == thread_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    await db.execute(delete(TelemetryEvent).where(TelemetryEvent.thread_id == thread_id))
    await db.execute(delete(Report).where(Report.thread_id == thread_id))
    await db.commit()
    return {"status": "deleted", "thread_id": thread_id}

@router.post("/clear-stuck")
async def clear_stuck_runs(db: AsyncSession = Depends(get_db)):
    """Mark all RUNNING / PAUSED_FOR_HUMAN runs as FAILED so they clear from the UI."""
    await db.execute(
        update(Report)
        .where(Report.status.in_(["RUNNING", "PAUSED_FOR_HUMAN"]))
        .values(status="FAILED")
    )
    await db.commit()
    return {"status": "ok", "message": "Stuck runs marked as FAILED"}
