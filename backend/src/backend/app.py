from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv, find_dotenv

# import google.generativeai as genai
from openai import OpenAI
import tempfile
import json
import threading
import time
import requests

# Zep imports
from zep_cloud import Zep
from datetime import datetime

# Load environment variables
load_dotenv("../../config/.env", override=False)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get API keys with fallback and debugging
google_api_key = os.getenv("GOOGLE_API_KEY")
openai_api_key = os.getenv("OPENAI_API_KEY")
zep_api_key = os.getenv("ZEP_API_KEY")

print(f"Google API Key found: {'Yes' if google_api_key else 'No'}")
print(f"OpenAI API Key found: {'Yes' if openai_api_key else 'No'}")
print(f"Zep API Key found: {'Yes' if zep_api_key else 'No'}")

if not google_api_key:
    print("WARNING: GOOGLE_API_KEY not found in environment variables")
if not openai_api_key:
    print("WARNING: OPENAI_API_KEY not found in environment variables")
if not zep_api_key:
    print("WARNING: ZEP_API_KEY not found in environment variables")

# Configure Gemini
# if google_api_key:
#     genai.configure(api_key=google_api_key)
# else:
#     print("ERROR: Cannot configure Gemini without GOOGLE_API_KEY")

# Configure OpenAI
if openai_api_key:
    client = OpenAI(api_key=openai_api_key)
else:
    print("ERROR: Cannot configure OpenAI without OPENAI_API_KEY")
    client = None

# Configure Zep
if zep_api_key:
    zep_client = Zep(api_key=zep_api_key)
else:
    print("ERROR: Cannot configure Zep without ZEP_API_KEY")
    zep_client = None


# Zep helper functions
def ensure_graph_exists(graph_id="all_users_htn"):
    """Ensure the Zep graph exists, create if it doesn't"""
    if not zep_client:
        return False

    try:
        zep_client.graph.get(graph_id)
        return True
    except Exception:
        try:
            zep_client.graph.create(graph_id=graph_id)
            time.sleep(1)  # Wait for creation
            print(f"Created Zep graph: {graph_id}")
            return True
        except Exception as e:
            print(f"Failed to create Zep graph: {e}")
            return False


def create_user_entity(speaker_name, graph_id="all_users_htn"):
    """Create a user entity in the Zep graph"""
    if not zep_client:
        return False

    try:
        # Check if user already exists
        search_results = zep_client.graph.search(
            graph_id=graph_id,
            query=speaker_name,
            scope="nodes",
            search_filters={"node_labels": ["User"]},
            limit=1,
        )

        if search_results.nodes and len(search_results.nodes) > 0:
            print(f"User {speaker_name} already exists")
            return True

        # Create user entity
        user_data = {
            "action": "Create_entity",
            "entity_type": "User",
            "name": speaker_name,
            "description": f"User identified from conversation: {speaker_name}",
        }

        zep_client.graph.add(
            graph_id=graph_id,
            type="json",
            data=json.dumps(user_data),
        )

        print(f"Created user entity: {speaker_name}")
        return True

    except Exception as e:
        print(f"Failed to create user entity {speaker_name}: {e}")
        return False


