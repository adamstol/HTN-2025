/**
 * Mock Supabase API functions for development
 * These functions simulate Supabase queries and return data in the same format
 */

// Types aligned with actual database schema
export interface User {
  id: string; // uuid
  name: string;
  email: string;
  created_at: string;
  gender: string | null;
}

export interface Conversation {
  id: string; // uuid
  initiator_user_id: string; // uuid
  scanner_user_id: string; // uuid
  scanner_email: string;
  status: 'pending' | 'active' | 'ended';
  started_at: string; // timestamptz
  ended_at: string; // timestamptz
  location: string | null;
  invite_code: string;
}

// Connection represents a user in your network
export interface Connection {
  id: string; // uuid
  name: string;
  email: string;
  created_at: string;
  gender: string | null;
  profile_picture?: string; // For avatar display (not in DB, just for UI)
  // Derived from conversations table
  last_interaction_at?: string;
}

// ConnectionDetails includes user data and their conversations
export interface ConnectionDetails extends User {
  // Conversations with this user
  conversations: Conversation[];
  // Other users they're connected with
  connections: Array<{
    id: string;
    name: string;
    email: string;
    profile_picture?: string;
  }>;
  // These fields are not in the actual DB schema, but needed for UI
  profile: {
    first_met_where: string | null;
    occupation_title: string | null;
    occupation_company: string | null;
    occupation_start_date: string | null;
    life_goals: string[] | null;
    last_interaction_at: string | null;
  };
}

// Avatar names for consistent profile pictures
const avatarNames = [
  "Brian", "Emery", "Wyatt", "Caleb", "Liliana",
  "Jade", "Alexander", "Adrian", "Aiden", "Chase",
  "Christian", "Sadie", "Oliver", "Destiny", "Sawyer",
  "Jameson", "Sophia", "Jocelyn", "Andrea", "Eden",
];

// Generate mock users as connections
const generateMockConnections = (count: number = 5): Connection[] => {
  const names = ['Alex Johnson', 'Sarah Chen', 'Michael Rodriguez', 'Emma Wilson', 'David Kim'];
  const genders = ['Male', 'Female', 'Male', 'Female', 'Male'];
  const interactionDates = [
    new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 2 weeks ago
  ];

  return Array.from({ length: count }).map((_, index) => {
    const nameIndex = index % names.length;
    const randomAvatarIndex = Math.floor(Math.random() * avatarNames.length);
    
    return {
      id: `00000000-0000-0000-0000-00000000000${index + 1}`, // UUID format
      name: names[nameIndex],
      email: `${names[nameIndex].toLowerCase().replace(' ', '.')}@example.com`,
      created_at: new Date(Date.now() - (30 + index) * 24 * 60 * 60 * 1000).toISOString(),
      gender: genders[nameIndex],
      profile_picture: avatarNames[randomAvatarIndex],
      last_interaction_at: interactionDates[nameIndex]
    };
  });
};

// Generate mock conversations between users
const generateMockConversations = (userId: string, connectionId: string, count: number = 3): Conversation[] => {
  const locations = ['Hack the North', 'University of Toronto', 'Tech Meetup', 'Startup Weekend', 'Coffee Shop'];
  const statuses: Array<'pending' | 'active' | 'ended'> = ['ended', 'ended', 'active', 'pending'];
  
  return Array.from({ length: count }).map((_, index) => {
    // Alternate between being initiator and scanner
    const isInitiator = index % 2 === 0;
    const initiator_id = isInitiator ? userId : connectionId;
    const scanner_id = isInitiator ? connectionId : userId;
    
    // Create dates for conversations (most recent first)
    const endDaysAgo = index * 30; // Each conversation is a month apart
    const startDaysAgo = endDaysAgo + 1; // Started a day before ending
    
    return {
      id: `00000000-0000-0000-000${index}-00000000000${index + 1}`,
      initiator_user_id: initiator_id,
      scanner_user_id: scanner_id,
      scanner_email: `user${scanner_id.slice(-1)}@example.com`,
      status: index === 0 ? 'active' : 'ended',
      started_at: new Date(Date.now() - startDaysAgo * 24 * 60 * 60 * 1000).toISOString(),
      ended_at: new Date(Date.now() - endDaysAgo * 24 * 60 * 60 * 1000).toISOString(),
      location: locations[index % locations.length],
      invite_code: `INVITE${Math.floor(Math.random() * 10000)}`
    };
  });
};

