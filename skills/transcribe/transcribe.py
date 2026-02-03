#!/usr/bin/env python3
"""
Audio transcription using faster-whisper
Usage: python transcribe.py <audio_file> [--model small|medium|large-v3]
"""

import sys
import os

def transcribe(audio_path: str, model_size: str = "small") -> str:
    from faster_whisper import WhisperModel
    
    # Use CPU with int8 quantization for speed
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    
    segments, info = model.transcribe(audio_path, language="fr")
    
    print(f"Detected language: {info.language} (prob: {info.language_probability:.2f})")
    
    text_parts = []
    for segment in segments:
        print(f"[{segment.start:.2f}s -> {segment.end:.2f}s] {segment.text}")
        text_parts.append(segment.text)
    
    return " ".join(text_parts).strip()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcribe.py <audio_file> [--model small|medium|large-v3]")
        sys.exit(1)
    
    audio_file = sys.argv[1]
    model = "small"
    
    if "--model" in sys.argv:
        idx = sys.argv.index("--model")
        if idx + 1 < len(sys.argv):
            model = sys.argv[idx + 1]
    
    if not os.path.exists(audio_file):
        print(f"Error: File not found: {audio_file}")
        sys.exit(1)
    
    print(f"Transcribing {audio_file} with model {model}...")
    result = transcribe(audio_file, model)
    print(f"\n=== TRANSCRIPTION ===\n{result}")
