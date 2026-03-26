import io
from datetime import datetime
from typing import List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    PageBreak,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT


# ── Color palette ──────────────────────────────────────────────────────────────
PRIMARY_COLOR = colors.HexColor("#1A56DB")   # Deep blue
ACCENT_COLOR = colors.HexColor("#E1EFFE")    # Light blue tint
TEXT_COLOR = colors.HexColor("#111928")      # Near black
MUTED_COLOR = colors.HexColor("#6B7280")     # Gray
SUCCESS_COLOR = colors.HexColor("#057A55")   # Green
WARNING_COLOR = colors.HexColor("#C27803")   # Amber
DANGER_COLOR = colors.HexColor("#C81E1E")    # Red


def _score_color(score: Optional[float]) -> colors.Color:
    if score is None:
        return MUTED_COLOR
    if score >= 75:
        return SUCCESS_COLOR
    if score >= 50:
        return WARNING_COLOR
    return DANGER_COLOR


def _build_styles() -> dict:
    base = getSampleStyleSheet()
    custom = {
        "title": ParagraphStyle(
            "ReportTitle",
            parent=base["Title"],
            fontSize=26,
            textColor=PRIMARY_COLOR,
            spaceAfter=6,
            alignment=TA_LEFT,
        ),
        "subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["Normal"],
            fontSize=12,
            textColor=MUTED_COLOR,
            spaceAfter=4,
        ),
        "section_heading": ParagraphStyle(
            "SectionHeading",
            parent=base["Heading2"],
            fontSize=14,
            textColor=PRIMARY_COLOR,
            spaceBefore=12,
            spaceAfter=4,
        ),
        "candidate_name": ParagraphStyle(
            "CandidateName",
            parent=base["Heading1"],
            fontSize=18,
            textColor=TEXT_COLOR,
            spaceAfter=4,
        ),
        "label": ParagraphStyle(
            "Label",
            parent=base["Normal"],
            fontSize=9,
            textColor=MUTED_COLOR,
            spaceAfter=1,
        ),
        "value": ParagraphStyle(
            "Value",
            parent=base["Normal"],
            fontSize=10,
            textColor=TEXT_COLOR,
            spaceAfter=4,
        ),
        "normal": base["Normal"],
        "small": ParagraphStyle(
            "Small",
            parent=base["Normal"],
            fontSize=8,
            textColor=MUTED_COLOR,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=base["Normal"],
            fontSize=10,
            textColor=TEXT_COLOR,
            leading=14,
            spaceAfter=6,
        ),
    }
    return custom


