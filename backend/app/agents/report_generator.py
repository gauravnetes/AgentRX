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
from app.agents import visualizations

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
        KeepTogether,
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

# Strict black & white palette
COLOR_BLACK  = colors.HexColor("#000000")
COLOR_DARK   = colors.HexColor("#1A1A1A")
COLOR_MID    = colors.HexColor("#555555")
COLOR_GRAY   = colors.HexColor("#888888")
COLOR_LGRAY  = colors.HexColor("#CCCCCC")
COLOR_OFFWHT = colors.HexColor("#F5F5F5")
COLOR_WHITE  = colors.white

# Backwards compat aliases used in FTO status colouring
COLOR_PRIMARY = COLOR_DARK
COLOR_LIGHT   = COLOR_OFFWHT
COLOR_GREEN   = COLOR_DARK    # keep CLEAR badge dark
COLOR_RED     = COLOR_MID     # keep BLOCKED badge mid-gray
COLOR_AMBER   = COLOR_MID


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
            fontSize=36,
            textColor=COLOR_DARK,
            spaceAfter=12,
            alignment=TA_LEFT,
            fontName="Helvetica-Bold",
            leading=42,
        ),
        "cover_sub": ParagraphStyle(
            "CoverSub",
            parent=base["Normal"],
            fontSize=16,
            textColor=COLOR_PRIMARY,
            spaceAfter=8,
            alignment=TA_LEFT,
            fontName="Helvetica",
        ),
        "cover_meta": ParagraphStyle(
            "CoverMeta",
            parent=base["Normal"],
            fontSize=10,
            textColor=COLOR_GRAY,
            spaceAfter=4,
            alignment=TA_LEFT,
            fontName="Helvetica",
            leading=14,
        ),
        "section_header": ParagraphStyle(
            "SectionHeader",
            parent=base["Heading1"],
            fontSize=18,
            textColor=COLOR_DARK,
            spaceBefore=20,
            spaceAfter=8,
            fontName="Helvetica-Bold",
        ),
        "subsection_header": ParagraphStyle(
            "SubsectionHeader",
            parent=base["Heading2"],
            fontSize=14,
            textColor=COLOR_PRIMARY,
            spaceBefore=12,
            spaceAfter=6,
            fontName="Helvetica-Bold",
        ),
        "body": ParagraphStyle(
            "BodyText",
            parent=base["Normal"],
            fontSize=10,
            textColor=COLOR_DARK,
            spaceAfter=8,
            leading=16,
            fontName="Helvetica",
        ),
        "caption": ParagraphStyle(
            "Caption",
            parent=base["Normal"],
            fontSize=8,
            textColor=COLOR_GRAY,
            spaceAfter=6,
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
            fontSize=9,
            textColor=COLOR_DARK,
            fontName="Helvetica",
            leading=13,
            wordWrap="CJK",
        ),
        "badge": ParagraphStyle(
            "Badge",
            parent=base["Normal"],
            fontSize=11,
            textColor=COLOR_DARK,
            fontName="Helvetica-Bold",
            alignment=TA_CENTER,
        ),
        "citation_link": ParagraphStyle(
            "CitationLink",
            parent=base["Normal"],
            fontSize=9,
            textColor=COLOR_MID,
            fontName="Helvetica",
            leading=14,
            spaceAfter=2,
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
        merged_diseases: List[Dict[str, Any]],
        synonyms: str = "",
    ):
        self.thread_id = thread_id
        self.molecule = molecule
        self.synonyms = synonyms
        self.narrative = narrative
        self.ip_cleared = ip_cleared_diseases
        self.merged_diseases = merged_diseases
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
        canvas.setFillColor(COLOR_PRIMARY)
        canvas.rect(0, A4[1] - 20 * mm, A4[0], 20 * mm, fill=1, stroke=0)
        canvas.setFont("Helvetica-Bold", 10)
        canvas.setFillColor(COLOR_WHITE)
        canvas.drawString(20 * mm, A4[1] - 12 * mm, "AgentRX Intelligence Platform")
        canvas.setFont("Helvetica", 9)
        canvas.drawRightString(A4[0] - 20 * mm, A4[1] - 12 * mm,
                               f"Molecule: {self.molecule}  |  Generated: {self.generated_at}")
        
        # Bottom bar
        canvas.setFillColor(COLOR_DARK)
        canvas.rect(0, 0, A4[0], 12 * mm, fill=1, stroke=0)
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(COLOR_GRAY)
        canvas.drawCentredString(
            A4[0] / 2, 4 * mm,
            f"AgentRX Confidential — Decision Intelligence Report — Page {doc.page}"
        )
        canvas.restoreState()

    def _on_cover_page(self, canvas, doc):
        # Stark white background on cover
        canvas.saveState()
        canvas.setFillColor(COLOR_WHITE)
        canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
        
        # Deep charcoal accent bar at bottom
        canvas.setFillColor(COLOR_DARK)
        canvas.rect(0, 0, A4[0], 12 * mm, fill=1, stroke=0)
        canvas.restoreState()

    # ------------------------------------------------------------------
    # Cover page
    # ------------------------------------------------------------------

    def _build_cover(self) -> List[Any]:
        s = self.styles
        elements: List[Any] = []

        elements.append(Spacer(1, 80 * mm))
        elements.append(Paragraph("DECISION INTELLIGENCE REPORT", s["cover_sub"]))
        elements.append(HRFlowable(width="100%", thickness=2, color=COLOR_DARK, spaceAfter=8))
        elements.append(Paragraph(f"Target Molecule:<br/>{self.molecule.upper()}", s["cover_title"]))
        
        if self.synonyms and self.synonyms != self.molecule:
            elements.append(Paragraph(f"<b>Also Known As:</b> {self.synonyms}", s["cover_sub"]))
            
        elements.append(Spacer(1, 10 * mm))
        elements.append(Spacer(1, 15 * mm))
        elements.append(Paragraph(f"<b>Date:</b> {self.generated_at}", s["cover_meta"]))
        elements.append(Paragraph(f"<b>Thread ID:</b> {self.thread_id}", s["cover_meta"]))
        elements.append(Paragraph("<b>System:</b> AgentRX Multi-Agent M2M Orchestrator", s["cover_meta"]))
        
        elements.append(PageBreak())
        return elements

    # ------------------------------------------------------------------
    # Visual Dashboard Page
    # ------------------------------------------------------------------

    def _build_dashboard(self) -> List[Any]:
        s = self.styles
        elements: List[Any] = []

        elements.append(Paragraph("Visual Intelligence Dashboard", s["section_header"]))
        elements.append(HRFlowable(width="100%", thickness=1, color=COLOR_DARK, spaceAfter=8))

        # --- Row 1: Donut (left) + FTO badge (right) in a 2-col borderless table ---
        score_val = 0.0
        try:
            score_val = float(self.supply_chain.get("repurposing_score", 0.0))
        except (TypeError, ValueError):
            pass
        donut_buf = visualizations.generate_repurposing_score_donut(score_val)
        n_cleared = len(self.ip_cleared)
        n_total = len(self.merged_diseases)
        fto_text = f"{n_cleared}/{n_total} Cleared"

        if donut_buf:
            donut_img = Image(donut_buf, width=6 * cm, height=6 * cm)
            badge_para = Paragraph(
                f"<b>FTO Status</b><br/>{fto_text}<br/><br/>"
                f"<b>Supply Risk</b><br/>{self.supply_chain.get('supply_chain_risk', 'N/A')}",
                s["badge"]
            )
            row1 = Table([[donut_img, badge_para]], colWidths=[8 * cm, 9 * cm])
            row1.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("ALIGN", (1, 0), (1, 0), "CENTER")]))
            elements.append(KeepTogether([row1, Spacer(1, 6 * mm)]))

        # --- Row 2: Pathway Overlap chart ---
        overlap_buf = visualizations.generate_pathway_overlap_chart(self.ip_cleared)
        if overlap_buf:
            img = Image(overlap_buf, width=14 * cm, height=5.5 * cm)
            elements.append(KeepTogether([
                Paragraph("Pathway Overlap Scores", s["subsection_header"]),
                img, Spacer(1, 4 * mm)
            ]))

        # --- Row 3: TAM chart ---
        tam_buf = visualizations.generate_tam_chart(self.commercial)
        if tam_buf:
            img = Image(tam_buf, width=14 * cm, height=5.5 * cm)
            elements.append(KeepTogether([
                Paragraph("Total Addressable Market Estimates", s["subsection_header"]),
                img
            ]))

        elements.append(PageBreak())
        return elements

    # ------------------------------------------------------------------
    # Section 1: Discovery
    # ------------------------------------------------------------------

    def _build_discovery(self) -> List[Any]:
        s = self.styles
        elements: List[Any] = []

        elements.append(Paragraph("1. Drug Repurposing Discovery", s["section_header"]))
        elements.append(HRFlowable(width="100%", thickness=1, color=COLOR_DARK, spaceAfter=8))

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
                fto = c.get("fto_status", "UNKNOWN")
                table_data.append([
                    Paragraph(c.get("disease_name", "—"), s["table_cell"]),
                    Paragraph(f"{c.get('pathway_overlap_score', 0.0):.2f}", s["table_cell"]),
                    Paragraph(fto, s["table_cell"]),
                    Paragraph(str(c.get("blocking_patents", 0)), s["table_cell"]),
                ])

            t = Table(table_data, colWidths=[7 * cm, 3 * cm, 3 * cm, 4 * cm])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), COLOR_DARK),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [COLOR_WHITE, COLOR_OFFWHT]),
                ("GRID", (0, 0), (-1, -1), 0.5, COLOR_LGRAY),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (1, 0), (-1, -1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            elements.append(KeepTogether([
                Paragraph("IP-Cleared Candidates", s["subsection_header"]),
                t
            ]))
            
            # --- Mentor Polish: Add Clickable Citations ---
            elements.append(Spacer(1, 6 * mm))
            elements.append(Paragraph("Key References (PubMed)", s["subsection_header"]))
            
            import re
            has_citations = False
            for c in self.merged_diseases:
                disease = c.get("disease_name", "Unknown")
                citations = c.get("citations", [])
                if citations:
                    links = []
                    for cite in citations:
                        match = re.search(r'\d+', str(cite))
                        if match:
                            pmid = match.group(0)
                            links.append(f'<link href="https://pubmed.ncbi.nlm.nih.gov/{pmid}/" color="blue">PMID: {pmid}</link>')
                    
                    if links:
                        link_str = ", ".join(links)
                        elements.append(Paragraph(f"<b>{disease}:</b> {link_str}", s["body"]))
                        has_citations = True
                        
            if not has_citations:
                elements.append(Paragraph("No direct PubMed citations were extracted for these candidates.", s["body"]))

        return elements

    # ------------------------------------------------------------------
    # Section 2: IP Analysis
    # ------------------------------------------------------------------

    def _build_ip_analysis(self) -> List[Any]:
        s = self.styles
        elements: List[Any] = []

        elements.append(PageBreak())
        elements.append(Paragraph("2. IP Whitespace Analysis", s["section_header"]))
        elements.append(HRFlowable(width="100%", thickness=1, color=COLOR_DARK, spaceAfter=8))

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
        elements.append(HRFlowable(width="100%", thickness=1, color=COLOR_DARK, spaceAfter=8))

        narrative = self.narrative.get("commercial", "No commercial narrative available.")
        elements.append(Paragraph(narrative, s["body"]))
        elements.append(Spacer(1, 4 * mm))

        if self.commercial:
            table_data = [[
                Paragraph("Indication", s["table_header"]),
                Paragraph("TAM Estimate", s["table_header"]),
                Paragraph("Complexity", s["table_header"]),
                Paragraph("VC Recommendation", s["table_header"]),
            ]]

            for c in self.commercial:
                table_data.append([
                    Paragraph(c.get("disease_name", "—"), s["table_cell"]),
                    Paragraph(c.get("tam_estimate", "—"), s["table_cell"]),
                    Paragraph(str(c.get("trial_complexity", "—")), s["table_cell"]),
                    Paragraph(c.get("recommendation", "—"), s["table_cell"]),
                ])

            t = Table(table_data, colWidths=[3.5 * cm, 3 * cm, 2.5 * cm, 8 * cm])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), COLOR_DARK),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [COLOR_WHITE, COLOR_OFFWHT]),
                ("GRID", (0, 0), (-1, -1), 0.5, COLOR_LGRAY),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            elements.append(KeepTogether(t))

        return elements

    # ------------------------------------------------------------------
    # Section 4: Supply Chain
    # ------------------------------------------------------------------

    def _build_supply_chain(self) -> List[Any]:
        s = self.styles
        elements: List[Any] = []

        elements.append(Spacer(1, 6 * mm))
        elements.append(Paragraph("4. IQVIA Supply Chain Intelligence", s["section_header"]))
        elements.append(HRFlowable(width="100%", thickness=1, color=COLOR_DARK, spaceAfter=8))

        narrative = self.narrative.get("supply_chain", "No supply chain narrative available.")
        elements.append(Paragraph(narrative, s["body"]))
        elements.append(Spacer(1, 4 * mm))

        sc = self.supply_chain
        if sc:
            kv_data = [
                [Paragraph("Metric", s["table_header"]), Paragraph("Value", s["table_header"])],
                [Paragraph("API Availability", s["table_cell"]), Paragraph(sc.get("api_availability", "—"), s["table_cell"])],
                [Paragraph("Supply Chain Risk", s["table_cell"]), Paragraph(sc.get("supply_chain_risk", "—"), s["table_cell"])],
                [Paragraph("Repurposing Score", s["table_cell"]), Paragraph(str(sc.get("repurposing_score", "—")), s["table_cell"])],
                [Paragraph("Market Trend", s["table_cell"]), Paragraph(sc.get("market_trend", "—"), s["table_cell"])],
                [Paragraph("Clinical Pipeline", s["table_cell"]), Paragraph(sc.get("clinical_pipeline_status", "—"), s["table_cell"])],
                [Paragraph("Top Exporters", s["table_cell"]), Paragraph(", ".join(sc.get("top_exporting_countries", [])), s["table_cell"])],
            ]

            t = Table(kv_data, colWidths=[4 * cm, 13 * cm])
            t.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), COLOR_DARK),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [COLOR_WHITE, COLOR_OFFWHT]),
                ("GRID", (0, 0), (-1, -1), 0.5, COLOR_LGRAY),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]))
            elements.append(KeepTogether(t))

        return elements

    # ------------------------------------------------------------------
    # Section 5: Executive Summary
    # ------------------------------------------------------------------

    def _build_executive_summary(self) -> List[Any]:
        s = self.styles
        elements: List[Any] = []

        elements.append(Paragraph("Executive Summary", s["section_header"]))
        elements.append(HRFlowable(width="100%", thickness=2, color=COLOR_DARK, spaceAfter=10))

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

        # 4-page story order:
        # P1=Cover, P2=Exec Summary+Charts, P3=Discovery+References, P4=Commercial+Supply Chain
        story: List[Any] = []
        story += self._build_cover()             # Page 1
        story += self._build_executive_summary() # Page 2 (exec summary)
        story += self._build_dashboard()         # Page 2 cont. / Page 3 (charts)
        story += self._build_discovery()         # Page 3 (scientific + citations)
        story += self._build_ip_analysis()       # Page 4 (IP Whitespace)
        story += self._build_commercial()        # Page 4 cont. (VC table)
        story += self._build_supply_chain()      # Page 4 cont. (supply chain grid)

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
        super().__init__("Report Generator", "Executive Biotech Editor", 0.1)
        import os
        from dotenv import load_dotenv
        from langchain_groq import ChatGroq
        
        load_dotenv()
        
        # Upgrade to a massive 70B parameter model for free to prevent hallucinations
        self.llm = ChatGroq(
            api_key=os.getenv("GROQ_API_KEY"),
            model_name="llama-3.3-70b-versatile",
            temperature=0.1
        )

    async def _generate_executive_summary(
        self,
        molecule: str,
        narrative: Dict[str, str],
        commercial_data: List[Dict[str, Any]],
        supply_chain: Dict[str, Any],
        merged_diseases: List[Dict[str, Any]],
        ip_cleared: List[Dict[str, Any]],
    ) -> str:
        """Ask Gemini to write a crisp C-suite-ready executive summary."""
        candidate_names = [c.get("disease_name", "") for c in commercial_data]
        cleared_names = [c.get("disease_name", "") for c in ip_cleared]
        all_names = [c.get("disease_name", "") for c in merged_diseases]
        blocked_names = [n for n in all_names if n not in cleared_names]
        
        # Build hard-data candidate table for injection into the prompt
        candidate_table_rows = []
        for c in commercial_data:
            row = (
                f"  - {c.get('disease_name', 'Unknown')}: "
                f"TAM={c.get('tam_estimate', 'N/A')}, "
                f"Trial Complexity={c.get('trial_complexity', 'Unknown')}, "
                f"Pathway Score={c.get('pathway_overlap_score', 'N/A')}"
            )
            candidate_table_rows.append(row)
        candidate_table = "\n".join(candidate_table_rows) or "  None identified."

        # Build unambiguous IP status block
        if blocked_names:
            ip_status_text = (
                f"PATENT-BLOCKED (do NOT recommend for commercial roadmap): {', '.join(blocked_names)}\n"
                f"IP-CLEARED (100%% commercially viable): {', '.join(cleared_names)}"
            )
        else:
            ip_status_text = (
                f"IP STATUS: ALL {len(cleared_names)} candidate(s) are 100%% IP-CLEARED. "
                f"ZERO candidates were blocked by patents or regulatory exclusivity. "
                f"Cleared candidates: {', '.join(cleared_names)}"
            )

        prompt = f"""You are the Chief Medical Officer of a biotech VC fund. Write a formal, data-grounded 3-paragraph executive summary (max 150 words) for a drug repurposing intelligence report.

=== VERIFIED PIPELINE DATA (use ONLY this — do not supplement with external assumptions) ===
Molecule: {molecule}
Supply Chain Risk: {supply_chain.get("supply_chain_risk", "Unknown")}
Repurposing Opportunity Score: {supply_chain.get("repurposing_score", "N/A")} / 10
Market Trend: {supply_chain.get("market_trend", "Unknown")}

Commercially Viable Candidates:
{candidate_table}

{ip_status_text}

Discovery Context: {narrative.get("discovery", "")[:400]}

=== ABSOLUTE RULES — VIOLATION IS NOT PERMITTED ===
1. You are STRICTLY FORBIDDEN from inventing, implying, or hallucinating regulatory roadblocks, exclusivity periods, patent blocks, or legal constraints of ANY KIND that are not explicitly listed in the PATENT-BLOCKED section above.
2. If a candidate appears in the IP-CLEARED list, you MUST treat it as fully commercially viable. Do NOT add qualifiers like "may face regulatory hurdles" or "could be subject to exclusivity".
3. If recommending a lower-scoring candidate over a higher one, justify this using ONLY scientific or clinical reasoning (e.g., safety profile, unmet need, faster trial pathway) — never fabricate legal constraints.
4. Write in continuous prose. No bullet points. Maximum 150 words.

=== STRUCTURE ===
Paragraph 1: Repurposing opportunity for {molecule} and total IP-cleared candidates.
Paragraph 2: Strongest commercial candidate with data-backed justification.
Paragraph 3: Supply chain readiness and recommended next steps.
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
        synonyms = input_data.get("synonyms", "")
        thread_id = input_data.get("thread_id", "unknown")
        narrative = input_data.get("narrative", {})
        merged_diseases = input_data.get("merged_diseases", [])
        ip_cleared = input_data.get("ip_cleared_diseases", [])
        commercial = input_data.get("commercial_data", [])
        supply_chain = input_data.get("supply_chain_data", {})

        self.log_status("running", f"Generating intelligence report for {molecule}...")

        # 1. LLM-powered executive summary
        self.log_status("running", "Asking AI to synthesise executive summary...")
        exec_summary = await self._generate_executive_summary(
            molecule, narrative, commercial, supply_chain, merged_diseases, ip_cleared
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
            merged_diseases=merged_diseases,
            synonyms=synonyms
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
