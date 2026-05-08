"""
report_generator.py — AgentRX Report Generator Agent

Responsibilities:
  1. Generate a polished executive summary using Gemini (LLM synthesis of all 4 stages).
  2. Combine all incremental stage narratives from state["narrative"] into a
     single structured PDF using ReportLab.
  3. Save the PDF to backend/reports/<thread_id>.pdf and optionally upload to MinIO/S3.
  4. Return {"report_local_path": ..., "report_url": ...} for the API response.

PDF Structure:
  - Cover Page: Molecule name, generated-on date, AgentRX branding
  - Section 1: Drug Repurposing Discovery (PubMed findings + candidate list)
  - Section 2: IP Whitespace Analysis (FTO table per candidate)
  - Section 3: Commercial Viability (TAM, trial complexity, competitors, VC thesis)
  - Section 4: IQVIA / EXIM Supply Chain Intelligence
  - Appendix: Pipeline Metadata (stages, timing, data sources)
"""

import asyncio
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from langchain_google_genai import ChatGoogleGenerativeAI

from app.agents.base import BaseAgent
from app.core.config import settings

# ---------------------------------------------------------------------------
# ReportLab imports — guarded so the app still boots if reportlab is missing
# ---------------------------------------------------------------------------
try:
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm, mm
    from reportlab.platypus import (
        HRFlowable,
        Image,
        PageBreak,
        Paragraph,
        SimpleDocTemplate,
        Spacer,
        Table,
        TableStyle,
    )
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False
    print("[ReportGeneratorAgent | WARNING] reportlab not installed. PDF generation disabled.")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

REPORTS_DIR = Path(__file__).parent.parent.parent / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Brand palette
COLOR_NAVY   = colors.HexColor("#0D1B2A")   # type: ignore[attr-defined]
COLOR_TEAL   = colors.HexColor("#00B4D8")   # type: ignore[attr-defined]
COLOR_LIGHT  = colors.HexColor("#E8F4FD")   # type: ignore[attr-defined]
COLOR_WHITE  = colors.white                  # type: ignore[attr-defined]
COLOR_GRAY   = colors.HexColor("#6C757D")   # type: ignore[attr-defined]
COLOR_GREEN  = colors.HexColor("#28A745")   # type: ignore[attr-defined]
COLOR_RED    = colors.HexColor("#DC3545")   # type: ignore[attr-defined]
COLOR_AMBER  = colors.HexColor("#FFC107")   # type: ignore[attr-defined]


# ---------------------------------------------------------------------------
# Style helpers
# ---------------------------------------------------------------------------

def _build_styles():
    """Build a custom style sheet for AgentRX reports."""
    base = getSampleStyleSheet()

    styles = {
        "cover_title": ParagraphStyle(
            "CoverTitle",
            parent=base["Title"],
            fontSize=32,
            textColor=COLOR_WHITE,
            spaceAfter=8,
            alignment=TA_CENTER,
            fontName="Helvetica-Bold",
        ),
        "cover_sub": ParagraphStyle(
            "CoverSub",
            parent=base["Normal"],
            fontSize=14,
            textColor=COLOR_TEAL,
            spaceAfter=4,
            alignment=TA_CENTER,
            fontName="Helvetica",
        ),
        "cover_meta": ParagraphStyle(
            "CoverMeta",
            parent=base["Normal"],
            fontSize=10,
            textColor=COLOR_GRAY,
            spaceAfter=2,
            alignment=TA_CENTER,
            fontName="Helvetica",
        ),
        "section_header": ParagraphStyle(
            "SectionHeader",
            parent=base["Heading1"],
            fontSize=16,
            textColor=COLOR_NAVY,
            spaceBefore=14,
            spaceAfter=6,
            fontName="Helvetica-Bold",
            borderPad=4,
        ),
        "subsection_header": ParagraphStyle(
            "SubsectionHeader",
            parent=base["Heading2"],
            fontSize=12,
            textColor=COLOR_TEAL,
            spaceBefore=10,
            spaceAfter=4,
            fontName="Helvetica-Bold",
        ),
        "body": ParagraphStyle(
            "BodyText",
            parent=base["Normal"],
            fontSize=10,
            textColor=COLOR_NAVY,
            spaceAfter=6,
            leading=14,
            fontName="Helvetica",
        ),
        "caption": ParagraphStyle(
            "Caption",
            parent=base["Normal"],
            fontSize=8,
            textColor=COLOR_GRAY,
            spaceAfter=4,
            alignment=TA_CENTER,
            fontName="Helvetica-Oblique",
        ),
        "table_header": ParagraphStyle(
            "TableHeader",
            parent=base["Normal"],
            fontSize=9,
            textColor=COLOR_WHITE,
            fontName="Helvetica-Bold",
            alignment=TA_CENTER,
        ),
        "table_cell": ParagraphStyle(
            "TableCell",
            parent=base["Normal"],
            fontSize=8,
            textColor=COLOR_NAVY,
            fontName="Helvetica",
            leading=12,
        ),
        "footer": ParagraphStyle(
            "Footer",
            parent=base["Normal"],
            fontSize=7,
            textColor=COLOR_GRAY,
            alignment=TA_CENTER,
            fontName="Helvetica",
        ),
    }
    return styles


