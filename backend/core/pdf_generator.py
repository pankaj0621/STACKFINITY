import datetime
from config import FPDF_AVAILABLE

if FPDF_AVAILABLE:
    from fpdf import FPDF
    class FinSightPDF(FPDF):
        def clean(self, text: str) -> str:
            replacements = {'\u2013': '-', '\u2014': '-', '\u2018': "'", '\u2019': "'", '\u201c': '"', '\u201d': '"', '\u20ac': 'EUR'}
            s = str(text)
            for k, v in replacements.items(): s = s.replace(k, v)
            return s.encode('latin-1', 'replace').decode('latin-1')

        def header(self):
            self.set_font("Helvetica", "B", 22)
            self.set_text_color(100, 180, 20)
            self.cell(0, 15, "FinSight Financial Report", ln=True)
            self.set_font("Helvetica", "I", 10)
            self.cell(0, 5, f"Date: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=True)
            self.ln(6)

        def section_header(self, label: str):
            self.set_font("Helvetica", "B", 12)
            self.set_text_color(255, 255, 255)
            self.set_fill_color(25, 25, 40)
            self.cell(0, 10, f"  {self.clean(label)}", ln=True, fill=True)
            self.set_text_color(40, 40, 40)
            self.ln(4)

        def two_col_row(self, label: str, value: str, fill: bool = False):
            self.set_fill_color(245, 245, 245)
            self.set_font("Helvetica", "", 10)
            self.cell(95, 9, f"  {self.clean(label)}", border=1, fill=fill)
            self.set_font("Helvetica", "B", 10)
            self.cell(95, 9, f"  {self.clean(value)}", border=1, fill=False)
            self.ln()

        def shap_bar_row(self, label: str, contribution: float, max_contrib: float):
            bar_w = min(80, abs(contribution) / max(max_contrib, 1) * 80)
            is_pos = contribution >= 0
            self.set_font("Helvetica", "", 9)
            self.cell(50, 8, self.clean(label), border=0)
            x, y = self.get_x(), self.get_y()
            if is_pos:
                self.set_fill_color(150, 210, 30)
                self.rect(x + 40, y + 1, bar_w, 6, "F")
            else:
                self.set_fill_color(220, 60, 60)
                self.rect(x + 40 - bar_w, y + 1, bar_w, 6, "F")
            self.set_xy(x + 125, y)
            self.cell(30, 8, f"{'+' if is_pos else ''}{contribution} pts", border=0)
            self.ln(9)