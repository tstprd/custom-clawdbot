import PyPDF2
import os
import json

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
    
    results = {}
    
    for pdf in pdfs:
        name = pdf.replace('Bulletin T3 2025 - ', '').replace('Bulletin 3T 2025 - ', '').replace('BULLETIN T3 2025 - ', '').replace('.pdf', '')
        path = os.path.join(scpi_dir, pdf)
        text = extract_pdf_text(path)
        results[name] = text
    
    # Save to JSON file
    with open('scpi-extracted.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    
    print("OK - Extraction terminee - fichier: scpi-extracted.json")
    
    for name, text in results.items():
        print(f"\n{name}: {len(text)} caractères extraits")
