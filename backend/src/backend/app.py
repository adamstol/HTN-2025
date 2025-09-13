from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
import google.generativeai as genai
import openai

# Load environment variables
load_dotenv("config/.env")

# Initialize Flask app
app = Flask(__name__)

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Configure OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")


@app.route("/")
def home():
    return jsonify({"message": "HTN2025 Backend is running 🚀"})


@app.route("/transcribe", methods=["POST"])
def transcribe_audio():
    """
    Transcribe uploaded audio into conversation JSON using the current OpenAI API.
    """
    try:
        if "file" not in request.files:
            return jsonify({"error": "No audio file uploaded"}), 400

        audio_file = request.files["file"]

        # New API method
        transcription = openai.Audio.transcribe(
            model="whisper-1",
            file=audio_file
        )

        raw_text = transcription["text"]

        # Simple split by lines, assign alternating speakers
        lines = [line.strip() for line in raw_text.split("\n") if line.strip()]
        conversation = []
        for i, line in enumerate(lines):
            conversation.append({
                "speaker": f"Speaker {i % 2 + 1}",
                "text": line
            })

        return jsonify({"conversation": conversation})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/analyze", methods=["POST"])
def analyze_text():
    try:
        data = request.get_json()

        if "text" in data:
            text_input = data["text"]
        elif "conversation" in data:
            conversation = data["conversation"]
            if not isinstance(conversation, list) or len(conversation) == 0:
                return jsonify({"error": "Conversation must be a non-empty list"}), 400
            text_input = " ".join(f"{c['speaker']}: {c['text']}" for c in conversation)
        else:
            return jsonify({"error": "No text or conversation provided"}), 400

        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = f"""
Extract ONLY explicit, concrete facts directly stated by either person in the following conversation. 
- Do not include questions, guesses, or compliments from either person. 
- Do not include traits, opinions, or interpretations. 
- Rewrite each fact as a standalone statement with full context. 
- If either person refers to something vaguely (e.g., "I just got it yesterday"), expand it with the context (e.g., "Bought the shirt yesterday"). 
- Output ONLY in the format 'Person: Fact' with no extra text.

Conversation:
{text_input}
"""

        response = model.generate_content(prompt)

        return jsonify({"analysis": response.text.strip()})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