def extract_and_store_entities(facts, speakers, graph_id="all_users_htn"):
    """Extract entities from facts and store them in Zep graph"""
    if not zep_client:
        return

    entity_patterns = {
        "Goal": [
            r"(?:wants to|plans to|hopes to|aims to|goal is to|trying to)\s+(.+)",
            r"(?:my goal is|i want to|i plan to|i hope to|i aim to)\s+(.+)",
        ],
        "Language": [
            r"(?:speaks|knows|fluent in|can speak)\s+([\w\s]+?)(?:\s+(?:language|fluently))?",
            r"(?:native|bilingual|multilingual)\s+(?:in\s+)?([\w\s]+)",
        ],
        "Organization": [
            r"(?:works at|employed by|job at|working at)\s+(.+)",
            r"(?:my job is at|i work at|employed at)\s+(.+)",
        ],
        "Topic": [
            r"(?:interested in|likes|enjoys|passionate about|loves|into)\s+(.+)",
            r"(?:my interest is|i like|i enjoy|i love)\s+(.+)",
        ],
        "Trait": [
            r"(?:is|personality|character).*?(outgoing|introverted|friendly|shy|confident|creative|analytical|organized|spontaneous|patient|ambitious|calm|energetic)",
            r"(?:i am|i'm)\s+(outgoing|introverted|friendly|shy|confident|creative|analytical|organized|spontaneous|patient|ambitious|calm|energetic)",
        ],
    }

    import re

    for speaker, speaker_facts in facts.items():
        for fact in speaker_facts:
            fact_lower = fact.lower()

            for entity_type, patterns in entity_patterns.items():
                for pattern in patterns:
                    match = re.search(pattern, fact_lower, re.IGNORECASE)
                    if match:
                        entity_name = match.group(1).strip()

                        # Skip very short or generic entities
                        if len(entity_name) < 2 or entity_name in [
                            "it",
                            "that",
                            "this",
                            "them",
                        ]:
                            continue

                        # Create entity if it doesn't exist
                        try:
                            search_results = zep_client.graph.search(
                                graph_id=graph_id,
                                query=entity_name,
                                scope="nodes",
                                search_filters={"node_labels": [entity_type]},
                                limit=1,
                            )

                            entity_exists = (
                                search_results.nodes and len(search_results.nodes) > 0
                            )

                            if not entity_exists:
                                entity_data = {
                                    "action": "Create_entity",
                                    "entity_type": entity_type,
                                    "name": entity_name,
                                    "description": fact,
                                }

                                zep_client.graph.add(
                                    graph_id=graph_id,
                                    type="json",
                                    data=json.dumps(entity_data),
                                )

                                print(f"Created {entity_type} entity: {entity_name}")

                            # Create relationship between user and entity
                            relationship_types = {
                                "Goal": "HAS_GOAL",
                                "Language": "SPEAKS",
                                "Organization": "WORKS_AT",
                                "Topic": "INTERESTED_IN",
                                "Trait": "HAS_TRAIT",
                            }

                            relationship_data = {
                                "action": "Create_relationship",
                                "source_entity_type": "User",
                                "source_entity_name": speaker,
                                "target_entity_type": entity_type,
                                "target_entity_name": entity_name,
                                "relationship_type": relationship_types[entity_type],
                                "description": fact,
                            }

                            zep_client.graph.add(
                                graph_id=graph_id,
                                type="json",
                                data=json.dumps(relationship_data),
                            )

                            print(
                                f"Created relationship: {speaker} -> {relationship_types[entity_type]} -> {entity_name}"
                            )

                        except Exception as e:
                            print(
                                f"Failed to create entity/relationship for {entity_name}: {e}"
                            )

                        break  # Only match first pattern for each fact


