from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
import google.generativeai as genai
import openai
import tempfile
from openai import OpenAI
import json
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
    if "file" not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400

    audio_file = request.files["file"]

    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio_file.filename)[1]) as temp:
            audio_file.save(temp.name)
            temp_path = temp.name

        # 1️⃣ Transcribe with Whisper (verbose JSON for timestamps)
        transcription = openai.audio.transcriptions.create(
            model="whisper-1",
            file=open(temp_path, "rb"),
            response_format="verbose_json"
        )

        segments = transcription.segments
        if not segments:
            return jsonify({"conversation": [{"speaker": "Unknown", "text": transcription.text}]}), 200

        # 2️⃣ Group nearby segments (less than 0.5s apart)
        grouped_segments = []
        current_group = {"start": segments[0].start, "end": segments[0].end, "text": segments[0].text.strip()}

        for seg in segments[1:]:
            if seg.start - current_group["end"] <= 0.5:  # 0.5 second pause threshold
                current_group["text"] += " " + seg.text.strip()
                current_group["end"] = seg.end
            else:
                grouped_segments.append(current_group)
                current_group = {"start": seg.start, "end": seg.end, "text": seg.text.strip()}
        grouped_segments.append(current_group)

        # 3️⃣ Prepare prompt for GPT
        segment_text = "\n".join([f"[{g['start']:.2f}-{g['end']:.2f}] {g['text']}" for g in grouped_segments])
        prompt = f"""
You are an assistant that separates conversation segments by speaker.
Assume there are only two speakers.
Assign consistent labels: Speaker 1 and Speaker 2.
Do NOT merge multiple sentences from the same speaker; keep the flow natural.
Output ONLY a JSON array like this:

[
  {{"speaker": "Speaker 1", "text": "First utterance"}},
  {{"speaker": "Speaker 2", "text": "Second utterance"}}
]

Segments:
{segment_text}
"""

        # 4️⃣ Call GPT to assign speakers
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0
        )

        conversation_json_str = response.choices[0].message.content.strip()
        conversation_list = json.loads(conversation_json_str)

        # 5️⃣ Merge consecutive lines from same speaker (optional)
        merged_conversation = []
        for seg in conversation_list:
            if merged_conversation and merged_conversation[-1]['speaker'] == seg['speaker']:
                merged_conversation[-1]['text'] += " " + seg['text']
            else:
                merged_conversation.append(seg)

        # 6️⃣ Return JSON array format
        return jsonify({"conversation": merged_conversation})

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
        raw_analysis = response.text.strip()

        # Split by lines and organize by speaker
        speaker_facts = {}
        for line in raw_analysis.split("\n"):
            if ":" in line:
                speaker, fact = line.split(":", 1)
                speaker = speaker.strip()
                fact = fact.strip()
                if speaker not in speaker_facts:
                    speaker_facts[speaker] = []
                speaker_facts[speaker].append(fact)

        return jsonify({"analysis": speaker_facts})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
