import ConversationHistory from "@/components/ConversationHistory";
import { createConversation } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChevronUp, MoveUpRight, Sparkles, Users } from "lucide-react";

export default async function RecordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // const { id, url } = await createConversation();
  // return redirect(`/record/${id}`);


  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-[#343D40] to-[#131519]">
      {/* Top section with conversation history */}
      <div className="flex-grow overflow-auto px-6 pb-4">
        <div className="flex justify-start mt-5 mb-4">
          <button
            className="bg-white w-[30px] h-[30px] rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
            <ChevronUp className="w-5 h-5 text-black" />
          </button>
        </div>
        
        <h1 className="text-2xl font-normal text-gray-200 mb-8 text-center" style={{ fontFamily: "Simonetta, serif" }}>
          Conversation History
        </h1>
        
        <ConversationHistory />
      </div>
      
      {/* Bottom Section - Two Side-by-Side Cards */}
      <div className="flex-shrink-0 pb-8 px-6">
        <div className="space-y-4">
          {/* Two Cards Side by Side */}
          <div className="grid grid-cols-2 gap-4">
              {/* Access your network card */}
              <a href="/network"
                className="bg-[#353E41] rounded-2xl p-4 h-24 flex flex-col cursor-pointer hover:bg-slate-600 transition-colors"
              >
                <div className="w-6 h-6 flex items-center justify-center mb-2">
                  <Users className="w-5 h-5 text-gray-300" />
                </div>
                <div className="flex items-center justify-between flex-1">
                  <p className="text-white text-xs ">Access network</p>
                  <MoveUpRight className="w-3 h-3 text-gray-400" />
                </div>
              </a>

              {/* AI Chatbot card */}
              <div className="bg-[#353E41] rounded-2xl p-4 h-24 flex flex-col cursor-pointer hover:bg-slate-600 transition-colors">
                <div className="w-6 h-6 flex items-center justify-center mb-2">
                  <Sparkles className="w-5 h-5 text-gray-300" />
                </div>
                <div className="flex items-center justify-between flex-1">
                  <p className="text-white text-xs">AI Chatbot</p>
                  <MoveUpRight className="w-3 h-3 text-gray-400" />
                </div>
              </div>
            </div>
            
            {/* Start Recording Button */}
            <div className="pt-6">
              <form action={async () => {
                'use server';
                const { id } = await createConversation();
                redirect(`/record/${id}`);
              }}>
                <button
                  type="submit"
                  className="w-full bg-white text-black py-4 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-black">
                    <circle cx="12" cy="12" r="1"></circle>
                    <circle cx="12" cy="12" r="8"></circle>
                  </svg>
                  <span>Start Recording</span>
                </button>
              </form>
            </div>
          </div>
        </div>
    </div>
  )
}