def create_friendship_relationship(speakers, graph_id="all_users_htn"):
    """Create friendship relationships between conversation participants"""
    if not zep_client or len(speakers) < 2:
        return

    try:
        speaker_list = list(speakers)
        for i in range(len(speaker_list)):
            for j in range(i + 1, len(speaker_list)):
                speaker1, speaker2 = speaker_list[i], speaker_list[j]

                # Create bidirectional friendship
                for source, target in [(speaker1, speaker2), (speaker2, speaker1)]:
                    friendship_data = {
                        "action": "Create_relationship",
                        "source_entity_type": "User",
                        "source_entity_name": source,
                        "target_entity_type": "User",
                        "target_entity_name": target,
                        "relationship_type": "FRIENDS_WITH",
                        "description": f"Friends based on conversation",
                    }

                    zep_client.graph.add(
                        graph_id=graph_id,
                        type="json",
                        data=json.dumps(friendship_data),
                    )

                print(f"Created friendship: {speaker1} <-> {speaker2}")

    except Exception as e:
        print(f"Failed to create friendship relationships: {e}")


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
        return (
            jsonify(
                {
                    "error": "OpenAI API key not configured. Please set OPENAI_API_KEY environment variable."
                }
            ),
            500,
        )

    audio_file = request.files["file"]

    # Extract additional form data
    conversation_id = request.form.get("conversationId", "")
    user_email = request.form.get("userEmail", "")
    user_name = request.form.get("userName", "")

    print(f"Processing transcription for conversation: {conversation_id}")
    print(f"User: {user_name} ({user_email})")

    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=os.path.splitext(audio_file.filename)[1]
        ) as temp:
            audio_file.save(temp.name)
            temp_path = temp.name

        # Transcribe with Whisper (verbose JSON for timestamps)
        transcription = client.audio.transcriptions.create(
            model="whisper-1",
            file=open(temp_path, "rb"),
            response_format="verbose_json",
        )

        # Single AI prompt to process everything
        segments = getattr(transcription, "segments", None)
        if segments:
            segment_text = "\n".join(
                [f"[{s.start:.2f}-{s.end:.2f}] {s.text.strip()}" for s in segments]
            )
        else:
            segment_text = f"[0.00-0.00] {transcription.text}"

        unified_prompt = f"""
You are an AI assistant that processes audio transcripts. Given the timestamped segments below, you must return a JSON object with exactly three fields: transcript, facts, and summary.

REQUIREMENTS:
0. Try to deduce the speakers' names from the transcript
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
    {{"speaker": "<Speaker 1>", "text": "utterance"}},
    {{"speaker": "<Speaker 2>", "text": "response"}}
  ],
  "facts": {{
    "<Speaker 1>": [
      "Concrete fact 1 about Speaker 1",
      "Concrete fact 2 about Speaker 1"
    ],
    "<Speaker 2>": [
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
            temperature=0,
        )

        result_json = response.choices[0].message.content.strip()

        # Clean up the result to ensure it's valid JSON
        if result_json.startswith("```json"):
            result_json = result_json[7:]
        if result_json.endswith("```"):
            result_json = result_json[:-3]
        result_json = result_json.strip()

        # Parse and return the structured result
        try:
            parsed_result = json.loads(result_json)

            # Process with Zep if available
            if (
                zep_client
                and parsed_result.get("facts")
                and parsed_result.get("transcript")
            ):
                try:
                    print("Processing conversation data with Zep...")

                    # Ensure graph exists
                    graph_id = "all_users_htn"
                    if ensure_graph_exists(graph_id):

                        # Get unique speakers from transcript
                        speakers = set()
                        for turn in parsed_result["transcript"]:
                            if turn.get("speaker"):
                                speakers.add(turn["speaker"])

                        print(f"Identified speakers: {list(speakers)}")

                        # Map speakers to real user info if available
                        speaker_mapping = {}
                        if user_name and user_email:
                            # Try to identify which speaker is the main user
                            # This is a simple heuristic - could be improved with better speaker identification
                            speaker_list = list(speakers)
                            if len(speaker_list) > 0:
                                # Assume first speaker or speaker with similar name is the main user
                                main_speaker = speaker_list[0]
                                for speaker in speaker_list:
                                    if (
                                        user_name.lower() in speaker.lower()
                                        or speaker.lower() in user_name.lower()
                                    ):
                                        main_speaker = speaker
                                        break

                                speaker_mapping[main_speaker] = {
                                    "name": user_name,
                                    "email": user_email,
                                    "conversation_id": conversation_id,
                                }
                                print(
                                    f"Mapped speaker '{main_speaker}' to user '{user_name}' ({user_email})"
                                )

                        # Create user entities for each speaker with enhanced info
                        for speaker in speakers:
                            if speaker in speaker_mapping:
                                # Create enhanced user entity with real info
                                user_info = speaker_mapping[speaker]
                                enhanced_speaker_name = (
                                    f"{user_info['name']} ({user_info['email']})"
                                )
                                create_user_entity(enhanced_speaker_name, graph_id)

                                # Also create with original speaker name for consistency
                                create_user_entity(speaker, graph_id)

                                # Create relationship between original and enhanced names
                                try:
                                    alias_data = {
                                        "action": "Create_relationship",
                                        "source_entity_type": "User",
                                        "source_entity_name": speaker,
                                        "target_entity_type": "User",
                                        "target_entity_name": enhanced_speaker_name,
                                        "relationship_type": "SAME_AS",
                                        "description": f"Speaker alias mapping for conversation {conversation_id}",
                                    }

                                    zep_client.graph.add(
                                        graph_id=graph_id,
                                        type="json",
                                        data=json.dumps(alias_data),
                                    )
                                    print(
                                        f"Created alias relationship: {speaker} -> {enhanced_speaker_name}"
                                    )
                                except Exception as e:
                                    print(f"Failed to create alias relationship: {e}")
                            else:
                                create_user_entity(speaker, graph_id)

                        # Extract and store entities from facts
                        extract_and_store_entities(
                            parsed_result["facts"], speakers, graph_id
                        )

                        # Create friendship relationships between speakers
                        create_friendship_relationship(speakers, graph_id)

                        # Add conversation summary to graph with metadata
                        if parsed_result.get("summary"):
                            try:
                                conversation_name = (
                                    f"Conversation_{conversation_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                                    if conversation_id
                                    else f"Conversation_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                                )

                                summary_data = {
                                    "action": "Create_entity",
                                    "entity_type": "Conversation",
                                    "name": conversation_name,
                                    "description": f"Summary: {parsed_result['summary']} | Participants: {', '.join(speakers)} | ConversationID: {conversation_id}",
                                }

                                zep_client.graph.add(
                                    graph_id=graph_id,
                                    type="json",
                                    data=json.dumps(summary_data),
                                )

                                # Create relationships between conversation and participants
                                for speaker in speakers:
                                    try:
                                        participation_data = {
                                            "action": "Create_relationship",
                                            "source_entity_type": "User",
                                            "source_entity_name": speaker,
                                            "target_entity_type": "Conversation",
                                            "target_entity_name": conversation_name,
                                            "relationship_type": "PARTICIPATED_IN",
                                            "description": f"Participated in conversation on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                                        }

                                        zep_client.graph.add(
                                            graph_id=graph_id,
                                            type="json",
                                            data=json.dumps(participation_data),
                                        )
                                    except Exception as e:
                                        print(
                                            f"Failed to create participation relationship for {speaker}: {e}"
                                        )

                                print(
                                    f"Added conversation summary to graph: {conversation_name}"
                                )
                            except Exception as e:
                                print(f"Failed to add conversation summary: {e}")

                        print("Successfully processed conversation data with Zep")
                    else:
                        print("Failed to ensure Zep graph exists")

                except Exception as e:
                    print(f"Error processing with Zep: {e}")
                    # Continue without Zep processing

            # Clean up temporary file
            os.unlink(temp_path)

            return jsonify(parsed_result)
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Raw result: {result_json}")

            # Clean up temporary file
            os.unlink(temp_path)

            # Return fallback response
            return jsonify(
                {
                    "transcript": [{"speaker": "Unknown", "text": transcription.text}],
                    "facts": {"Unknown": ["No facts could be extracted"]},
                    "summary": "Transcription completed but detailed analysis failed.",
                }
            )
        else:
            # Clean up temporary file
            os.unlink(temp_path)

            # Return fallback response
            return jsonify(
                {
                    "transcript": [{"speaker": "Unknown", "text": transcription.text}],
                    "facts": {"Unknown": ["No facts could be extracted"]},
                    "summary": "Transcription completed but detailed analysis failed.",
                }
            )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


def keep_alive():
    """Send a request to the health endpoint every 5 minutes to keep the server active"""

    def ping_server():
        while True:
            try:
                time.sleep(300)  # Wait 5 minutes
                # Get the server URL from environment or use localhost
                server_url = os.environ.get(
                    "RENDER_EXTERNAL_URL", "http://localhost:5000"
                )
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
