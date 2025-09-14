#!/usr/bin/env python3
"""
Mock Data Ingestion Script for Zep Backend
Simulates conversations between university students/entrepreneurs
"""

import os
import sys
import json
from datetime import datetime, timedelta
import random
import time
import re
from dotenv import load_dotenv

# Zep imports
from zep_cloud import Zep

# Load environment variables
load_dotenv("config/.env", override=False)

# Configure Zep client
zep_api_key = os.getenv("ZEP_API_KEY")
if not zep_api_key:
    print("❌ ERROR: ZEP_API_KEY not found in environment variables")
    print("Please set your ZEP_API_KEY in the config/.env file")
    sys.exit(1)

zep_client = Zep(api_key=zep_api_key)
GRAPH_ID = "all_users_htn"


# Mock conversation data for ambitious university students/entrepreneurs
MOCK_CONVERSATIONS = [
    {
        "conversation_id": "conv_001",
        "user_email": "alex.chen@stanford.edu",
        "user_name": "Alex Chen",
        "transcript": [
            {
                "speaker": "Alex Chen",
                "text": "Hey Sarah! How's your startup going? I heard you just closed your seed round.",
            },
            {
                "speaker": "Sarah Kim",
                "text": "Alex! Yes, we raised $500K last month. It's been crazy balancing this with my CS degree at MIT.",
            },
            {
                "speaker": "Alex Chen",
                "text": "That's amazing! I'm working on my fintech app while finishing my MBA at Stanford. Planning to launch next semester.",
            },
            {
                "speaker": "Sarah Kim",
                "text": "Nice! Are you still doing that accelerator program in Singapore this summer?",
            },
            {
                "speaker": "Alex Chen",
                "text": "Yes! Techstars Asia. I'll be there for 3 months, then flying to London to meet some VCs.",
            },
            {
                "speaker": "Sarah Kim",
                "text": "I love traveling for business. Just got back from Berlin - met some incredible mentors there.",
            },
        ],
        "facts": {
            "Alex Chen": [
                "Alex is pursuing an MBA at Stanford University",
                "Alex is building a fintech application",
                "Alex plans to launch his app next semester",
                "Alex is participating in Techstars Asia accelerator program",
                "Alex will be in Singapore for 3 months",
                "Alex is traveling to London to meet venture capitalists",
                "Alex loves entrepreneurship and technology",
            ],
            "Sarah Kim": [
                "Sarah is studying Computer Science at MIT",
                "Sarah runs a startup that raised $500K in seed funding",
                "Sarah closed her seed round last month",
                "Sarah recently traveled to Berlin for business",
                "Sarah met mentors in Berlin",
                "Sarah balances her startup with her CS degree",
            ],
        },
        "summary": "Conversation between two student entrepreneurs discussing their startups, funding, education, and international business travel.",
    },
    {
        "conversation_id": "conv_002",
        "user_email": "marcus.rodriguez@harvard.edu",
        "user_name": "Marcus Rodriguez",
        "transcript": [
            {
                "speaker": "Marcus Rodriguez",
                "text": "Emma, I just got accepted to Y Combinator! Can't believe it.",
            },
            {
                "speaker": "Emma Thompson",
                "text": "Marcus, that's incredible! What's your startup about again?",
            },
            {
                "speaker": "Marcus Rodriguez",
                "text": "We're building an AI platform for sustainable agriculture. I'm so passionate about climate tech.",
            },
            {
                "speaker": "Emma Thompson",
                "text": "That's perfect for you - I remember you mentioning your environmental engineering background at Harvard.",
            },
            {
                "speaker": "Marcus Rodriguez",
                "text": "Exactly! I'm taking a gap year to focus on this. My mentor from Sequoia Capital thinks we have huge potential.",
            },
            {
                "speaker": "Emma Thompson",
                "text": "I'm jealous! I'm still grinding through my economics degree at Wharton, but I'm launching my e-commerce platform soon.",
            },
            {
                "speaker": "Marcus Rodriguez",
                "text": "You should come to the YC Demo Day in San Francisco. Great networking opportunity.",
            },
            {
                "speaker": "Emma Thompson",
                "text": "Definitely! I love meeting other entrepreneurs. Just got back from a startup conference in Austin.",
            },
        ],
        "facts": {
            "Marcus Rodriguez": [
                "Marcus was accepted to Y Combinator accelerator",
                "Marcus is building an AI platform for sustainable agriculture",
                "Marcus is passionate about climate technology",
                "Marcus studies environmental engineering at Harvard University",
                "Marcus is taking a gap year to focus on his startup",
                "Marcus has a mentor from Sequoia Capital",
                "Marcus believes his startup has huge potential",
            ],
            "Emma Thompson": [
                "Emma is studying economics at Wharton School",
                "Emma is launching an e-commerce platform",
                "Emma recently attended a startup conference in Austin",
                "Emma enjoys networking with other entrepreneurs",
                "Emma is still completing her degree while building her business",
            ],
        },
        "summary": "Student entrepreneurs discussing Y Combinator acceptance, climate tech startup, and balancing education with entrepreneurship.",
    },
    {
        "conversation_id": "conv_003",
        "user_email": "priya.patel@berkeley.edu",
        "user_name": "Priya Patel",
        "transcript": [
            {
                "speaker": "Priya Patel",
                "text": "David, how was your trip to Tokyo? I saw your LinkedIn posts about the startup ecosystem there.",
            },
            {
                "speaker": "David Lee",
                "text": "Priya! It was amazing. Met with SoftBank and several Japanese VCs about expanding to Asia.",
            },
            {
                "speaker": "Priya Patel",
                "text": "That's so cool! I'm actually planning to study abroad in Seoul next semester while working on my EdTech startup.",
            },
            {
                "speaker": "David Lee",
                "text": "Perfect timing! The Korean market is huge for education technology. Are you still at UC Berkeley?",
            },
            {
                "speaker": "Priya Patel",
                "text": "Yes, finishing my computer science degree. My startup helps students learn coding through gamification.",
            },
            {
                "speaker": "David Lee",
                "text": "I love that! My mentor from Andreessen Horowitz always says EdTech is the future. You should meet him.",
            },
            {
                "speaker": "Priya Patel",
                "text": "That would be incredible! I'm always looking to connect with experienced investors and mentors.",
            },
            {
                "speaker": "David Lee",
                "text": "I'll make the intro. By the way, are you coming to TechCrunch Disrupt in San Francisco next month?",
            },
        ],
        "facts": {
            "Priya Patel": [
                "Priya is studying computer science at UC Berkeley",
                "Priya is building an EdTech startup",
                "Priya's startup helps students learn coding through gamification",
                "Priya is planning to study abroad in Seoul next semester",
                "Priya wants to expand her startup to the Korean market",
                "Priya is interested in connecting with investors and mentors",
            ],
            "David Lee": [
                "David recently traveled to Tokyo for business",
                "David met with SoftBank and Japanese venture capitalists",
                "David is exploring expansion to Asian markets",
                "David has a mentor from Andreessen Horowitz",
                "David believes EdTech is the future",
                "David plans to attend TechCrunch Disrupt in San Francisco",
            ],
        },
        "summary": "Conversation about international business expansion, EdTech startups, and networking in the Asian startup ecosystem.",
    },
    {
        "conversation_id": "conv_004",
        "user_email": "james.wilson@upenn.edu",
        "user_name": "James Wilson",
        "transcript": [
            {
                "speaker": "James Wilson",
                "text": "Lisa, I just pitched to Kleiner Perkins yesterday. The partner loved our blockchain solution!",
            },
            {
                "speaker": "Lisa Chang",
                "text": "James, that's fantastic! How do you balance all this with your finance courses at Penn?",
            },
            {
                "speaker": "James Wilson",
                "text": "It's tough, but I'm passionate about decentralized finance. I study between investor meetings.",
            },
            {
                "speaker": "Lisa Chang",
                "text": "I totally get it. I'm juggling my biotech startup with my PhD in biochemistry at Columbia.",
            },
            {
                "speaker": "James Wilson",
                "text": "That's impressive! Are you still working with that mentor from Johnson & Johnson?",
            },
            {
                "speaker": "Lisa Chang",
                "text": "Yes, she's been incredible. Just helped me navigate a partnership with a pharmaceutical company.",
            },
            {
                "speaker": "James Wilson",
                "text": "Amazing! I'm flying to Dubai next week to meet with some crypto investors there.",
            },
            {
                "speaker": "Lisa Chang",
                "text": "I love how global entrepreneurship has become. I was just in Switzerland meeting with biotech VCs.",
            },
        ],
        "facts": {
            "James Wilson": [
                "James recently pitched to Kleiner Perkins venture capital",
                "James is building a blockchain solution for decentralized finance",
                "James is passionate about decentralized finance and cryptocurrency",
                "James studies finance at University of Pennsylvania",
                "James balances investor meetings with his academic studies",
                "James is traveling to Dubai to meet cryptocurrency investors",
            ],
            "Lisa Chang": [
                "Lisa is pursuing a PhD in biochemistry at Columbia University",
                "Lisa runs a biotech startup",
                "Lisa has a mentor from Johnson & Johnson",
                "Lisa recently secured a partnership with a pharmaceutical company",
                "Lisa traveled to Switzerland to meet with biotech venture capitalists",
                "Lisa balances her PhD studies with running her startup",
            ],
        },
        "summary": "Discussion between student entrepreneurs in blockchain/DeFi and biotech, covering investor pitches and global business travel.",
    },
    {
        "conversation_id": "conv_005",
        "user_email": "sophia.garcia@caltech.edu",
        "user_name": "Sophia Garcia",
        "transcript": [
            {
                "speaker": "Sophia Garcia",
                "text": "Ryan, I heard you got into the Thiel Fellowship program! That's incredible.",
            },
            {
                "speaker": "Ryan Park",
                "text": "Thanks Sophia! I'm dropping out of my engineering program at Caltech to focus on my robotics startup full-time.",
            },
            {
                "speaker": "Sophia Garcia",
                "text": "That's so brave! I'm still finishing my AI research at Caltech while building my machine learning platform.",
            },
            {
                "speaker": "Ryan Park",
                "text": "You're smart to finish your degree. My mentor from Google Ventures says having that foundation is valuable.",
            },
            {
                "speaker": "Sophia Garcia",
                "text": "Exactly! I want to travel to Israel next summer to study their AI ecosystem and meet some investors there.",
            },
            {
                "speaker": "Ryan Park",
                "text": "Israel has an amazing tech scene! I was just in Tel Aviv last month meeting with robotics companies.",
            },
            {
                "speaker": "Sophia Garcia",
                "text": "Did you connect with any good mentors there? I'm always looking to expand my network.",
            },
            {
                "speaker": "Ryan Park",
                "text": "Yes! Met some brilliant entrepreneurs. I'll introduce you - they love supporting young founders.",
            },
        ],
        "facts": {
            "Sophia Garcia": [
                "Sophia is conducting AI research at Caltech",
                "Sophia is building a machine learning platform",
                "Sophia is finishing her degree while running her startup",
                "Sophia plans to travel to Israel to study their AI ecosystem",
                "Sophia wants to meet investors in Israel",
                "Sophia is interested in expanding her professional network",
            ],
            "Ryan Park": [
                "Ryan was accepted to the Thiel Fellowship program",
                "Ryan is dropping out of his engineering program at Caltech",
                "Ryan runs a robotics startup",
                "Ryan has a mentor from Google Ventures",
                "Ryan recently traveled to Tel Aviv to meet robotics companies",
                "Ryan connected with entrepreneurs and mentors in Israel",
            ],
        },
        "summary": "Conversation about the Thiel Fellowship, balancing education with entrepreneurship, and international networking in tech ecosystems.",
    },
]


