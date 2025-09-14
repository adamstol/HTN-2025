import { Zep, ZepError } from "@getzep/zep-cloud";
import { client } from "./client";

/**
 * Ensure user exists before performing operations
 */
async function ensureUserExists(userId: string): Promise<boolean> {
  try {
    await client.user.get(userId);
    return true;
  } catch (err: ZepError | unknown) {
    if (err instanceof ZepError && err.statusCode === 404) {
      console.log("User not found, creating:", userId);
      try {
        await client.user.add({
          userId,
          email: `${userId}@example.com`, // Default email
          firstName: "User",
          lastName: userId.substring(0, 8),
        });
        return true;
      } catch (createError) {
        console.error("Failed to create user:", createError);
        return false;
      }
    } else {
      console.error("Error checking user:", err);
      return false;
    }
  }
}

/**
 * Ensure thread exists for user before performing operations
 */
async function ensureThreadExists(userId: string): Promise<string | null> {
  const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const threadId = `${userId}-${weekNumber}`;
  
  try {
    await client.thread.get(threadId);
    return threadId;
  } catch (err: ZepError | unknown) {
    if (err instanceof ZepError && err.statusCode === 404) {
      console.log("Thread not found, creating:", threadId);
      try {
        await client.thread.create({ threadId, userId });
        return threadId;
      } catch (createError) {
        console.error("Failed to create thread:", createError);
        return null;
      }
    } else {
      console.error("Error checking thread:", err);
      return null;
    }
  }
}

/**
 * Ensure graph exists before performing operations
 */
async function ensureGraphExists(graphId: string): Promise<boolean> {
  try {
    await client.graph.get(graphId);
    return true;
  } catch (err: unknown) {
    console.log("Graph not found, creating:", graphId);
    try {
      await client.graph.create({ graphId });
      // Wait for graph to be created
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return true;
    } catch (createError) {
      console.error("Failed to create graph:", createError);
      return false;
    }
  }
}

/**
 * Search for friends of a user based on their relationships
 */
export async function searchUserFriends(opts: {
  userId: string;
  k?: number;
  minSimilarity?: number;
}): Promise<any[]> {
  const { userId, k = 10, minSimilarity = 0.2 } = opts;

  try {
    // Ensure user exists before proceeding
    const userExists = await ensureUserExists(userId);
    if (!userExists) {
      console.error("Failed to ensure user exists:", userId);
      return [];
    }

    // Ensure thread exists before proceeding
    const threadId = await ensureThreadExists(userId);
    if (!threadId) {
      console.error("Failed to ensure thread exists for user:", userId);
      return [];
    }

    const thread = await client.thread.get(threadId);

    // Filter messages that mention friends
    const friendMentions = thread.messages?.filter((message: any) =>
      message.content?.toLowerCase().includes('friend') ||
      message.content?.toLowerCase().includes('met') ||
      message.content?.toLowerCase().includes('know')
    ) ?? [];

    return friendMentions.slice(0, k);
  } catch (error) {
    console.error("Failed to search user friends:", error);
    return [];
  }
}

/**
 * Get all entities connected to a user (goals, languages, interests, etc.)
 */
export async function getUserConnectedEntities(opts: {
  userId: string;
  entityTypes?: string[];
}): Promise<Record<string, any[]>> {
  const { userId, entityTypes = ["Goal", "Language", "Topic", "Trait", "Organization"] } = opts;

  const results: Record<string, any[]> = {};

  try {
    // Ensure user exists before proceeding
    const userExists = await ensureUserExists(userId);
    if (!userExists) {
      console.error("Failed to ensure user exists:", userId);
      for (const entityType of entityTypes) {
        results[entityType] = [];
      }
      return results;
    }

    // Ensure thread exists before proceeding
    const threadId = await ensureThreadExists(userId);
    if (!threadId) {
      console.error("Failed to ensure thread exists for user:", userId);
      for (const entityType of entityTypes) {
        results[entityType] = [];
      }
      return results;
    }

    const thread = await client.thread.get(threadId);

    for (const entityType of entityTypes) {
      const entityMessages = thread.messages?.filter((message: any) => {
        const content = message.content?.toLowerCase() || '';
        switch (entityType) {
          case 'Goal':
            return content.includes('goal') || content.includes('want to') || content.includes('plan to');
          case 'Language':
            return content.includes('speak') || content.includes('language') || content.includes('fluent');
          case 'Topic':
            return content.includes('interest') || content.includes('like') || content.includes('enjoy');
          case 'Trait':
            return content.includes('personality') || content.includes('trait') || content.includes('character');
          case 'Organization':
            return content.includes('work') || content.includes('company') || content.includes('organization');
          default:
            return false;
        }
      }) ?? [];

      results[entityType] = entityMessages;
    }
  } catch (error) {
    console.error("Failed to get user connected entities:", error);
    for (const entityType of entityTypes) {
      results[entityType] = [];
    }
  }

  return results;
}