# ---------------------------------------------------------------------------
# PDF Builder
# ---------------------------------------------------------------------------

class PDFReportBuilder:
    """
    Builds the AgentRX intelligence report PDF.
    Call build() to get the output path.
    """

    def __init__(
        self,
        thread_id: str,
        molecule: str,
        narrative: Dict[str, str],
        ip_cleared_diseases: List[Dict[str, Any]],
        commercial_data: List[Dict[str, Any]],
        supply_chain_data: Dict[str, Any],
    ):
        self.thread_id = thread_id
        self.molecule = molecule
        self.narrative = narrative
        self.ip_cleared = ip_cleared_diseases
        self.commercial = commercial_data
        self.supply_chain = supply_chain_data
        self.generated_at = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        self.styles = _build_styles()
        self.output_path = REPORTS_DIR / f"{thread_id}.pdf"

    # ------------------------------------------------------------------
    # Page callbacks (header / footer)
    # ------------------------------------------------------------------

    def _on_page(self, canvas, doc):
        canvas.saveState()
        # Top bar
        canvas.setFillColor(COLOR_NAVY)
        canvas.rect(0, A4[1] - 25 * mm, A4[0], 25 * mm, fill=1, stroke=0)
        canvas.setFont("Helvetica-Bold", 9)
        canvas.setFillColor(COLOR_WHITE)
        canvas.drawString(20 * mm, A4[1] - 16 * mm, "AgentRX Intelligence Platform")
        canvas.setFont("Helvetica", 9)
        canvas.drawRightString(A4[0] - 20 * mm, A4[1] - 16 * mm,
                               f"Molecule: {self.molecule}  |  Generated: {self.generated_at}")
        # Bottom bar
        canvas.setFillColor(COLOR_NAVY)
        canvas.rect(0, 0, A4[0], 12 * mm, fill=1, stroke=0)
        canvas.setFont("Helvetica", 7)
        canvas.setFillColor(COLOR_GRAY)
        canvas.drawCentredString(
            A4[0] / 2, 4 * mm,
            f"AgentRX Confidential — Decision Intelligence Report — Page {doc.page}"
        )
        canvas.restoreState()

    def _on_cover_page(self, canvas, doc):
        # Full navy background on cover
        canvas.saveState()
        canvas.setFillColor(COLOR_NAVY)
        canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
        # Teal accent bar at bottom
        canvas.setFillColor(COLOR_TEAL)
        canvas.rect(0, 0, A4[0], 8 * mm, fill=1, stroke=0)
        canvas.restoreState()

    # ------------------------------------------------------------------
    # Cover page
    # ------------------------------------------------------------------

    def _build_cover(self) -> List[Any]:
        s = self.styles
        elements: List[Any] = []

        elements.append(Spacer(1, 60 * mm))
        elements.append(Paragraph("AgentRX", s["cover_title"]))
        elements.append(Paragraph("Intelligence Report", s["cover_sub"]))
        elements.append(Spacer(1, 8 * mm))
        elements.append(HRFlowable(width="60%", thickness=1, color=COLOR_TEAL, spaceAfter=6))
        elements.append(Paragraph(f"Target Molecule: <b>{self.molecule}</b>", s["cover_sub"]))
        elements.append(Spacer(1, 6 * mm))
        elements.append(Paragraph(f"Generated: {self.generated_at}", s["cover_meta"]))
        elements.append(Paragraph(f"Thread ID: {self.thread_id}", s["cover_meta"]))
        elements.append(Spacer(1, 10 * mm))
        elements.append(Paragraph(
            "Mechanism-to-Market (M2M) Pipeline — Powered by Multi-Agent AI Orchestration",
            s["cover_meta"]
        ))
        elements.append(PageBreak())
        return elements

    # ------------------------------------------------------------------
    # Section 1: Discovery
    # ------------------------------------------------------------------

    def _build_discovery(self) -> List[Any]:
        s = self.styles
        elements: List[Any] = []

        elements.append(Paragraph("1. Drug Repurposing Discovery", s["section_header"]))
        elements.append(HRFlowable(width="100%", thickness=1, color=COLOR_TEAL, spaceAfter=4))

        narrative = self.narrative.get("discovery", "No discovery narrative available.")
        elements.append(Paragraph(narrative, s["body"]))
        elements.append(Spacer(1, 4 * mm))

        if self.ip_cleared:
            elements.append(Paragraph("IP-Cleared Candidates", s["subsection_header"]))

            table_data = [[
                Paragraph("Indication", s["table_header"]),
                Paragraph("Pathway Score", s["table_header"]),
                Paragraph("FTO Status", s["table_header"]),
                Paragraph("Blocking Patents", s["table_header"]),
            ]]

            for c in self.ip_cleared:
                fto = c.get("fto_status", "—")
                fto_color = COLOR_GREEN if fto == "CLEAR" else COLOR_RED
                table_data.append([
                    Paragraph(c.get("disease_name", "—"), s["table_cell"]),
                    Paragraph(f"{c.get('pathway_overlap_score', 0.0):.2f}", s["table_cell"]),
                    Paragraph(f'<font color="#{fto_color.hexval()[2:]}">{fto}</font>', s["table_cell"]),
                    Paragraph(str(c.get("blocking_patents", 0)), s["table_cell"]),
                ])

            t = Table(table_data, colWidths=[7 * cm, 3 * cm, 3 * cm, 3 * cm])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), COLOR_NAVY),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [COLOR_WHITE, COLOR_LIGHT]),
                ("GRID", (0, 0), (-1, -1), 0.5, COLOR_GRAY),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            elements.append(t)

        return elements

    # ------------------------------------------------------------------
    # Section 2: IP Analysis
    # ------------------------------------------------------------------

    def _build_ip_analysis(self) -> List[Any]:
        s = self.styles
        elements: List[Any] = []

        elements.append(Spacer(1, 6 * mm))
        elements.append(Paragraph("2. IP Whitespace Analysis", s["section_header"]))
        elements.append(HRFlowable(width="100%", thickness=1, color=COLOR_TEAL, spaceAfter=4))

        narrative = self.narrative.get("ip_analysis", "No IP analysis narrative available.")
        elements.append(Paragraph(narrative, s["body"]))

        return elements

    # ------------------------------------------------------------------
    # Section 3: Commercial Viability
    # ------------------------------------------------------------------

    def _build_commercial(self) -> List[Any]:
        s = self.styles
        elements: List[Any] = []

        elements.append(Spacer(1, 6 * mm))
        elements.append(Paragraph("3. Commercial Viability Assessment", s["section_header"]))
        elements.append(HRFlowable(width="100%", thickness=1, color=COLOR_TEAL, spaceAfter=4))

        narrative = self.narrative.get("commercial", "No commercial narrative available.")
        elements.append(Paragraph(narrative, s["body"]))
        elements.append(Spacer(1, 4 * mm))

        if self.commercial:
            table_data = [[
                Paragraph("Indication", s["table_header"]),
                Paragraph("TAM Estimate", s["table_header"]),
                Paragraph("Trial Complexity", s["table_header"]),
                Paragraph("VC Recommendation", s["table_header"]),
            ]]

            for c in self.commercial:
                complexity = c.get("trial_complexity", "—")
                complexity_color = (
                    COLOR_RED if complexity == "High"
                    else COLOR_AMBER if complexity == "Medium"
                    else COLOR_GREEN
                )
                table_data.append([
                    Paragraph(c.get("disease_name", "—"), s["table_cell"]),
                    Paragraph(c.get("tam_estimate", "—"), s["table_cell"]),
                    Paragraph(
                        f'<font color="#{complexity_color.hexval()[2:]}">{complexity}</font>',
                        s["table_cell"]
                    ),
                    Paragraph(c.get("recommendation", "—")[:120] + "...", s["table_cell"]),
                ])

            t = Table(
                table_data,
                colWidths=[4.5 * cm, 3.5 * cm, 3.5 * cm, 5.5 * cm],
            )
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), COLOR_NAVY),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [COLOR_WHITE, COLOR_LIGHT]),
                ("GRID", (0, 0), (-1, -1), 0.5, COLOR_GRAY),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            elements.append(t)

        return elements

    # ------------------------------------------------------------------
    # Section 4: Supply Chain
    # ------------------------------------------------------------------

    def _build_supply_chain(self) -> List[Any]:
        s = self.styles
        elements: List[Any] = []

        elements.append(Spacer(1, 6 * mm))
        elements.append(Paragraph("4. IQVIA / EXIM Supply Chain Intelligence", s["section_header"]))
        elements.append(HRFlowable(width="100%", thickness=1, color=COLOR_TEAL, spaceAfter=4))

        narrative = self.narrative.get("supply_chain", "No supply chain narrative available.")
        elements.append(Paragraph(narrative, s["body"]))
        elements.append(Spacer(1, 4 * mm))

        sc = self.supply_chain
        if sc:
            kv_data = [
                ["Metric", "Value"],
                ["API Availability", sc.get("api_availability", "—")],
                ["Supply Chain Risk", sc.get("supply_chain_risk", "—")],
                ["Repurposing Score", str(sc.get("repurposing_score", "—"))],
                ["Market Trend", sc.get("market_trend", "—")],
                ["Clinical Pipeline", sc.get("clinical_pipeline_status", "—")],
                ["Top Exporters", ", ".join(sc.get("top_exporting_countries", []))],
            ]

            t = Table(kv_data, colWidths=[6 * cm, 11 * cm])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), COLOR_NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), COLOR_WHITE),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 9),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [COLOR_WHITE, COLOR_LIGHT]),
                ("GRID", (0, 0), (-1, -1), 0.5, COLOR_GRAY),
                ("FONTSIZE", (0, 1), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            elements.append(t)

        return elements

    # ------------------------------------------------------------------
    # Section 5: Executive Summary
    # ------------------------------------------------------------------

    def _build_executive_summary(self) -> List[Any]:
        s = self.styles
        elements: List[Any] = []

        elements.append(PageBreak())
        elements.append(Paragraph("Executive Summary", s["section_header"]))
        elements.append(HRFlowable(width="100%", thickness=2, color=COLOR_TEAL, spaceAfter=6))

        summary = self.narrative.get("executive_summary", "Executive summary not available.")
        elements.append(Paragraph(summary, s["body"]))

        return elements

    # ------------------------------------------------------------------
    # Build the full PDF
    # ------------------------------------------------------------------

    def build(self) -> str:
        """Render the full report to disk. Returns the absolute path string."""
        if not REPORTLAB_AVAILABLE:
            raise RuntimeError("reportlab is not installed. Run: pip install reportlab")

        doc = SimpleDocTemplate(
            str(self.output_path),
            pagesize=A4,
            rightMargin=20 * mm,
            leftMargin=20 * mm,
            topMargin=30 * mm,
            bottomMargin=20 * mm,
            title=f"AgentRX Report — {self.molecule}",
            author="AgentRX Intelligence Platform",
        )

        # Assemble all sections
        story: List[Any] = []
        story += self._build_cover()
        story += self._build_executive_summary()
        story += self._build_discovery()
        story += self._build_ip_analysis()
        story += self._build_commercial()
        story += self._build_supply_chain()

        # Build with page callbacks
        # Cover page gets navy background; rest get branded header/footer
        def _on_page_dispatch(canvas, doc):
            if doc.page == 1:
                self._on_cover_page(canvas, doc)
            else:
                self._on_page(canvas, doc)

        doc.build(story, onFirstPage=_on_page_dispatch, onLaterPages=self._on_page)
        return str(self.output_path)


# ---------------------------------------------------------------------------
# Report Generator Agent
# ---------------------------------------------------------------------------

class ReportGeneratorAgent(BaseAgent):
    """
    Final pipeline agent. Consumes the complete AgentRXState and:
      1. Uses Gemini to write an executive summary synthesising all 4 stage narratives.
      2. Renders the full branded PDF via PDFReportBuilder.
      3. Returns {"report_local_path": ..., "report_url": ...}.
    """

    def __init__(self):
        super().__init__("Report Generator", "Intelligence Synthesist", 0.1)
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            temperature=0.3,
            api_key=settings.GOOGLE_API_KEY,
        )

    async def _generate_executive_summary(
        self,
        molecule: str,
        narrative: Dict[str, str],
        commercial_data: List[Dict[str, Any]],
        supply_chain: Dict[str, Any],
    ) -> str:
        """Ask Gemini to write a crisp C-suite-ready executive summary."""
        candidate_names = [c.get("disease_name", "") for c in commercial_data]
        prompt = f"""
You are the Chief Medical Officer of a biotech VC fund writing a 150-word executive summary for a drug repurposing intelligence report.

Molecule: {molecule}
Top Repurposing Candidates (post IP clearance): {", ".join(candidate_names) or "None identified"}
Supply Chain Risk: {supply_chain.get("supply_chain_risk", "Unknown")}
Repurposing Opportunity Score: {supply_chain.get("repurposing_score", "N/A")}
Market Trend: {supply_chain.get("market_trend", "Unknown")}

Discovery Narrative Summary:
{narrative.get("discovery", "")[:300]}

Commercial Narrative Summary:
{narrative.get("commercial", "")[:300]}

Write a formal, precise 3-paragraph executive summary (150 words max). Focus on:
1. The molecule's repurposing opportunity
2. The strongest commercial candidate and why
3. Supply chain readiness and recommended next steps

Do not use bullet points. Write in continuous prose.
        """
        try:
            response = await self.llm.ainvoke(prompt)
            return response.content.strip()
        except Exception as e:
            self.log_status("warning", f"Executive summary LLM call failed: {e}")
            return (
                f"{molecule} has been analysed across {len(commercial_data)} indication(s) following "
                f"IP clearance. The pipeline identified commercially actionable opportunities with "
                f"a repurposing score of {supply_chain.get('repurposing_score', 'N/A')}. "
                f"Refer to individual sections for detailed findings."
            )

    async def _run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        molecule = input_data.get("molecule", "Unknown")
        thread_id = input_data.get("thread_id", "unknown")
        narrative = input_data.get("narrative", {})
        ip_cleared = input_data.get("ip_cleared_diseases", [])
        commercial = input_data.get("commercial_data", [])
        supply_chain = input_data.get("supply_chain_data", {})

        self.log_status("running", f"Generating intelligence report for {molecule}...")

        # 1. LLM-powered executive summary
        self.log_status("running", "Asking Gemini to synthesise executive summary...")
        exec_summary = await self._generate_executive_summary(
            molecule, narrative, commercial, supply_chain
        )
        narrative["executive_summary"] = exec_summary

        # 2. Render PDF
        self.log_status("running", "Rendering PDF with ReportLab...")
        builder = PDFReportBuilder(
            thread_id=thread_id,
            molecule=molecule,
            narrative=narrative,
            ip_cleared_diseases=ip_cleared,
            commercial_data=commercial,
            supply_chain_data=supply_chain,
        )
        pdf_path = builder.build()
        self.log_status("done", f"PDF saved: {pdf_path}")

        # 3. Return URLs (local path for now; MinIO hook can be added here)
        report_urls = {
            "local": pdf_path,
            "download_path": f"/api/pipeline/report/{thread_id}",
        }

        return {
            "narrative": narrative,
            "report_urls": report_urls,
        }
