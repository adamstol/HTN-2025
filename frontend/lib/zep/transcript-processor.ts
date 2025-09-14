import { client } from "./client";
import { ConversationTurn, TranscriptResponse } from "../transcripts/client";

// Types for the backend transcript schema
export interface BackendTranscriptData {
  transcript: ConversationTurn[];
  facts: Record<string, string[]>;
  summary: string;
}

// Types for processed entities
export interface ProcessedFriend {
  name: string;
  speaker: string;
  facts: string[];
}

export interface ProcessedEntity {
  type: 'Goal' | 'Trait' | 'Language' | 'Topic' | 'Organization';
  name: string;
  description?: string;
  speaker: string;
  fact: string;
}

/**
 * Extract friend names from conversation participants
 * Identifies speakers other than the main user and creates friend entities
 */
export function extractFriendsFromTranscript(transcript: ConversationTurn[], mainUserName?: string): ProcessedFriend[] {
  const speakers = new Set<string>();
  const speakerFacts: Record<string, string[]> = {};

  // Collect all unique speakers
  transcript.forEach(turn => {
    speakers.add(turn.speaker);
  });

  // Filter out the main user (if provided) and system speakers
  const friendSpeakers = Array.from(speakers).filter(speaker =>
    speaker !== mainUserName &&
    !speaker.toLowerCase().includes('system') &&
    !speaker.toLowerCase().includes('assistant') &&
    speaker !== 'Speaker 1' // Keep generic speakers as they represent friends
  );

  return friendSpeakers.map(speaker => ({
    name: extractNameFromSpeaker(speaker),
    speaker,
    facts: speakerFacts[speaker] || []
  }));
}

/**
 * Extract actual name from speaker identifier
 * Handles cases like "Speaker 2", "John", "John Smith", etc.
 */
function extractNameFromSpeaker(speaker: string): string {
  // If it's a generic speaker label, try to infer name from context
  if (speaker.startsWith('Speaker ')) {
    return speaker; // Keep as is for now, could be enhanced with name detection
  }
  return speaker;
}

/**
 * Process facts and extract entities for graph creation
 */
export function extractEntitiesFromFacts(facts: Record<string, string[]>): ProcessedEntity[] {
  const entities: ProcessedEntity[] = [];

  Object.entries(facts).forEach(([speaker, speakerFacts]) => {
    speakerFacts.forEach(fact => {
      // Extract goals (wants to, plans to, hopes to, aims to)
      const goalPatterns = [
        /(?:wants to|plans to|hopes to|aims to|goal is to|trying to)\s+(.+)/i,
        /(?:my goal is|i want to|i plan to|i hope to|i aim to)\s+(.+)/i
      ];

      goalPatterns.forEach(pattern => {
        const match = fact.match(pattern);
        if (match) {
          entities.push({
            type: 'Goal',
            name: match[1].trim(),
            description: fact,
            speaker,
            fact
          });
        }
      });

      // Extract languages (speaks, knows, fluent in)
      const languagePatterns = [
        /(?:speaks|knows|fluent in|can speak)\s+([\w\s]+?)(?:\s+(?:language|fluently))?/i,
        /(?:native|bilingual|multilingual)\s+(?:in\s+)?([\w\s]+)/i
      ];

      languagePatterns.forEach(pattern => {
        const match = fact.match(pattern);
        if (match) {
          const language = match[1].trim();
          if (isValidLanguage(language)) {
            entities.push({
              type: 'Language',
              name: language,
              description: fact,
              speaker,
              fact
            });
          }
        }
      });

      // Extract work/organization (works at, employed by, job at)
      const workPatterns = [
        /(?:works at|employed by|job at|working at)\s+(.+)/i,
        /(?:my job is at|i work at|employed at)\s+(.+)/i
      ];

      workPatterns.forEach(pattern => {
        const match = fact.match(pattern);
        if (match) {
          entities.push({
            type: 'Organization',
            name: match[1].trim(),
            description: fact,
            speaker,
            fact
          });
        }
      });

      // Extract interests/topics (interested in, likes, enjoys, passionate about)
      const interestPatterns = [
        /(?:interested in|likes|enjoys|passionate about|loves|into)\s+(.+)/i,
        /(?:my interest is|i like|i enjoy|i love)\s+(.+)/i
      ];

      interestPatterns.forEach(pattern => {
        const match = fact.match(pattern);
        if (match) {
          entities.push({
            type: 'Topic',
            name: match[1].trim(),
            description: fact,
            speaker,
            fact
          });
        }
      });

      // Extract traits/personality (is, personality, character)
      const traitPatterns = [
        /(?:is|personality|character).*?(outgoing|introverted|friendly|shy|confident|creative|analytical|organized|spontaneous|patient|ambitious|calm|energetic)/i,
        /(?:very|quite|really|extremely)\s+(outgoing|introverted|friendly|shy|confident|creative|analytical|organized|spontaneous|patient|ambitious|calm|energetic)/i
      ];

      traitPatterns.forEach(pattern => {
        const match = fact.match(pattern);
        if (match) {
          entities.push({
            type: 'Trait',
            name: match[1].trim(),
            description: fact,
            speaker,
            fact
          });
        }
      });
    });
  });

  return entities;
}

