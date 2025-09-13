// personRecommendation.ts
import { z } from "zod";
import { searchPeople } from "./queries";
import { extractUserInfoAndConnections } from "./queries";
import users from "./mock_users.json";

// ----- Tool wiring -----
type Intention =
  | "friendship"
  | "romantic"
  | "mentor"
  | "mentee"
  | "gym_buddy"
  | "group_project"
  | "other";

const InputSchema = z.object({
  intention: z.enum([
    "friendship",
    "romantic",
    "mentor",
    "mentee",
    "gym_buddy",
    "group_project",
    "other",
  ]),
  query: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().nullable(),
  email: z.string().nullable(),
  interests: z.array(z.string()).nullable(),
  preferences: z.string().nullable(),
});

type ToolInput = z.infer<typeof InputSchema>;

function figureOutIntention(i: Intention): string {
  const txt: Record<Intention, string> = {
    friendship: "make new friends",
    romantic: "find a romantic connection",
    mentor: "find a mentor",
    mentee: "mentor someone",
    gym_buddy: "find a gym buddy",
    group_project: "form a group project team",
    other: "connect with the right person",
  };
  return txt[i];
}

// Common person shape your UI expects
export type Person = {
  id: string;
  name: string;
  description?: string;
  summary?: string;
  similarity?: number;
  url?: string;
};

// The adapter that hits your backend (Zep or proxy)
export type SearchPeople = (args: { query: string }) => Promise<Person[]>;

// ----- Tool executor -----
export async function executePersonRecommendation(
  input: ToolInput
) {
  const parsed = InputSchema.parse(input);
  const {
    intention,
    query,
    interests,
    preferences,
    firstName = "The student",
    lastName,
    email,
  } = parsed;

  const searchQuery = `The student ${firstName} ${lastName ?? ""} ${email ? `(${email})` : ""
    } is looking to ${figureOutIntention(intention)}.

They just said: "${query}"

Interests: ${(interests ?? []).join(", ")}

Preferences: ${preferences ?? "none"}`.trim();

  // Log for tracing/debug
  console.log("Search query:", searchQuery);

  const people = await searchPeople({ query: searchQuery });

  if (!people.length) {
    return {
      success: false,
      message:
        "There are no people that match the query. Continue learning more about the user to find the perfect person for them.",
    };
  }

  return {
    success: true,
    person: people[0], // top match
  };
}

const user1 = users[0];
const user2 = users[1];

// ----- Example usage -----
if (require.main === module) {
  (async () => {
    const result = await executePersonRecommendation(
      {
        intention: "gym_buddy",
        query: "I want to meet people who lift and also like improv",
        firstName: user2.first_name,
        lastName: user2.last_name,
        email: user2.email,
        interests: ["gym", "improv", "weightlifting"],
        preferences: "evening workouts near Kinesiology",
      },
      // default uses zepSearchPeople; pass a mock for tests if needed
    );
    console.log(JSON.stringify(result, null, 2));

    // test out 2nd tool
    const result2 = await extractUserInfoAndConnections({
      student_email: user2.email,
      student_first_name: user2.first_name,
      student_last_name: user2.last_name,
    });
    console.log(JSON.stringify(result2, null, 2));
  })().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