// Generate a detailed connection profile
const generateConnectionDetails = (id: string): ConnectionDetails => {
  const names = ['Alex Johnson', 'Sarah Chen', 'Michael Rodriguez', 'Emma Wilson', 'David Kim'];
  const companies = ['TechCorp', 'InnovateLab', 'StartupXYZ', 'DataFlow Inc', 'AI Solutions'];
  const positions = ['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer', 'Tech Lead'];
  const genders = ['Male', 'Female', 'Male', 'Female', 'Male'];
  const howWeMet = [
    'We met at Calgary, Toronto, in the hack the north event, when you laughed at the same joke',
    'We connected at University of Toronto during a computer science lecture, bonding over debugging frustrations',
    'We first talked at Tech Meetup Toronto while waiting in line for coffee, discussing the latest React updates',
    'We met during Startup Weekend when we were randomly assigned to the same team for the pitch competition',
    'We were introduced through a mutual friend at a house party, where we spent hours talking about AI and machine learning'
  ];
  const lifeGoalsOptions = [
    ['Build a successful tech startup', 'Travel to 50 countries', 'Learn 3 programming languages'],
    ['Become a VP of Product', 'Write a tech book', 'Mentor young entrepreneurs'],
    ['Lead a data science team', 'Publish research papers', 'Create an AI product'],
    ['Design award-winning apps', 'Start a design agency', 'Teach UX design'],
    ['Become a CTO', 'Build scalable systems', 'Contribute to open source']
  ];
  
  const nameIndex = parseInt(id.replace(/[^0-9]/g, '')) % names.length || 0;
  
  // Generate mock connections with UUID format
  const mockConnections = [];
  for (let i = 0; i < 3; i++) {
    const connIndex = (nameIndex + i + 1) % names.length;
    mockConnections.push({
      id: `00000000-0000-0000-0000-00000000000${connIndex + 1}`,
      name: names[connIndex],
      email: `${names[connIndex].toLowerCase().replace(' ', '.')}@example.com`,
      profile_picture: avatarNames[connIndex]
    });
  }
  
  // Last interaction between 1 hour and 14 days ago
  const hoursAgo = Math.floor(Math.random() * 336) + 1; // Between 1 and 337 hours ago (14 days)
  const lastInteractionDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
  
  // Generate conversations with this user
  const currentUserId = '00000000-0000-0000-0000-000000000000'; // Mock current user ID
  const conversations = generateMockConversations(currentUserId, id);
  
  return {
    // Core user data (from users table)
    id,
    name: names[nameIndex],
    email: `${names[nameIndex].toLowerCase().replace(' ', '.')}@example.com`,
    created_at: new Date(Date.now() - (365 + nameIndex * 10) * 24 * 60 * 60 * 1000).toISOString(),
    gender: genders[nameIndex],
    
    // Conversations with this user (from conversations table)
    conversations,
    
    // Their connections
    connections: mockConnections,
    
    // UI-only data (not in actual DB schema)
    profile: {
      first_met_where: howWeMet[nameIndex],
      occupation_title: positions[nameIndex % positions.length],
      occupation_company: companies[nameIndex % companies.length],
      occupation_start_date: '2023-01-15',
      life_goals: lifeGoalsOptions[nameIndex],
      last_interaction_at: lastInteractionDate
    }
  };
};

// Mock API functions that simulate Supabase queries
export const mockSupabaseApi = {
  // Get all connections for the current user
  async getConnections(): Promise<{ data: Connection[] | null, error: Error | null }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      const connections = generateMockConnections(5);
      return { data: connections, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
    }
  },
  
  // Get details for a specific connection
  async getConnectionDetails(id: string): Promise<{ data: ConnectionDetails | null, error: Error | null }> {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Check if ID exists (in real app would check DB)
      if (!id || id === 'invalid') {
        return { data: null, error: new Error('Connection not found') };
      }
      
      const connectionDetails = generateConnectionDetails(id);
      return { data: connectionDetails, error: null };
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
    }
  }
};