/**
 * Check if a string represents a valid language
 */
function isValidLanguage(language: string): boolean {
  const commonLanguages = [
    'english', 'spanish', 'french', 'german', 'italian', 'portuguese', 'russian',
    'chinese', 'japanese', 'korean', 'arabic', 'hindi', 'bengali', 'punjabi',
    'urdu', 'persian', 'turkish', 'dutch', 'swedish', 'norwegian', 'danish',
    'polish', 'czech', 'hungarian', 'romanian', 'bulgarian', 'serbian',
    'croatian', 'slovenian', 'slovak', 'lithuanian', 'latvian', 'estonian',
    'finnish', 'greek', 'hebrew', 'thai', 'vietnamese', 'indonesian', 'malay',
    'tagalog', 'swahili', 'amharic', 'yoruba', 'igbo', 'hausa'
  ];

  return commonLanguages.some(lang =>
    language.toLowerCase().includes(lang) ||
    lang.includes(language.toLowerCase())
  );
}

/**
 * Store friend information in user threads
 */
export async function storeFriendEntities(friends: ProcessedFriend[], userId: string): Promise<void> {
  for (const friend of friends) {
    try {
      // Ensure user exists
      try {
        await client.user.get(userId);
      } catch (error) {
        console.log("User not found, creating:", userId);
        await client.user.add({
          userId,
          email: `${userId}@example.com`,
          firstName: "User",
          lastName: userId.substring(0, 8),
        });
      }

      // Create or get thread for this user
      const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
      const threadId = `${userId}-${weekNumber}`;
      
      try {
        await client.thread.get(threadId);
      } catch (error) {
        console.log("Thread not found, creating:", threadId);
        await client.thread.create({ threadId, userId });
      }

      // Add friend information as a message
      const friendMessage = {
        role: "system" as const,
        content: `Friend identified: ${friend.name} (Speaker: ${friend.speaker})`,
        name: "System",
        createdAt: new Date().toISOString(),
      };

      await client.thread.addMessages(threadId, { 
        messages: [friendMessage],
        returnContext: false 
      });

      console.log(`Stored friend entity: ${friend.name}`);
    } catch (error) {
      console.error(`Failed to store friend entity ${friend.name}:`, error);
    }
  }
}

/**
 * Store entities and relationships in user threads
 */
