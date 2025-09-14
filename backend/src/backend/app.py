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
    if not google_api_key:
        return jsonify({"error": "Google API key not configured. Please set GOOGLE_API_KEY environment variable."}), 500
    
    if not openai_api_key or client is None:
        return jsonify({"error": "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."}), 500

    audio_file = request.files["file"]

    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio_file.filename)[1]) as temp:
            audio_file.save(temp.name)
            temp_path = temp.name

        # 1️⃣ Transcribe with Whisper (verbose JSON for timestamps)
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=open(temp_path, "rb"),
            response_format="verbose_json"
        )

        segments = getattr(transcription, "segments", None)
        if not segments:
            conversation_list = [{"speaker": "Unknown", "text": transcription.text}]
        else:
            # 2️⃣ Group nearby segments (<= 0.5s apart)
            grouped_segments = []
            current_group = {
                "start": segments[0].start,
                "end": segments[0].end,
                "text": segments[0].text.strip()
            }

            for seg in segments[1:]:
                if seg.start - current_group["end"] <= 0.5:
                    current_group["text"] += " " + seg.text.strip()
                    current_group["end"] = seg.end
                else:
                    grouped_segments.append(current_group)
                    current_group = {"start": seg.start, "end": seg.end, "text": seg.text.strip()}
            grouped_segments.append(current_group)

            # 3️⃣ Let GPT separate speakers with names if possible
            segment_text = "\n".join(
                [f"[{g['start']:.2f}-{g['end']:.2f}] {g['text']}" for g in grouped_segments]
            )
            prompt = f"""
You are separating conversation segments by speaker.
Rules:
- There are only two speakers.
- If someone says another person’s name (e.g., "Hi Ibrahim"), that name belongs to the *other* speaker.
- If someone talks about their own items (e.g., "I got my shoes from Puma"), that statement belongs to them, not the person they named.
- Keep labels consistent across the conversation.
- If no names are mentioned, label speakers as "Speaker 1" and "Speaker 2".
- Output ONLY valid JSON in this format:

[
  {{"speaker": "Speaker 1", "text": "First utterance"}},
  {{"speaker": "Speaker 2", "text": "Second utterance"}}
]

Segments:
{segment_text}
"""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0
            )

            conversation_json_str = response.choices[0].message.content.strip()

            try:
                conversation_list = json.loads(conversation_json_str)
            except json.JSONDecodeError:
                # Fallback: return plain text if JSON is malformed
                conversation_list = [{"speaker": "Unknown", "text": transcription.text}]

            # 4️⃣ Merge consecutive lines from same speaker
            merged_conversation = []
            for seg in conversation_list:
                if merged_conversation and merged_conversation[-1]['speaker'] == seg['speaker']:
                    merged_conversation[-1]['text'] += " " + seg['text']
                else:
                    merged_conversation.append(seg)
            conversation_list = merged_conversation

        # 5️⃣ Build conversation string for analysis
        text_input = " ".join(f"{c['speaker']}: {c['text']}" for c in conversation_list)

        # 6️⃣ Run Gemini analysis
        model = genai.GenerativeModel("gemini-2.5-flash")
        analysis_prompt = f"""
Extract ONLY explicit, concrete facts directly stated by either person in the following conversation. 
- Do not include questions, guesses, or compliments.
- Do not include traits, opinions, or interpretations.
- Rewrite each fact as a standalone statement with full context.
- If either person refers to something vaguely (e.g., "I just got it yesterday"), expand it with context.
- Output ONLY in the format 'Person: Fact'.

Conversation:
{text_input}
"""
        try:
            analysis_response = model.generate_content(analysis_prompt)
            
            # Check if response has valid content
            if analysis_response and hasattr(analysis_response, 'candidates') and analysis_response.candidates:
                candidate = analysis_response.candidates[0]
                if hasattr(candidate, 'content') and candidate.content and candidate.content.parts:
                    raw_analysis = analysis_response.text.strip()
                else:
                    print(f"Gemini response has no valid content. Finish reason: {getattr(candidate, 'finish_reason', 'unknown')}")
                    raw_analysis = "No analysis available - content filtered or blocked"
            else:
                print("Gemini response is empty or invalid")
                raw_analysis = "No analysis available - empty response"
        except Exception as e:
            print(f"Gemini API error: {str(e)}")
            raw_analysis = f"Analysis failed: {str(e)}"

        speaker_facts = {}
        for line in raw_analysis.splitlines():
            if ":" in line:
                speaker, fact = line.split(":", 1)
                speaker = speaker.strip()
                fact = fact.strip()
                if speaker not in speaker_facts:
                    speaker_facts[speaker] = []
                speaker_facts[speaker].append(fact)

        return jsonify({
            "conversation": conversation_list,
            "analysis": speaker_facts or {"note": "No explicit facts extracted"}
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
