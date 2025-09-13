import { OpenAI } from 'openai'
import { openai } from "@ai-sdk/openai"
import { generateObject, generateText, LanguageModel, ModelMessage } from "ai"
import { DEFAULT_SYSTEM_PROMPT } from './prompts'
import { z } from 'zod';
import { searchClubs } from "./supabase/queries";
export async function callBasicLlm(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }

  const client = new OpenAI({ apiKey })
  const r = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
  })
  return r.choices[0].message.content || ''
}

export async function callLlm(messages: ModelMessage[] = [], system: string = DEFAULT_SYSTEM_PROMPT, model: LanguageModel = openai('gpt-4o-mini')): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  const { text } = await generateText({
    model,
    system,
    messages,
  })
  return text
}

// /**
//  * One-chat flow with Vercel AI SDK tools.
//  * The model can call `searchClubs` to fetch club data and then compose the final reply.
//  */
// export async function callLlmWithTools(
//   messages: ModelMessage[] = [],
//   system: string = DEFAULT_SYSTEM_PROMPT,
//   model: LanguageModel = openai('gpt-4o-mini')
// ): Promise<string> {
//   const apiKey = process.env.OPENAI_API_KEY
//   if (!apiKey) {
//     throw new Error('OPENAI_API_KEY environment variable is not set')
//   }

//   const { text } = await generateText({
//     model,
//     system,
//     messages,
//     tools: {
//       searchClubs: {
//         description: 'Search and retrieve clubs relevant to the user based on a detailed query of interests, goals, and constraints gathered from the conversation.',
//         parameters: z.object({
//           query: z.string().describe('A thorough summary of what the user is looking for in a club based on the conversation.'),
//           topK: z.number().int().min(1).max(10).optional().describe('Number of top matches to retrieve (default 5).'),
//           minSimilarity: z.number().min(0).max(1).optional().describe('Similarity threshold between 0 and 1 (default 0.2).'),
//           keyword: z.string().optional().nullable().describe('Optional keyword to prefilter domain (e.g., "engineering").')
//         }),
//         execute: async ({ query, topK, minSimilarity, keyword }) => {
//           const clubs = await searchClubs({
//             query,
//             k: topK ?? 5,
//             minSimilarity: minSimilarity ?? 0.2,
//             keyword: keyword ?? null,
//           });
//           // Keep payload compact and deterministic
//           return clubs.map(c => ({
//             id: c.id,
//             name: c.name,
//             url: c.url,
//             summary: c.summary,
//             similarity: c.similarity,
//           }));
//         }
//       }
//     }
//   })

//   return text
// }

/**
 * Make the AI return a json object
 */
export async function callLlmJson<T>(prompt: string, schema: z.ZodType<T>, model: LanguageModel = openai('gpt-4o-mini')): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  const { object } = await generateObject({
    model,
    prompt,
    schema,
  })
  return object as T
}