/**
 * Find potential matches based on shared interests, goals, or languages
 */
export async function findPotentialMatches(opts: {
  userId: string;
  matchCriteria?: ('goals' | 'languages' | 'interests' | 'traits')[];
  k?: number;
}): Promise<{
  friends: Zep.EntityNode[];
  sharedEntities: Record<string, Zep.EntityNode[]>;
}> {
  const { userId, matchCriteria = ['goals', 'languages', 'interests'], k = 5 } = opts;

  // Get user's connected entities
  const userEntities = await getUserConnectedEntities({ userId });

  // Find friends who share similar entities
  const friends = await searchUserFriends({ userId, k: k * 2 });

  const sharedEntities: Record<string, Zep.EntityNode[]> = {};

  // For each match criteria, find shared entities
  for (const criteria of matchCriteria) {
    const entityType = getEntityTypeFromCriteria(criteria);
    const userEntityNames = userEntities[entityType]?.map(e => e.name) ?? [];

    if (userEntityNames.length > 0) {
      // Search for entities with similar names
      for (const entityName of userEntityNames) {
        try {
          const searchResults = await client.graph.search({
            query: entityName,
            scope: "nodes",
            searchFilters: {
              nodeLabels: [entityType],
            },
            limit: 10,
          });

          if (!sharedEntities[criteria]) {
            sharedEntities[criteria] = [];
          }
          sharedEntities[criteria].push(...(searchResults.nodes ?? []));
        } catch (error) {
          console.error(`Failed to search for shared ${criteria}:`, error);
        }
      }
    }
  }

  return {
    friends: friends.slice(0, k),
    sharedEntities,
  };
}

/**
 * Get conversation insights for a user based on their graph data
 */
export async function getUserConversationInsights(opts: {
  userId: string;
}): Promise<{
  totalFriends: number;
  topGoals: string[];
  languages: string[];
  interests: string[];
  workPlaces: string[];
}> {
  const { userId } = opts;

  const connectedEntities = await getUserConnectedEntities({ userId });
  const friends = await searchUserFriends({ userId });

  return {
    totalFriends: friends.length,
    topGoals: connectedEntities.Goal?.slice(0, 5).map(g => g.name) ?? [],
    languages: connectedEntities.Language?.map(l => l.name) ?? [],
    interests: connectedEntities.Topic?.slice(0, 10).map(t => t.name) ?? [],
    workPlaces: connectedEntities.Organization?.map(o => o.name) ?? [],
  };
}

/**
 * Search for users with similar profiles based on conversation data
 */
export async function searchSimilarProfiles(opts: {
  userId: string;
  similarityThreshold?: number;
  k?: number;
}): Promise<{
  similarUsers: Zep.EntityNode[];
  commonalities: Record<string, string[]>;
}> {
  const { userId, similarityThreshold = 0.3, k = 5 } = opts;

  // Get user's profile
  const userEntities = await getUserConnectedEntities({ userId });

  // Search for other users (friends) in the graph
  const allFriends = await client.graph.search({
    query: "friend",
    scope: "nodes",
    searchFilters: {
      nodeLabels: ["Friend"],
    },
    limit: 50,
  });

  const similarUsers: Zep.EntityNode[] = [];
  const commonalities: Record<string, string[]> = {};

  // For each friend, calculate similarity
  for (const friend of allFriends.nodes ?? []) {
    if (friend.uuid === userId) continue;

    const friendEntities = await getUserConnectedEntities({
      userId: friend.uuid,
      entityTypes: ["Goal", "Language", "Topic", "Trait"]
    });

    const similarity = calculateProfileSimilarity(userEntities, friendEntities);

    if (similarity >= similarityThreshold) {
      similarUsers.push(friend);
      commonalities[friend.name] = findCommonEntities(userEntities, friendEntities);
    }
  }

  // Sort by similarity and return top k
  return {
    similarUsers: similarUsers.slice(0, k),
    commonalities,
  };
}

/**
 * Helper function to map criteria to entity types
 */
function getEntityTypeFromCriteria(criteria: string): string {
  const mapping: Record<string, string> = {
    'goals': 'Goal',
    'languages': 'Language',
    'interests': 'Topic',
    'traits': 'Trait',
  };
  return mapping[criteria] || 'Topic';
}

/**
 * Calculate similarity between two user profiles
 */