def ensure_graph_exists():
    """Ensure the Zep graph exists, create if it doesn't"""
    try:
        zep_client.graph.get(GRAPH_ID)
        print(f"✅ Graph '{GRAPH_ID}' already exists")
        return True
    except Exception:
        try:
            zep_client.graph.create(graph_id=GRAPH_ID)
            time.sleep(1)  # Wait for creation
            print(f"✅ Created Zep graph: {GRAPH_ID}")
            return True
        except Exception as e:
            print(f"❌ Failed to create Zep graph: {e}")
            return False


def create_user_entity(speaker_name):
    """Create a user entity in the Zep graph"""
    try:
        # Check if user already exists
        search_results = zep_client.graph.search(
            graph_id=GRAPH_ID,
            query=speaker_name,
            scope="nodes",
            search_filters={"node_labels": ["User"]},
            limit=1,
        )

        if search_results.nodes and len(search_results.nodes) > 0:
            print(f"   User {speaker_name} already exists")
            return True

        # Create user entity
        user_data = {
            "action": "Create_entity",
            "entity_type": "User",
            "name": speaker_name,
            "description": f"University student entrepreneur: {speaker_name}",
        }

        zep_client.graph.add(
            graph_id=GRAPH_ID,
            type="json",
            data=json.dumps(user_data),
        )

        print(f"   ✅ Created user entity: {speaker_name}")
        return True

    except Exception as e:
        print(f"   ❌ Failed to create user entity {speaker_name}: {e}")
        return False


