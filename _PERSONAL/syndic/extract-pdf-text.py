import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

try:
    import PyPDF2
    pdf_path = sys.argv[1]
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n\n"
        print(text)
except ImportError:
    print("ERROR: PyPDF2 not installed. Install with: pip install PyPDF2")
except Exception as e:
    print(f"ERROR: {e}")
