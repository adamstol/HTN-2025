// Mock data for conversation details
const mockConversationData = {
  "conv-001": {
    id: "conv-001",
    started_at: "2025-01-15T14:30:00Z",
    ended_at: "2025-01-15T15:15:00Z",
    raw_transcript: `Alex: Hey! Thanks for meeting up for coffee. I've been really excited to chat about your project.

You: Of course! I'm glad we could find time. I've been working on this new app idea and I think you'd have some great insights.

Alex: I'd love to hear about it. What's the core concept?

You: It's essentially a networking app for university students, but with AI-powered matching based on shared interests and goals. The idea is to help students find study partners, project collaborators, or even just friends with similar academic interests.

Alex: That sounds really interesting! How does the AI matching work?

You: We're using a combination of profile data, conversation analysis, and behavioral patterns. The app would analyze conversations to understand what people are passionate about and match them accordingly.

Alex: That's brilliant. I've been working on something similar in the ML space - specifically around natural language processing for understanding user intent.

You: Really? That's perfect! We should definitely collaborate on this. Your expertise in NLP would be invaluable for the conversation analysis component.

Alex: Absolutely! I'd love to contribute. When are you planning to start development?

You: We're hoping to have a prototype ready for the next hackathon. Would you be interested in joining our team?

Alex: I'd love to! This could be a really impactful project.`,
    stt_provider: "OpenAI Whisper",
    entities: [
      { id: "ent-1", kind: "PERSON", name: "Alex Chen", salience: 0.95 },
      { id: "ent-2", kind: "TECHNOLOGY", name: "AI", salience: 0.88 },
      { id: "ent-3", kind: "TECHNOLOGY", name: "NLP", salience: 0.82 },
      { id: "ent-4", kind: "ORGANIZATION", name: "university", salience: 0.75 },
      { id: "ent-5", kind: "EVENT", name: "hackathon", salience: 0.70 }
    ],
    relations: [
      { id: "rel-1", src_entity_id: "ent-1", dst_entity_id: "ent-2", type: "WORKING_ON", weight: 0.9 },
      { id: "rel-2", src_entity_id: "ent-2", dst_entity_id: "ent-3", type: "USES", weight: 0.8 },
      { id: "rel-3", src_entity_id: "ent-4", dst_entity_id: "ent-5", type: "HOSTS", weight: 0.7 }
    ],
    memories: [
      {
        id: "mem-1",
        title: "Potential collaboration with Alex Chen",
        body: "Alex is working on NLP for user intent understanding. Perfect match for our AI-powered networking app. He's interested in joining our hackathon team.",
        tags: ["collaboration", "NLP", "hackathon", "networking"],
        due_at: "2025-02-15"
      },
      {
        id: "mem-2", 
        title: "App concept discussion",
        body: "Discussed our university networking app with AI matching. Alex provided valuable insights on conversation analysis and user intent.",
        tags: ["app", "concept", "feedback"],
        due_at: null
      }
    ]
  }
};

export default function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const convo = mockConversationData[id as keyof typeof mockConversationData];
  const entities = convo?.entities || [];
  const relations = convo?.relations || [];
  const memories = convo?.memories || [];

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Conversation {convo?.id}</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Transcript</h2>
        <div className="rounded border p-3 text-sm whitespace-pre-wrap min-h-24">{convo?.raw_transcript ?? "(no transcript)"}</div>
        <div className="text-xs text-muted-foreground">Provider: {convo?.stt_provider ?? "n/a"}</div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Entities</h2>
          <div className="space-y-1">
            {(entities ?? []).map((e) => (
              <div key={e.id} className="rounded border p-2 text-sm">
                <div className="font-medium">{e.name}</div>
                <div className="text-xs text-muted-foreground">{e.kind} · salience {e.salience}</div>
              </div>
            ))}
            {(entities ?? []).length === 0 && <div className="text-sm text-muted-foreground">No entities.</div>}
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Memories</h2>
          <div className="space-y-1">
            {(memories ?? []).map((m) => (
              <div key={m.id} className="rounded border p-2 text-sm">
                <div className="font-medium">{m.title}</div>
                <div className="text-xs text-muted-foreground">{(m.tags as string[] | null)?.join(", ")}</div>
                <div className="text-sm whitespace-pre-wrap">{m.body}</div>
                {m.due_at && <div className="text-xs text-muted-foreground">Due {m.due_at}</div>}
              </div>
            ))}
            {(memories ?? []).length === 0 && <div className="text-sm text-muted-foreground">No memories.</div>}
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-medium">Relations</h2>
        <div className="space-y-1">
          {(relations ?? []).map((r) => (
            <div key={r.id} className="rounded border p-2 text-sm">{r.type}: {r.src_entity_id} → {r.dst_entity_id} (w={r.weight})</div>
          ))}
          {(relations ?? []).length === 0 && <div className="text-sm text-muted-foreground">No relations.</div>}
        </div>
      </section>
    </div>
  );
}