def extract_and_store_entities(facts, speakers):
    """Extract entities from facts and store them in Zep graph"""
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
            r"(?:studies at|student at|attending)\s+(.+)",
            r"(?:university|college|school)\s+(.+)",
        ],
        "Topic": [
            r"(?:interested in|likes|enjoys|passionate about|loves|into)\s+(.+)",
            r"(?:my interest is|i like|i enjoy|i love)\s+(.+)",
            r"(?:building|creating|developing)\s+(.+)",
        ],
        "Trait": [
            r"(?:is|personality|character).*?(outgoing|introverted|friendly|shy|confident|creative|analytical|organized|spontaneous|patient|ambitious|calm|energetic)",
            r"(?:i am|i'm)\s+(outgoing|introverted|friendly|shy|confident|creative|analytical|organized|spontaneous|patient|ambitious|calm|energetic)",
        ],
    }

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
                            "it", "that", "this", "them"
                        ]:
                            continue

                        # Create entity if it doesn't exist
                        try:
                            search_results = zep_client.graph.search(
                                graph_id=GRAPH_ID,
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
                                    graph_id=GRAPH_ID,
                                    type="json",
                                    data=json.dumps(entity_data),
                                )

                                print(f"   ✅ Created {entity_type}: {entity_name}")

                            # Create relationship between user and entity
                            relationship_types = {
                                "Goal": "HAS_GOAL",
                                "Language": "SPEAKS",
                                "Organization": "STUDIES_AT",
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
                                graph_id=GRAPH_ID,
                                type="json",
                                data=json.dumps(relationship_data),
                            )

                            print(f"   ✅ {speaker} -> {relationship_types[entity_type]} -> {entity_name}")

                        except Exception as e:
                            print(f"   ❌ Failed to create entity/relationship for {entity_name}: {e}")

                        break  # Only match first pattern for each fact


