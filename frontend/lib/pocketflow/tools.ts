import { tool } from "ai";
import { z } from 'zod';
import { searchClubs } from "../supabase/queries";
import { figureOutIntention, sendWarmIntro } from "./utils";
import { extractUserInfoAndConnections, getStudentNode, searchPeople } from "../zep/queries";
import { env } from "../constants";

export const clubRecommendationTool = tool({
  description: `You have extensive knowledge on all the clubs in the University of ${env.LOCATION_ID === "uofc" ? "Calgary" : "Waterloo"}, and your goal is to provide information on university clubs in ${env.LOCATION_ID === "uofc" ? "UCalgary" : "UWaterloo"}. Whether the user is looking for clubs that match their interests and preferences or just want to learn more about a club. You should use this tool to get the information needed to answer the user\'s query appropriately.`,
  inputSchema: z.object({
    intent: z.enum(['club_recommendation', 'club_info']),
    keyInfo: z.string().describe("The key information that we need. Whether it's the user looking for clubs that match their interests and preferences or just want to learn more about a club. Make it very thorough and accurate."),
    interests: z.array(z.string()).describe('User interests and hobbies').optional(),
    preferences: z.string().describe('Additional preferences or requirements').optional(),
  }),
  execute: async ({ intent, keyInfo, interests, preferences }) => {
    // Combine all info for search
    const searchQuery = [
      intent === 'club_recommendation' ? 'recommend clubs for the user' : 'extract club information',
      keyInfo,
      interests?.join(' '),
      preferences
    ].filter(Boolean).join(' ');

    console.log("Search query:", searchQuery);

    const clubs = await searchClubs({ query: searchQuery });

    if (clubs.length === 0) {
      return {
        success: false,
        message: "There are no clubs that match the query. Continue learning more about the user to find the perfect club for them."
      };
    }

    // Format club recommendations
    const recommendations = clubs.slice(0, 5).map((club, idx) => ({
      // rank: idx + 1,
      name: club.name,
      description: club.description,
      summary: club.summary,
      similarity: club.similarity,
      url: club.url,
    }));
    console.log("Recommendations:", recommendations);
    return {
      success: true,
      clubs: recommendations,
      totalFound: clubs.length
    };
  },
});

export const extractUserInfoAndConnectionsTool = tool({
  description: 'You have extensive knowledge on the current student you are interacting with. You should call this tool to get information on both the user you\'re interacting with and the people who have some commonalities with them.',
  inputSchema: z.object({
    student_first_name: z.string().describe('the user\'s first name'),
    student_last_name: z.string().describe('the user\'s last name'),
    student_email: z.string().describe('the user\'s email'),
    // student_phone: z.string().describe('the user\'s phone number'),
  }),
  execute: async (input) => extractUserInfoAndConnections(input),
})

export const personRecommendationTool = tool({
  description: `You have extensive knowledge on all the people in the University of ${env.LOCATION_ID === "uofc" ? "Calgary" : "Waterloo"}, and your goal is to help provide the user with the best possible recommendation for who they should connect with`,
  inputSchema: z.object({
    intention: z.enum(['friendship', 'romantic', 'mentor', 'mentee', 'gym_buddy', 'group_project', 'other']).describe("What kind of relationship is the user looking for?"),
    // keyInfo: z.string().describe('The key information that we need to help find the best possible recommendation for who they should connect with. Make it very thorough and accurate. E.g. "I would like to meet people in the gym who like improv" -> "Rami enjoys improv  likes to meet people in the gym"'),
    query: z.string().describe('the user message'),
    firstName: z.string().describe('the user\'s first name').optional(),
    lastName: z.string().describe('the user\'s last name').nullable(),
    email: z.string().describe('the user\'s email').nullable(),
    interests: z.array(z.string()).describe('User interests and hobbies based on the whole conversation. E.g. "I would like to meet people in the gym who like improv" -> ["gym", "improv"]').nullable(),
    preferences: z.string().describe('Additional preferences or requirements based on the whole conversation. E.g. "I would like to meet people in the gym who like improv" -> ["make friends in the gym", "find improv enthusiasts"]').nullable(),
  }),
  execute: async ({ intention, query, interests, preferences, firstName, lastName, email }) => {
    // Combine all info for search
    const searchQuery = `the user ${firstName} ${lastName || ''} with email ${email || ''} is looking to ${figureOutIntention(intention)}

    ${firstName} just shared: "${query}"

    ${firstName} has these interests: ${interests?.join(' ')}

    ${firstName} has these preferences: ${preferences}`;

    console.log("Search query:", searchQuery);

    let people = await searchPeople({ query: searchQuery });
    // remove nodes that contain the name of the user
    people = people.filter((person) => firstName && !person.name.trim().toLowerCase().includes(firstName.trim().toLowerCase()));
    console.log("People:", people);
    if (people.length === 0) {
      return {
        success: false,
        message: "There are no people that match the query. Continue learning more about the user to find the perfect person for them."
      };
    }

    // Format person recommendations
    // const recommendations = people.slice(0, 5).map((person, idx) => ({
    //   // rank: idx + 1,
    //   name: person.name,
    //   description: person.description,
    //   summary: person.summary,
    //   similarity: person.similarity,
    //   url: person.url,
    // }));
    return {
      success: true,
      person: people[0],
    };
  },
});

/**
 * get summary of student from zep data
 */
export const getStudentSummaryTool = tool({
  description: `You have extensive knowledge on all the people in the University of ${env.LOCATION_ID === "uofc" ? "Calgary" : "Waterloo"}, and your goal is to help provide the user with the best possible recommendation for who they should connect with`,
  inputSchema: z.object({
    student_first_name: z.string().describe('the user\'s first name'),
    student_last_name: z.string().describe('the user\'s last name'),
    student_email: z.string().describe('the user\'s email'),
  }),
  execute: async (input) => {
    const node = await getStudentNode(input);
    if (!node) {
      return {
        success: false,
        message: "Student not found in the graph.",
      };
    }
    return {
      success: true,
      summary: node.summary
    };
  },
});

/**
 * Send out a warm intro from a student to another student
 */
export const sendWarmIntroTool = tool({
  description: 'You are an expert at sending warm intros from a student who is interested in meeting another student who shares commonalities with them. You should use this tool once a user confirms they want you (the ai) to send out a warm intro to the user they want to connect with.',
  inputSchema: z.object({
    from_first_name: z.string().describe('the user who requested the intro\'s first name'),
    from_last_name: z.string().describe('the user who requested the intro\'s last name'),
    from_email: z.string().describe('the user who requested the intro\'s email'),
    to_first_name: z.string().describe('The person who the intro is for\'s first name'),
    to_last_name: z.string().describe('The person who the intro is for\'s last name'),
    to_email: z.string().describe('The person who the intro is for\'s email'),
    warm_intro: z.string().describe('The message that will be sent to the person who the intro is for. Remember you are very close friends with these 2 students and is very confident that they will get along very well. So construct a message that will make them want to connect with each other. You can do that by being very detailed with what they have in common and anything that would give them a good reason to reach out. Be expressive in the information you share as long as it doesn\'t invade their privacy. Share as many information that is common between the two. Focus on that. For e.g. if both users were studying the same major or both enjoy a certain hobby, make sure you include that in the recommendation message.'),
  }),
  execute: async (input) => sendWarmIntro(input),
});