export async function storeEntitiesAndRelationships(
  entities: ProcessedEntity[],
  friends: ProcessedFriend[],
  mainUserId: string
): Promise<void> {
  try {
    // Ensure user exists
    try {
      await client.user.get(mainUserId);
    } catch (error) {
      console.log("User not found, creating:", mainUserId);
      await client.user.add({
        userId: mainUserId,
        email: `${mainUserId}@example.com`,
        firstName: "User",
        lastName: mainUserId.substring(0, 8),
      });
    }

    // Create or get thread for this user
    const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    const threadId = `${mainUserId}-${weekNumber}`;
    
    try {
      await client.thread.get(threadId);
    } catch (error) {
      console.log("Thread not found, creating:", threadId);
      await client.thread.create({ threadId, userId: mainUserId });
    }

    // Store entities as messages
    for (const entity of entities) {
      try {
        const isMainUser = entity.speaker === 'Speaker 1' || entity.speaker === mainUserId;
        const speakerName = isMainUser ? 'User' : friends.find(f => f.speaker === entity.speaker)?.name || entity.speaker;
        
        const entityMessage = {
          role: "system" as const,
          content: `${entity.type}: ${speakerName} - ${entity.name} (${entity.fact})`,
          name: "System",
          createdAt: new Date().toISOString(),
        };

        await client.thread.addMessages(threadId, { 
          messages: [entityMessage],
          returnContext: false 
        });

        console.log(`Stored ${entity.type} entity: ${entity.name} for ${speakerName}`);
      } catch (error) {
        console.error(`Failed to store ${entity.type} entity ${entity.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to store entities and relationships:", error);
  }
}

/**
 * Store friendship relationships in user threads
 */
export async function storeFriendshipRelationships(
  friends: ProcessedFriend[],
  mainUserId: string
): Promise<void> {
  try {
    // Ensure user exists
    try {
      await client.user.get(mainUserId);
    } catch (error) {
      console.log("User not found, creating:", mainUserId);
      await client.user.add({
        userId: mainUserId,
        email: `${mainUserId}@example.com`,
        firstName: "User",
        lastName: mainUserId.substring(0, 8),
      });
    }

    // Create or get thread for this user
    const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    const threadId = `${mainUserId}-${weekNumber}`;
    
    try {
      await client.thread.get(threadId);
    } catch (error) {
      console.log("Thread not found, creating:", threadId);
      await client.thread.create({ threadId, userId: mainUserId });
    }

    for (const friend of friends) {
      try {
        // Store friendship as a message
        const friendshipMessage = {
          role: "system" as const,
          content: `Friendship: User is friends with ${friend.name} (based on conversation)`,
          name: "System",
          createdAt: new Date().toISOString(),
        };

        await client.thread.addMessages(threadId, { 
          messages: [friendshipMessage],
          returnContext: false 
        });

        console.log(`Stored friendship: User -> FRIENDS_WITH -> ${friend.name}`);
      } catch (error) {
        console.error(`Failed to store friendship with ${friend.name}:`, error);
      }
    }
  } catch (error) {
    console.error("Failed to store friendship relationships:", error);
  }
}

/**
 * Main function to process transcript data and store in user threads
 */
export async function processTranscriptAndUpdateGraph(
  transcriptData: BackendTranscriptData,
  mainUserId: string,
  mainUserName?: string
): Promise<void> {
  try {
    // Extract friends from transcript
    const friends = extractFriendsFromTranscript(transcriptData.transcript, mainUserName);
    console.log(`Extracted ${friends.length} friends from transcript`);

    // Extract entities from facts
    const entities = extractEntitiesFromFacts(transcriptData.facts);
    console.log(`Extracted ${entities.length} entities from facts`);

    // Store friend entities in user threads
    await storeFriendEntities(friends, mainUserId);

    // Store other entities and their relationships in user threads
    await storeEntitiesAndRelationships(entities, friends, mainUserId);

    // Store friendship relationships in user threads
    await storeFriendshipRelationships(friends, mainUserId);

    // Add the conversation summary as context to user thread
    if (transcriptData.summary) {
      try {
        // Ensure user exists
        try {
          await client.user.get(mainUserId);
        } catch (error) {
          console.log("User not found, creating:", mainUserId);
          await client.user.add({
            userId: mainUserId,
            email: `${mainUserId}@example.com`,
            firstName: "User",
            lastName: mainUserId.substring(0, 8),
          });
        }

        // Create or get thread for this user
        const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
        const threadId = `${mainUserId}-${weekNumber}`;
        
        try {
          await client.thread.get(threadId);
        } catch (error) {
          console.log("Thread not found, creating:", threadId);
          await client.thread.create({ threadId, userId: mainUserId });
        }

        const summaryMessage = {
          role: "system" as const,
          content: `Conversation summary: ${transcriptData.summary}`,
          name: "System",
          createdAt: new Date().toISOString(),
        };

        await client.thread.addMessages(threadId, { 
          messages: [summaryMessage],
          returnContext: false 
        });
      } catch (error) {
        console.error("Failed to store conversation summary:", error);
      }
    }

    console.log("Successfully processed transcript and updated user threads");
  } catch (error) {
    console.error("Failed to process transcript and update user threads:", error);
    throw error;
  }
}

/**
 * Helper function to get language code from language name
 */
export function getLanguageCode(languageName: string): string {
  const languageCodes: Record<string, string> = {
    'english': 'eng',
    'spanish': 'spa',
    'french': 'fra',
    'german': 'deu',
    'italian': 'ita',
    'portuguese': 'por',
    'russian': 'rus',
    'chinese': 'zho',
    'japanese': 'jpn',
    'korean': 'kor',
    'arabic': 'ara',
    'hindi': 'hin',
    'bengali': 'ben',
    'punjabi': 'pan',
    'urdu': 'urd',
    'persian': 'fas',
    'turkish': 'tur',
    'dutch': 'nld',
    'swedish': 'swe',
    'norwegian': 'nor',
    'danish': 'dan',
    'polish': 'pol',
    'czech': 'ces',
    'hungarian': 'hun',
    'romanian': 'ron',
    'bulgarian': 'bul',
    'serbian': 'srp',
    'croatian': 'hrv',
    'slovenian': 'slv',
    'slovak': 'slk',
    'lithuanian': 'lit',
    'latvian': 'lav',
    'estonian': 'est',
    'finnish': 'fin',
    'greek': 'ell',
    'hebrew': 'heb',
    'thai': 'tha',
    'vietnamese': 'vie',
    'indonesian': 'ind',
    'malay': 'msa',
    'tagalog': 'tgl',
    'swahili': 'swa',
    'amharic': 'amh',
    'yoruba': 'yor',
    'igbo': 'ibo',
    'hausa': 'hau'
  };

  const normalizedName = languageName.toLowerCase().trim();
  return languageCodes[normalizedName] || normalizedName.substring(0, 3);
}