def create_friendship_relationship(speakers):
    """Create friendship relationships between conversation participants"""
    if len(speakers) < 2:
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
                        "description": f"Connected through conversation",
                    }

                    zep_client.graph.add(
                        graph_id=GRAPH_ID,
                        type="json",
                        data=json.dumps(friendship_data),
                    )

                print(f"   ✅ Created friendship: {speaker1} <-> {speaker2}")

    except Exception as e:
        print(f"   ❌ Failed to create friendship relationships: {e}")


def process_mock_conversation(conversation_data):
    """Process a mock conversation and add it to Zep graph"""
    try:
        print(f"📝 Processing: {conversation_data['conversation_id']}")
        print(f"   User: {conversation_data['user_name']} ({conversation_data['user_email']})")

        # Get unique speakers from transcript
        speakers = set()
        for turn in conversation_data["transcript"]:
            if turn.get("speaker"):
                speakers.add(turn["speaker"])

        print(f"   Speakers: {list(speakers)}")

        # Create user entities for each speaker
        for speaker in speakers:
            create_user_entity(speaker)

        # Extract and store entities from facts
        extract_and_store_entities(conversation_data["facts"], speakers)

        # Create friendship relationships between speakers
        create_friendship_relationship(speakers)

        # Add conversation summary to graph
        if conversation_data.get("summary"):
            try:
                conversation_name = f"Conversation_{conversation_data['conversation_id']}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

                summary_data = {
                    "action": "Create_entity",
                    "entity_type": "Conversation",
                    "name": conversation_name,
                    "description": f"Summary: {conversation_data['summary']} | Participants: {', '.join(speakers)} | ConversationID: {conversation_data['conversation_id']}",
                }

                zep_client.graph.add(
                    graph_id=GRAPH_ID,
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
                            graph_id=GRAPH_ID,
                            type="json",
                            data=json.dumps(participation_data),
                        )
                    except Exception as e:
                        print(f"   ❌ Failed to create participation relationship for {speaker}: {e}")

                print(f"   ✅ Added conversation summary: {conversation_name}")
            except Exception as e:
                print(f"   ❌ Failed to add conversation summary: {e}")

        print(f"✅ Successfully processed conversation {conversation_data['conversation_id']}")
        return True

    except Exception as e:
        print(f"❌ Error processing conversation {conversation_data['conversation_id']}: {e}")
        return False


