import PyPDF2
import sys
import os

# Force UTF-8 encoding for output
sys.stdout.reconfigure(encoding='utf-8')

def extract_pdf_text(pdf_path):
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text()
            return text
    except Exception as e:
        return f"ERROR: {str(e)}"

if __name__ == "__main__":
    scpi_dir = "scpi-pdfs"
    pdfs = [
        "Bulletin T3 2025 - EPARGNE PIERRE EUROPE.pdf",
        "Bulletin 3T 2025 - EDR EUROPA.pdf",
        "BULLETIN T3 2025 - TRANSITION EUROPE.pdf"
    ]
    
    for pdf in pdfs:
        path = os.path.join(scpi_dir, pdf)
        print(f"\n{'='*60}")
        print(f"SCPI: {pdf.replace('Bulletin T3 2025 - ', '').replace('Bulletin 3T 2025 - ', '').replace('BULLETIN T3 2025 - ', '').replace('.pdf', '')}")
        print('='*60)
        text = extract_pdf_text(path)
        print(text[:3000])  # First 3000 chars
        print("\n[...]")
