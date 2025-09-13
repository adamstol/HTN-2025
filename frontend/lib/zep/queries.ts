import { Zep } from "@getzep/zep-cloud";
import { client } from "./client";

export async function searchPeople(opts: {
  query: string;
  k?: number;
  minSimilarity?: number
  keyword?: string | null;
}): Promise<Zep.EntityNode[]> {
  const { query, k = 8, minSimilarity = 0.2, keyword = null } = opts;

  const results = await client.graph.search({
    graphId: process.env.ZEP_GRAPH_ID,
    query: query,
    scope: "nodes",
    searchFilters: {
      nodeLabels: ["Student"], // Only return user nodes
    },
    limit: k,

    // minScore
    // Optionally, you can add reranker or edge_types if you want more control
  });

  // remove the node that has a score of 1 because that's the user
  results.nodes = results.nodes?.filter((node) => node.score !== 1);

  return results.nodes ?? [];
}

// export async function extractUserInfoAndConnections(opts: {
//   userId: string;
// }): Promise<Record<Zep.EntityNode, Zep.EntityNode[]>> {
//   const { userId } = opts;

//   const results = await client.graph.node.get(userId);

//   console.log("Search results:", results);

//   // remove the node that has a score of 1 because that's the user
//   results.nodes = results.nodes?.filter((node) => node.score !== 1);

//   return results.nodes ?? [];
// }

export async function getNeighborUuids(opts: {
  nodeId: string;
}): Promise<string[]> {
  const { nodeId } = opts;

  const results = await client.graph.node.getEdges(nodeId);

  console.log("Search results:", results);

  // Step 3: Extract neighboring node UUIDs
  const neighborUuids = new Set<string>();
  for (const edge of results) {
    if (edge.sourceNodeUuid !== nodeId) {
      neighborUuids.add(edge.sourceNodeUuid);
    }
    if (edge.targetNodeUuid !== nodeId) {
      neighborUuids.add(edge.targetNodeUuid);
    }
  }

  console.log("Neighbor UUIDs:", Array.from(neighborUuids));
  return Array.from(neighborUuids);
}

/**
 * get student node from graph given student properties
 */
export async function getStudentNode(properties: Record<string, string>): Promise<Zep.EntityNode | null> {

  const results = await client.graph.search({
    graphId: process.env.ZEP_GRAPH_ID,
    query: JSON.stringify(properties),
    scope: "nodes",
    searchFilters: {
      nodeLabels: ["Student"], // Only return user nodes
    },
    limit: 10,
  });

  console.log("Search results for student node:", results);
  return results.nodes?.filter((node) => properties.student_first_name.toLowerCase() === node.name.split(" ")[0].toLowerCase())[0] ?? null;
}

// export async function getStudentNodeConnectedNodes(node: Zep.EntityNode): Promise<Zep.EntityNode[]> {
//   const neighborUuids = await getNeighborUuids({ nodeId: node.uuid });
//   const results = await Promise.all(
//     neighborUuids.map((neighborUuid) => client.graph.node.get(neighborUuid))
//   );
//   return results;
// }

type ExtractUserInfoInput = {
  student_first_name: string;
  student_last_name: string;
  student_email: string;
  // student_phone: string;
};

type ExtractUserInfoAndConnectionsResult = {
  success: boolean;
  message?: string;
  userInfo?: unknown;
  connections?: {
    uuid: string;
    summary: string;
  }[];
};

export async function extractUserInfoAndConnections(
  input: ExtractUserInfoInput
): Promise<ExtractUserInfoAndConnectionsResult> {
  console.log("Extracting user info and connections for:", input);
  const user = await getStudentNode(input);
  if (!user) {
    console.log("User not found in the graph.");
    return {
      success: false,
      message: "User not found in the graph.",
    };
  }
  console.log("User found in the graph.", user);

  const neighbors = await getNeighborUuids({ nodeId: user.uuid });

  const neighborNodes = await Promise.all(
    neighbors.map((neighborUuid) => client.graph.node.get(neighborUuid))
  );

  console.log("Neighbor nodes:", neighborNodes);

  // check if any of these nodes have a student other than the user neighboring them
  const otherStudentNodes: Zep.EntityNode[] = [];
  for (const neighborNode of neighborNodes) {
    const neighborsOfNeighbor = await getNeighborUuids({ nodeId: neighborNode.uuid });
    // remove the user from the neighbors
    const neighborsOfNeighborWithoutCurrentUser = neighborsOfNeighbor.filter(
      (neighborUuid) => neighborUuid !== user.uuid
    );

    console.log("Neighbors of neighbor:", neighborsOfNeighborWithoutCurrentUser);

    const studentNodesConnectedNodes = await Promise.all(
      neighborsOfNeighborWithoutCurrentUser.map((studentNodeUuid) =>
        client.graph.node.get(studentNodeUuid)
      )
    );
    const studentsConnectedThroughThisNode = studentNodesConnectedNodes.filter((node) =>
      node?.labels?.includes("Student")
    );
    if (studentsConnectedThroughThisNode.length > 0) {
      console.log("Other student nodes:", studentsConnectedThroughThisNode);
      otherStudentNodes.push(...(studentsConnectedThroughThisNode as Zep.EntityNode[]));
    }
  }

  // remove the attributes that we don't wanna share to the AI
  const essentialStudentData = otherStudentNodes.map((node) => ({
    uuid: node.uuid,
    // remove phone numbers in various formats (e.g., (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890)
    summary: node.summary
      .replaceAll(/(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '') // remove phone numbers in various formats (e.g., (123) 456-7890)
      .replaceAll(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '') // remove phone numbers in various formats (e.g., 123-456-7890)
      .replaceAll(/\b\d{10}\b/g, '') // remove phone numbers in various formats (e.g., 1234567890)
      .replaceAll(node.attributes?.phone as string | undefined ?? '', '')
      .trim(),
  }));
  // TODO: get the number of shared edges between me and the other students
  // TODO: retrieve the context of the edges between me and the other students
  return {
    success: true,
    userInfo: user.summary,
    connections: essentialStudentData,
  };
}