def main():
    """Main function to ingest all mock conversations"""
    print("🚀 Starting mock data ingestion for Zep backend...")
    print(f"🔑 Using Zep API Key: {'Yes' if zep_api_key else 'No'}")
    print(f"📊 Total conversations to ingest: {len(MOCK_CONVERSATIONS)}")
    print(f"🗂️  Target graph: {GRAPH_ID}")
    print("-" * 60)

    # Ensure graph exists
    if not ensure_graph_exists():
        print("❌ Failed to create/access Zep graph. Exiting.")
        return

    success_count = 0

    for i, conversation in enumerate(MOCK_CONVERSATIONS, 1):
        print(f"\n📝 Processing conversation {i}/{len(MOCK_CONVERSATIONS)}")

        if process_mock_conversation(conversation):
            success_count += 1

        # Add small delay between operations
        time.sleep(1)

    print("\n" + "=" * 60)
    print(f"🎉 Ingestion complete!")
    print(
        f"✅ Successfully ingested: {success_count}/{len(MOCK_CONVERSATIONS)} conversations"
    )

    if success_count == len(MOCK_CONVERSATIONS):
        print("🌟 All conversations were successfully processed and stored in Zep!")
    else:
        print(
            f"⚠️  {len(MOCK_CONVERSATIONS) - success_count} conversations failed to process"
        )

    print(f"\n🔍 Your Zep graph '{GRAPH_ID}' now contains:")
    print("   • University students from top schools (Stanford, MIT, Harvard, etc.)")
    print("   • Young entrepreneurs with funded startups")
    print("   • Global travelers meeting investors and mentors")
    print("   • Connections across fintech, AI, biotech, blockchain, and more")
    print("   • Rich relationship data for networking and matching")
    print(f"\n🌐 Access your graph at: https://cloud.getzep.com/graphs/{GRAPH_ID}")


if __name__ == "__main__":
    main()
