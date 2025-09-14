from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv, find_dotenv
import google.generativeai as genai
from openai import OpenAI
import tempfile
import json
import threading
import time
import requests

# Load environment variables
load_dotenv("../../config/.env", override=False)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get API keys with fallback and debugging
google_api_key = os.getenv("GOOGLE_API_KEY")
openai_api_key = os.getenv("OPENAI_API_KEY")

print(f"Google API Key found: {'Yes' if google_api_key else 'No'}")
print(f"OpenAI API Key found: {'Yes' if openai_api_key else 'No'}")

if not google_api_key:
    print("WARNING: GOOGLE_API_KEY not found in environment variables")
if not openai_api_key:
    print("WARNING: OPENAI_API_KEY not found in environment variables")

# Configure Gemini
if google_api_key:
    genai.configure(api_key=google_api_key)
else:
    print("ERROR: Cannot configure Gemini without GOOGLE_API_KEY")

# Configure OpenAI
if openai_api_key:
    client = OpenAI(api_key=openai_api_key)
else:
    print("ERROR: Cannot configure OpenAI without OPENAI_API_KEY")
    client = None


@app.route("/")
def home():
    return jsonify({"message": "HTN2025 Backend is running 🚀"})

@app.route("/health")
def health_check():
    return jsonify({"status": "healthy", "timestamp": time.time()})


@app.route("/transcribe", methods=["POST"])
def transcribe_and_analyze():
    if "file" not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400

    # Check if API keys are available
    if not openai_api_key or client is None:
        return jsonify({"error": "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."}), 500

    audio_file = request.files["file"]

    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio_file.filename)[1]) as temp:
            audio_file.save(temp.name)
            temp_path = temp.name

        # Transcribe with Whisper (verbose JSON for timestamps)
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=open(temp_path, "rb"),
            response_format="verbose_json"
        )

        # Single AI prompt to process everything
        segments = getattr(transcription, "segments", None)
        if segments:
            segment_text = "\n".join([f"[{s.start:.2f}-{s.end:.2f}] {s.text.strip()}" for s in segments])
        else:
            segment_text = f"[0.00-0.00] {transcription.text}"

        unified_prompt = f"""
You are an AI assistant that processes audio transcripts. Given the timestamped segments below, you must return a JSON object with exactly three fields: transcript, facts, and summary.

REQUIREMENTS:
1. transcript: Array of conversation turns with speaker identification (only "speaker" and "text" fields)
2. facts: Key facts extracted for each speaker separately
3. summary: Concise summary of key points and outcomes

RULES:
- There are only two speakers maximum
- If someone says another person's name, that name belongs to the OTHER speaker
- Group segments that are close together (< 0.5s apart)
- Merge consecutive utterances from the same speaker
- Extract only explicit, concrete facts directly stated by each person
- Do not include questions, opinions, or interpretations in facts
- Return ONLY valid JSON, no other text

SEGMENTS:
{segment_text}

OUTPUT FORMAT (return ONLY this JSON structure):
{{
  "transcript": [
    {{"speaker": "Speaker 1", "text": "utterance"}},
    {{"speaker": "Speaker 2", "text": "response"}}
  ],
  "facts": {{
    "Speaker 1": [
      "Concrete fact 1 about Speaker 1",
      "Concrete fact 2 about Speaker 1"
    ],
    "Speaker 2": [
      "Concrete fact 1 about Speaker 2",
      "Concrete fact 2 about Speaker 2"
    ]
  }},
  "summary": "Brief summary of the conversation including main topics, decisions made, and key information exchanged."
}}
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": unified_prompt}],
            temperature=0
        )

        result_json = response.choices[0].message.content.strip()
        
        try:
            result = json.loads(result_json)
            
            # Validate required fields
            if not all(key in result for key in ["transcript", "facts", "summary"]):
                raise ValueError("Missing required fields")
                
            return jsonify(result)
            
        except (json.JSONDecodeError, ValueError) as e:
            # Fallback response
            return jsonify({
                "transcript": [{"speaker": "Unknown", "text": transcription.text}],
                "facts": {
                    "Unknown": ["No facts could be extracted"]
                },
                "summary": "Transcription completed but detailed analysis failed."
            })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def keep_alive():
    """Send a request to the health endpoint every 5 minutes to keep the server active"""
    def ping_server():
        while True:
            try:
                time.sleep(300)  # Wait 5 minutes
                # Get the server URL from environment or use localhost
                server_url = os.environ.get("RENDER_EXTERNAL_URL", "http://localhost:5000")
                response = requests.get(f"{server_url}/health", timeout=10)
                print(f"Keep-alive ping: {response.status_code}")
            except Exception as e:
                print(f"Keep-alive ping failed: {e}")
    
    # Start the ping thread
    ping_thread = threading.Thread(target=ping_server, daemon=True)
    ping_thread.start()

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    
    # Start keep-alive mechanism
    keep_alive()
    
    app.run(debug=False, host="0.0.0.0", port=port)