def generate_interview_compilation(
    candidates_data: List[dict], vacancy: dict
) -> bytes:
    """
    Generate a PDF compilation report for a vacancy.

    Structure:
      - Cover page: vacancy title, date, candidate count, summary table
      - One section per candidate: profile, scores, strengths, gaps
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=f"Interview Compilation – {vacancy.get('title', 'Vacancy')}",
        author="HireGenius",
    )

    styles = _build_styles()
    story = []

    # ── Cover page ─────────────────────────────────────────────────────────────
    story.append(Spacer(1, 1.5 * cm))
    story.append(
        Paragraph("HireGenius", styles["subtitle"])
    )
    story.append(
        Paragraph(
            f"Interview Compilation Report",
            styles["title"],
        )
    )
    story.append(HRFlowable(width="100%", thickness=2, color=PRIMARY_COLOR, spaceAfter=8))
    story.append(
        Paragraph(f"<b>Position:</b> {vacancy.get('title', 'N/A')}", styles["value"])
    )
    story.append(
        Paragraph(f"<b>Department:</b> {vacancy.get('department', 'N/A')}", styles["value"])
    )
    story.append(
        Paragraph(
            f"<b>Required Experience:</b> {vacancy.get('required_experience_years', 'N/A')} years",
            styles["value"],
        )
    )
    story.append(
        Paragraph(
            f"<b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            styles["value"],
        )
    )
    story.append(
        Paragraph(
            f"<b>Total Candidates Evaluated:</b> {len(candidates_data)}",
            styles["value"],
        )
    )
    story.append(Spacer(1, 0.8 * cm))

    # Summary table on cover
    if candidates_data:
        story.append(Paragraph("Candidates Summary (by Compatibility Score)", styles["section_heading"]))
        story.append(Spacer(1, 0.3 * cm))

        table_data = [
            ["#", "Candidate", "Location", "Compatibility", "Recommendation"],
        ]
        sorted_candidates = sorted(
            candidates_data,
            key=lambda c: c.get("compatibility_score") or 0,
            reverse=True,
        )
        for idx, c in enumerate(sorted_candidates, 1):
            score = c.get("compatibility_score")
            score_str = f"{score:.0f}%" if score is not None else "N/A"
            rec = c.get("recommendation", "pending")
            table_data.append(
                [
                    str(idx),
                    c.get("name", "Unknown")[:35],
                    (c.get("location") or "N/A")[:25],
                    score_str,
                    rec.replace("_", " ").title(),
                ]
            )

        col_widths = [1 * cm, 5.5 * cm, 4 * cm, 3 * cm, 3.5 * cm]
        tbl = Table(table_data, colWidths=col_widths)
        tbl.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), PRIMARY_COLOR),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 9),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, ACCENT_COLOR]),
                    ("FONTSIZE", (0, 1), (-1, -1), 8),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.lightgrey),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(tbl)

    story.append(PageBreak())

    # ── One section per candidate ──────────────────────────────────────────────
    for idx, candidate in enumerate(
        sorted(
            candidates_data,
            key=lambda c: c.get("compatibility_score") or 0,
            reverse=True,
        ),
        1,
    ):
        # Candidate header
        story.append(
            Paragraph(
                f"{idx}. {candidate.get('name', 'Unknown Candidate')}",
                styles["candidate_name"],
            )
        )
        story.append(HRFlowable(width="100%", thickness=1, color=MUTED_COLOR, spaceAfter=6))

        # Contact info row
        contact_items = []
        if candidate.get("phone"):
            contact_items.append(f"📞 {candidate['phone']}")
        if candidate.get("email"):
            contact_items.append(f"✉ {candidate['email']}")
        if candidate.get("location"):
            contact_items.append(f"📍 {candidate['location']}")
        if contact_items:
            story.append(Paragraph("  |  ".join(contact_items), styles["small"]))
            story.append(Spacer(1, 0.3 * cm))

        # Score table
        scores = [
            ("Overall Compatibility", candidate.get("compatibility_score")),
            ("Values Alignment", candidate.get("values_alignment_score")),
            ("Requirements Met", candidate.get("requirements_score")),
            ("Experience Relevance", candidate.get("experience_relevance_score")),
            ("Stability", candidate.get("stability_score")),
        ]
        score_rows = [["Metric", "Score"]]
        for label, score in scores:
            score_str = f"{score:.0f} / 100" if score is not None else "N/A"
            score_rows.append([label, score_str])

        score_tbl = Table(score_rows, colWidths=[9 * cm, 3 * cm])
        score_tbl.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), ACCENT_COLOR),
                    ("TEXTCOLOR", (0, 0), (-1, 0), PRIMARY_COLOR),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 9),
                    ("GRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ]
            )
        )
        story.append(score_tbl)
        story.append(Spacer(1, 0.4 * cm))

        # Recommendation badge
        rec = candidate.get("recommendation", "pending")
        rec_color = {
            "hire": SUCCESS_COLOR,
            "second_interview": WARNING_COLOR,
            "reject": DANGER_COLOR,
            "pending": MUTED_COLOR,
        }.get(rec, MUTED_COLOR)
        story.append(
            Paragraph(
                f'<b>Recommendation:</b> <font color="#{rec_color.hexval()[1:]}"><b>{rec.replace("_", " ").upper()}</b></font>',
                styles["value"],
            )
        )
        story.append(Spacer(1, 0.3 * cm))

        # Strengths
        strengths = candidate.get("strengths") or []
        if strengths:
            story.append(Paragraph("Strengths", styles["section_heading"]))
            for s in strengths[:5]:
                story.append(Paragraph(f"• {s}", styles["body"]))

        # Gaps
        gaps = candidate.get("gaps") or []
        if gaps:
            story.append(Paragraph("Areas for Development", styles["section_heading"]))
            for g in gaps[:5]:
                story.append(Paragraph(f"• {g}", styles["body"]))

        # Reasoning
        reasoning = candidate.get("reasoning")
        if reasoning:
            story.append(Paragraph("Assessment", styles["section_heading"]))
            story.append(Paragraph(reasoning[:1200], styles["body"]))

        # Top skills
        top_skills = (candidate.get("skills") or [])[:8]
        if top_skills:
            story.append(Paragraph("Key Skills", styles["section_heading"]))
            skill_names = [s.get("skill_name") or s.get("name", "") for s in top_skills]
            story.append(Paragraph(", ".join(filter(None, skill_names)), styles["body"]))

        # CV link
        cv_url = candidate.get("cv_url")
        if cv_url:
            story.append(Spacer(1, 0.3 * cm))
            story.append(
                Paragraph(
                    f'<link href="{cv_url}"><u>View CV (link valid 1 hour)</u></link>',
                    styles["small"],
                )
            )

        story.append(PageBreak())

    doc.build(story)
    return buffer.getvalue()