function calculateProfileSimilarity(
  userEntities: Record<string, Zep.EntityNode[]>,
  friendEntities: Record<string, Zep.EntityNode[]>
): number {
  let totalSimilarity = 0;
  let totalComparisons = 0;

  const entityTypes = ['Goal', 'Language', 'Topic', 'Trait'];

  for (const entityType of entityTypes) {
    const userNames = new Set(userEntities[entityType]?.map(e => e.name.toLowerCase()) ?? []);
    const friendNames = new Set(friendEntities[entityType]?.map(e => e.name.toLowerCase()) ?? []);

    if (userNames.size > 0 || friendNames.size > 0) {
      const intersection = new Set([...userNames].filter(x => friendNames.has(x)));
      const union = new Set([...userNames, ...friendNames]);

      const jaccardSimilarity = intersection.size / union.size;
      totalSimilarity += jaccardSimilarity;
      totalComparisons++;
    }
  }

  return totalComparisons > 0 ? totalSimilarity / totalComparisons : 0;
}

/**
 * Find common entities between two user profiles
 */
function findCommonEntities(
  userEntities: Record<string, Zep.EntityNode[]>,
  friendEntities: Record<string, Zep.EntityNode[]>
): string[] {
  const commonalities: string[] = [];

  const entityTypes = ['Goal', 'Language', 'Topic', 'Trait'];

  for (const entityType of entityTypes) {
    const userNames = new Set(userEntities[entityType]?.map(e => e.name.toLowerCase()) ?? []);
    const friendNames = new Set(friendEntities[entityType]?.map(e => e.name.toLowerCase()) ?? []);

    const common = [...userNames].filter(x => friendNames.has(x));
    commonalities.push(...common.map(name => `${entityType}: ${name}`));
  }

  return commonalities;
}

/**
 * Get conversation statistics for analytics
 */
export async function getConversationStatistics(): Promise<{
  totalUsers: number;
  totalFriends: number;
  totalGoals: number;
  totalLanguages: number;
  totalTopics: number;
  mostCommonGoals: string[];
  mostCommonLanguages: string[];
}> {
  const graphId = "all_users";
  
  // Ensure graph exists before proceeding
  const graphExists = await ensureGraphExists(graphId);
  if (!graphExists) {
    console.error("Failed to ensure graph exists:", graphId);
    return {
      totalUsers: 0,
      totalFriends: 0,
      totalGoals: 0,
      totalLanguages: 0,
      totalTopics: 0,
      mostCommonGoals: [],
      mostCommonLanguages: [],
    };
  }

  const entityTypes = ['User', 'Friend', 'Goal', 'Language', 'Topic'];
  const stats: Record<string, number> = {};

  for (const entityType of entityTypes) {
    try {
      const results = await client.graph.search({
        graphId,
        query: "",
        scope: "nodes",
        searchFilters: {
          nodeLabels: [entityType],
        },
        limit: 1000,
      });
      stats[entityType] = results.nodes?.length ?? 0;
    } catch (error) {
      console.error(`Failed to count ${entityType} entities:`, error);
      stats[entityType] = 0;
    }
  }

  // Get most common goals and languages
  try {
    const goalResults = await client.graph.search({
      graphId,
      query: "",
      scope: "nodes",
      searchFilters: { nodeLabels: ["Goal"] },
      limit: 100,
    });

    const languageResults = await client.graph.search({
      graphId,
      query: "",
      scope: "nodes",
      searchFilters: { nodeLabels: ["Language"] },
      limit: 100,
    });

    const goalCounts = countEntityFrequency(goalResults.nodes ?? []);
    const languageCounts = countEntityFrequency(languageResults.nodes ?? []);

    return {
      totalUsers: stats.User || 0,
      totalFriends: stats.Friend || 0,
      totalGoals: stats.Goal || 0,
      totalLanguages: stats.Language || 0,
      totalTopics: stats.Topic || 0,
      mostCommonGoals: Object.keys(goalCounts).slice(0, 5),
      mostCommonLanguages: Object.keys(languageCounts).slice(0, 5),
    };
  } catch (error) {
    console.error("Failed to get conversation statistics:", error);
    return {
      totalUsers: stats.User || 0,
      totalFriends: stats.Friend || 0,
      totalGoals: stats.Goal || 0,
      totalLanguages: stats.Language || 0,
      totalTopics: stats.Topic || 0,
      mostCommonGoals: [],
      mostCommonLanguages: [],
    };
  }
}

/**
 * Count frequency of entities by name
 */
function countEntityFrequency(entities: Zep.EntityNode[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const entity of entities) {
    counts[entity.name] = (counts[entity.name] || 0) + 1;
  }

  // Sort by frequency
  return Object.fromEntries(
    Object.entries(counts).sort(([, a], [, b]) => b - a)
  );
}
