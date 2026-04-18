import os
from dotenv import load_dotenv

load_dotenv()

# --- Groq Setup ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = "llama-3.3-70b-versatile"
groq_client = None

try:
    from groq import Groq
    if GROQ_API_KEY and GROQ_API_KEY != "your_groq_api_key_here":
        groq_client = Groq(api_key=GROQ_API_KEY)
    else:
        print("WARNING: GROQ_API_KEY is not set in .env")
except ImportError:
    print("ERROR: 'groq' package not installed.")

# --- Optional Libraries Check ---
try:
    from fpdf import FPDF
    FPDF_AVAILABLE = True
except ImportError:
    FPDF_AVAILABLE = False

try:
    import fitz
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False

try:
    import pytesseract
    from pdf2image import convert_from_bytes
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

try:
    import pandas as pd
    PANDAS_AVAILABLE = True
except ImportError:
    PANDAS_AVAILABLE = False