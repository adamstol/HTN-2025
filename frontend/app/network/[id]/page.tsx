"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, MessageCircle, Phone, Video, Mail, MoreHorizontal } from 'lucide-react';

interface ConnectionDetails {
  id: string;
  name: string;
  email: string;
  profilePicture: string;
  timeConnected: string;
  gender: string;
  dateOfBirth: string;
  howWeMet: string;
  lifeGoals: string[];
  connections: Array<{
    id: string;
    name: string;
    profilePicture: string;
  }>;
  currentOccupation: {
    title: string;
    company: string;
    startDate: string;
  };
  lastInteraction?: string;
}

export default function NetworkConnectionPage() {
  const router = useRouter();
  const params = useParams();
  const connectionId = params.id as string;
  
  const [connection, setConnection] = useState<ConnectionDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data generator for development
  const generateMockConnection = (id: string): ConnectionDetails => {
    const names = ['Alex Johnson', 'Sarah Chen', 'Michael Rodriguez', 'Emma Wilson', 'David Kim'];
    const companies = ['TechCorp', 'InnovateLab', 'StartupXYZ', 'DataFlow Inc', 'AI Solutions'];
    const positions = ['Software Engineer', 'Product Manager', 'Data Scientist', 'UX Designer', 'Tech Lead'];
    const avatarNames = ['Brian', 'Emery', 'Wyatt', 'Caleb', 'Liliana'];
    const genders = ['Male', 'Female', 'Male', 'Female', 'Male'];
    const dobs = ['March 15, 1992', 'July 8, 1990', 'December 3, 1988', 'May 22, 1994', 'October 11, 1991'];
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
    
    const nameIndex = parseInt(id.split('_')[2] || '0') % names.length;
    
    // Generate mock connections
    const mockConnections = [];
    for (let i = 0; i < 3; i++) {
      const connIndex = (nameIndex + i + 1) % names.length;
      mockConnections.push({
        id: `conn_${Date.now()}_${connIndex}`,
        name: names[connIndex],
        profilePicture: avatarNames[connIndex]
      });
    }
    
    return {
      id,
      name: names[nameIndex],
      email: `${names[nameIndex].toLowerCase().replace(' ', '.')}@example.com`,
      profilePicture: avatarNames[nameIndex % avatarNames.length],
      timeConnected: 'Connected 3 days ago',
      gender: genders[nameIndex],
      dateOfBirth: dobs[nameIndex],
      howWeMet: howWeMet[nameIndex],
      lifeGoals: lifeGoalsOptions[nameIndex],
      connections: mockConnections,
      currentOccupation: {
        title: positions[nameIndex % positions.length],
        company: companies[nameIndex % companies.length],
        startDate: 'January 2023'
      },
      lastInteraction: 'Last message 2 hours ago'
    };
  };

  const fetchConnectionDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/network/connections/${connectionId}`);
      // const data = await response.json();
      // setConnection(data);
      
      // Mock API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      const mockConnection = generateMockConnection(connectionId);
      setConnection(mockConnection);
      
    } catch (err) {
      setError('Failed to load connection details');
      console.error('Error fetching connection:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (connectionId) {
      fetchConnectionDetails();
    }
  }, [connectionId]);

  const handleBack = () => {
    router.push('/network');
  };

  const handleMessage = () => {
    // TODO: Implement messaging functionality
    console.log('Opening message with:', connection?.name);
  };

  const handleCall = () => {
    // TODO: Implement call functionality
    console.log('Calling:', connection?.name);
  };

  const handleVideoCall = () => {
    // TODO: Implement video call functionality
    console.log('Video calling:', connection?.name);
  };

  const handleEmail = () => {
    if (connection?.email) {
      window.open(`mailto:${connection.email}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-gray-400">Loading connection details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !connection) {
    return (
      <div className="h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex flex-col">
        <div className="p-6">
          <button
            onClick={handleBack}
            className="bg-white px-3 py-[7px] rounded-full flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-black" />
            <span className="text-black text-sm font-normal">Back</span>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Connection not found'}</p>
            <button 
              onClick={fetchConnectionDetails}
              className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-[#343D40] to-[#131519] text-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6">
        <button
          onClick={handleBack}
          className="bg-white px-3 py-[7px] rounded-full flex items-center gap-2 cursor-pointer hover:bg-gray-100 transition-colors"
          style={{ fontFamily: 'Simonetta, serif' }}
        >
          <ChevronLeft className="w-4 h-4 text-black" />
          <span className="text-black text-sm font-normal">Back</span>
        </button>
      </div>

      {/* Profile Section */}
      <div className="flex-1 flex flex-col items-center px-6">
        {/* Profile Picture */}
        <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
          <img
            src={`https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${connection.profilePicture}`}
            alt={connection.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Name */}
        <h1 className="text-2xl font-normal text-white mb-3" style={{ fontFamily: 'Simonetta, serif' }}>
          {connection.name}
        </h1>
        
        {/* Gender and DOB */}
        <div className="flex items-center gap-4 text-gray-300 text-sm mb-4">
          <span>{connection.gender}</span>
          <span>•</span>
          <span>{connection.dateOfBirth}</span>
        </div>


        {/* Profile Details */}
        <div className="w-full max-w-md space-y-4">
          {/* How We Met */}
          <div className="bg-slate-700 rounded-2xl p-4 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-gray-300 text-xs font-medium">We met at:</span>
              <p className="text-gray-300 text-xs leading-relaxed flex-1">{connection.howWeMet}</p>
            </div>
          </div>

          {/* Life Goals */}
          <div className="bg-slate-700 rounded-2xl p-4">
            <h3 className="text-white text-sm font-medium mb-3" style={{ fontFamily: 'Simonetta, serif' }}>
              Life Goals
            </h3>
            <div className="space-y-2">
              {connection.lifeGoals.map((goal, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-gray-300 text-xs leading-relaxed">{goal}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Their Connections */}
          <div className="bg-slate-700 rounded-2xl p-4">
            <h3 className="text-white text-sm font-medium mb-3" style={{ fontFamily: 'Simonetta, serif' }}>
              Their Connections
            </h3>
            <div className="flex gap-3">
              {connection.connections.map((conn) => (
                <div key={conn.id} className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full overflow-hidden mb-1">
                    <img
                      src={`https://api.dicebear.com/9.x/notionists-neutral/svg?seed=${conn.profilePicture}`}
                      alt={conn.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-gray-300 text-xs text-center leading-tight">
                    {conn.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Occupation */}
          <div className="bg-slate-700 rounded-2xl p-4">
            <h3 className="text-white text-sm font-medium mb-3" style={{ fontFamily: 'Simonetta, serif' }}>
              Current Occupation
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-xs">Position</span>
                <span className="text-white text-sm font-medium">{connection.currentOccupation.title}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-xs">Company</span>
                <span className="text-white text-sm font-medium">{connection.currentOccupation.company}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-xs">Since</span>
                <span className="text-white text-sm font-medium">{connection.currentOccupation.startDate}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
