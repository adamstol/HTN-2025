// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase API ANON KEY - env var exported by default
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      // Create client with Auth context of the user that called the function
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    
    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    // Parse request URL and get the path
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // Handle different endpoints
    if (req.method === "GET") {
      if (path === "connections") {
        // Get all connections for the current user
        const { data: usersData, error: usersError } = await supabaseClient
          .from("users")
          .select("id, name, email, created_at, gender")
          .neq("id", user.id)
          .order("created_at", { ascending: false });
        
        if (usersError) {
          return new Response(
            JSON.stringify({ error: usersError.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        
        // Get conversations for these users
        const userIds = usersData.map((u) => u.id);
        const { data: convoData, error: convoError } = await supabaseClient
          .from("conversations")
          .select("*")
          .or(`initiator_user_id.in.(${userIds.join(",")}),scanner_user_id.in.(${userIds.join(",")})`)
          .order("started_at", { ascending: false });
        
        if (convoError) {
          return new Response(
            JSON.stringify({ error: convoError.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        
        // Combine user data with conversation data
        const connectionsWithInteractions = usersData.map((u) => {
          // Find the most recent conversation with this user
          const latestConvo = convoData?.find(
            (convo) => convo.initiator_user_id === u.id || convo.scanner_user_id === u.id
          );
          
          return {
            ...u,
            last_interaction_at: latestConvo?.started_at,
          };
        });
        
        return new Response(
          JSON.stringify(connectionsWithInteractions),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      } else if (path && path !== "connections") {
        // Get details for a specific connection
        const connectionId = path;
        
        // Get user data
        const { data: userData, error: userError } = await supabaseClient
          .from("users")
          .select("id, name, email, created_at, gender")
          .eq("id", connectionId)
          .single();
        
        if (userError) {
          return new Response(
            JSON.stringify({ error: userError.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        
        // Get conversations with this user
        const { data: conversations, error: convoError } = await supabaseClient
          .from("conversations")
          .select("*")
          .or(`initiator_user_id.eq.${connectionId},scanner_user_id.eq.${connectionId}`)
          .order("started_at", { ascending: false });
        
        if (convoError) {
          return new Response(
            JSON.stringify({ error: convoError.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        
        // Get other users this person has connected with
        const { data: otherUsers, error: otherUsersError } = await supabaseClient
          .from("users")
          .select("id, name, email")
          .neq("id", connectionId)
          .limit(3);
          
        if (otherUsersError) {
          return new Response(
            JSON.stringify({ error: otherUsersError.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        
        // Create the connection details object
        const connectionDetails = {
          ...userData,
          conversations: conversations || [],
          connections: otherUsers || [],
        };
        
        return new Response(
          JSON.stringify(connectionDetails),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }
    
    // Default response for unsupported methods/paths
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// To invoke:
// curl -i --location --request GET 'https://xurhcfcnsluhxhedszpe.supabase.co/functions/v1/network-connections/connections' \
//   --header 'Authorization: Bearer YOUR_ANON_KEY' \
//   --header 'Content-Type: application/json'
