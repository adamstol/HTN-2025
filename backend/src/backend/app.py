from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
import google.generativeai as genai
from openai import OpenAI
import tempfile
import json

# Load environment variables
load_dotenv("config/.env")

# Initialize Flask app
app = Flask(__name__)

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Configure OpenAI
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@app.route("/")
def home():
    return jsonify({"message": "HTN2025 Backend is running 🚀"})


@app.route("/transcribe", methods=["POST"])
def transcribe_and_analyze():
    if "file" not in request.files:
        return jsonify({"error": "No audio file uploaded"}), 400

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
        analysis_response = model.generate_content(analysis_prompt)
        raw_analysis = analysis_response.text.strip() if analysis_response else ""

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


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
