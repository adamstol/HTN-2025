import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const connectionId = params.id;
    
    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Get the current user session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Call the Supabase Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/network-connections/${connectionId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch connection details');
    }
    
    const data = await response.json();
    
    // Add UI-only fields with placeholder data
    const enhancedData = {
      ...data,
      profile: {
        first_met_where: data.conversations && data.conversations.length > 0 ? 
          data.conversations[0].location || 'Unknown location' : null,
        occupation_title: 'Software Engineer', // Hardcoded for demo
        occupation_company: 'Tech Company', // Hardcoded for demo
        occupation_start_date: '2023-01-15',
        life_goals: ['Build a startup', 'Learn new technologies', 'Travel more'],
        last_interaction_at: data.conversations && data.conversations.length > 0 ? 
          data.conversations[0].started_at : null
      }
    };
    
    return NextResponse.json(enhancedData);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
