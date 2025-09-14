import { ZepClient, Zep, ZepError } from "@getzep/zep-cloud";
import { getWeek } from "date-fns";
import { SharedStore } from "../pocketflow/types";
import { getUserIdByEmail } from "../supabase/client-queries";
import users from "./mock_users.json";

const API_KEY = process.env.ZEP_API_KEY || process.env.NEXT_PUBLIC_ZEP_API_KEY;

export const client = new ZepClient({
  apiKey: API_KEY,
});

export async function addUserMessage(userData: SharedStore) {
  // Step 1: Check if user exists
  let userExists = true;
  const userId = await getUserIdByEmail(userData.user?.email as string);
  if (!userId) {
    return;
  }
  try {
    const user = await client.user.get(userId);
    console.log("user", user);
  } catch (err: ZepError | unknown) {
    if (err instanceof ZepError && err.statusCode === 404) {
      console.log("user not found");
      userExists = false;
    } else {
      console.log("user not found", err);
      throw err; // rethrow other errors
    }
  }

  // Step 2: Create user if not exists
  if (!userExists) {
    console.log("user not found, creating");
    await client.user.add({
      userId,
      email: userData.user?.email,
      firstName: userData.user?.firstName,
      lastName: userData.user?.lastName,
      metadata: {
        phone: userData.user?.phone,
      }
    }); // Add more fields as needed
  }

  if (!userData.incomingMessage) {
    console.log("no message");
    return;
  }

  // Step 3: Create a new thread for the user
  // weekly thread
  const today = new Date();
  const weekNumber = getWeek(today, { weekStartsOn: 1 });
  const threadId = `${userId}-${weekNumber}`;
  // check if thread exists
  try {
    const { totalCount } = await client.thread.get(threadId);
    console.log("thread", totalCount);
    if (totalCount === 0) {
      console.log("thread not found, creating");
      await client.thread.create({ threadId, userId });
    }
  } catch (err: ZepError | unknown) {
    if (err instanceof ZepError && err.statusCode === 404) {
      console.log("thread not found (err), creating");
      await client.thread.create({ threadId, userId });
    } else {
      console.log("thread not found (err)", err);
      throw err; // rethrow other errors
    }
  }
  // Step 4: Add the message to the thread
  const messages: Zep.Message[] = [{
    name: userData.user?.firstName || "User",
    role: "user",
    content: userData.incomingMessage,
    createdAt: today.toISOString(),
  }];
  const { context, messageUuids } = await client.thread.addMessages(threadId, { messages, returnContext: true });
  console.log("context", context);
  console.log("messageUuids", messageUuids);
  return { context, messageUuids };
}

// export
export async function addMessageToGlobalGraph(userData: SharedStore) {
  const graphId = process.env.ZEP_GRAPH_ID!;
  const userId = await getUserIdByEmail(userData.user?.email as string);
  if (!userId) {
    console.log("user not found");
    return;
  }

  // 1. Check if the user node exists in the shared graph
  let searchResults;
  try {
    searchResults = await client.graph.search({
      graphId,
      query: userId,
      scope: "nodes",
      searchFilters: { nodeLabels: ["Student"] },
      limit: 1,
    });
  } catch (err: unknown) {
    console.log("user not found in shared graph. creating", err);
  }
  const userExists: boolean = searchResults?.nodes && searchResults.nodes.length > 0 || false;

  const mockUser1 = {
    student_id: users[0].user_id,
    student_first_name: users[0].first_name,
    student_last_name: users[0].last_name,
    student_email: users[0].email,
    student_phone: users[0].phone,
  }
  const mockUser2 = {
    student_id: users[1].user_id,
    student_first_name: users[1].first_name,
    student_last_name: users[1].last_name,
    student_email: users[1].email,
    student_phone: users[1].phone,
  }
  const realUser = {
    student_id: userId,
    student_first_name: userData.user?.firstName,
    student_last_name: userData.user?.lastName,
    student_email: userData.user?.email,
    student_phone: userData.user?.phone,
  };

  // 2. If not, create the user entity in the shared graph
  if (!userExists) {
    const studentData = {
      action: "Create_entity",
      entity_type: "Student",
      ...(process.env.ZEP_GRAPH_ID?.includes("mock") ? mockUser2 : realUser),
    };
    // make sure graph exists
    try {
      await client.graph.get(graphId);
    } catch (err: unknown) {
      console.log("graph not found, creating", err);
      await client.graph.create({ graphId });
      // wait for graph to be created
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    await client.graph.add({
      graphId,
      type: "json",
      data: JSON.stringify(studentData),
    });
  }

  // 3. Add the user's message as text to the shared graph
  if (!userData.incomingMessage) {
    console.log("no message");
    return;
  }

  const studentMessage = `the user ${realUser.student_first_name} ${realUser.student_last_name} <${realUser.student_email}> said: "${userData.incomingMessage}"`;
  const mockStudentMessage = `the user ${mockUser2.student_first_name} ${mockUser2.student_last_name} <${mockUser2.student_email}> said: "${userData.incomingMessage}"`;
  await client.graph.add({
    graphId,
    type: "text",
    data: process.env.ZEP_GRAPH_ID?.includes("mock") ? mockStudentMessage : studentMessage,
  });
}
