import io, base64
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from schemas import ReportRequest
from config import FPDF_AVAILABLE

if FPDF_AVAILABLE:
    from core.pdf_generator import FinSightPDF

router = APIRouter()

@router.post("/api/generate-report")
async def generate_report(req: ReportRequest):
    if not FPDF_AVAILABLE: raise HTTPException(501, "fpdf2 not installed.")

    res, form, charts = req.results, req.formData, req.charts or {}
    pdf = FinSightPDF()
    pdf.add_page()

    company_name = pdf.clean(form.get("companyName", "SME"))
    pdf.section_header("EXECUTIVE SUMMARY")
    pdf.cell(0, 9, f"Company: {company_name}", ln=True)
    pdf.multi_cell(0, 6, pdf.clean(res.get("summary", "")))
    
    # Render PDF... (Rest of the report logic as per original design)
    pdf_output = io.BytesIO()
    pdf_output.write(pdf.output())
    pdf_output.seek(0)
    
    return StreamingResponse(pdf_output, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=Report_{company_name}.pdf"})