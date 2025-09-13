import { ZepClient } from "@getzep/zep-cloud";
import users from "./mock_users.json";
import messagesData from "./mock_user_messages_travels.json";

// Define the type for the messages object
type UserMessages = {
  [key: string]: string[];
};

const messages = messagesData as UserMessages;

const client = new ZepClient({ apiKey: process.env.ZEP_API_KEY });
const graphId = process.env.ZEP_GRAPH_ID!;

async function addUsersToGraph(addUser: boolean = true) {
  // check if we need to create the graph
  try {
    await client.graph.get(graphId);
  } catch (err: unknown) {
    console.log("graph not found, creating", err);
    await client.graph.create({ graphId });
    // wait for graph to be created
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  for (const user of users) {
    if (addUser) {
      const studentData = {
        action: "CREATE A SINGLE STUDENT ENTITY WITH THE GIVEN PROPERTIES. DO NOT CREATE ENTITES FOR THESE PROPERTIES. JUST CREATE the user ENTITY.",
        entity_type: "Student",
        student_id: user.user_id,
        student_first_name: user.first_name,
        student_last_name: user.last_name,
        student_email: user.email,
        student_phone: user.phone,
      };
      // const studentDescription = `Create an entity of type Student with the following attributes: student_id: ${user.user_id}, student_first_name: ${user.first_name}, student_last_name: ${user.last_name}, student_email: ${user.email}, student_phone: ${user.phone}`;
      await client.graph.add({
        graphId,
        type: "json",
        data: JSON.stringify(studentData),
      });
      console.log(`Added user: ${user.first_name} ${user.last_name}`);
    }

    const userMessages = messages[user.user_id] || [];
    for (const message of userMessages) {
      const studentMessage = `the user ${user.first_name} ${user.last_name} <${user.email}> said: "${message}"`;
      await client.graph.add({
        graphId,
        type: "text",
        data: studentMessage,
      });
      console.log(`Added message for user: ${user.first_name} ${user.last_name}`);
    }
  }
}

if (require.main === module) {
  addUsersToGraph(false).catch(console.error);
}