import { MessageCircle, Brain, Users } from "lucide-react";

const steps = [
  {
    number: "1",
    title: "We Chat or Call & Get to Know Each Other",
    description: "I'll Learn about your interests and what excites you in life. I'll then ask about who you're hoping to meet on campus.",
    icon: MessageCircle,
    color: "from-primary to-primary-glow",
    mockup: {
      type: "chat",
      messages: [
        { sender: "user", text: "I'm looking for someone in my Psychology class who would be interested in playing basketball after class" },
        { sender: "ember", text: "I think I know just the person for you!" },
      ]
    }
  },
  {
    number: "2",
    title: "I Create Your Perfect Profile",
    description: "Based on our conversations, I'll build a profile that captures who you really are and who you're looking for.",
    icon: Brain,
    color: "from-accent-custom to-accent-glow",
    mockup: {
      type: "loading",
      text: "Creating your profile..."
    }
  },
  {
    number: "3",
    title: "I connect you with the right people at the right time",
    description: "As you go about your day, I'll find your perfect matches and connect you with them.",
    icon: Users,
    color: "from-primary-glow to-accent-custom",
    mockup: {
      type: "notification",
      text: "Alex from the floor above is also looking for someone to speak french with"
    }
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-i-work" className="relative py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            How I Work
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            It&apos;s effortless, useful, and exciting—not salesy. Here&apos;s how we&apos;ll find your people:
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="glass-card p-8 rounded-3xl hover:scale-[1.02] transition-all duration-300 group"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              {/* Step Number */}
              <div className={`w-16 h-16 rounded-full bg-linear-to-r ${step.color} flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                <span className="text-2xl font-bold text-black">{step.number}</span>
              </div>

              {/* Mockup */}
              <div className="mb-6 bg-background/80 border border-border rounded-2xl p-4 backdrop-blur-xs min-h-[200px] flex items-center justify-center">
                {step.mockup.type === "chat" && (
                  <div className="space-y-3 w-full">
                    {step.mockup.messages?.map((message, i) => (
                      <div
                        key={i}
                        className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                            message.sender === "user"
                              ? "bg-primary text-black"
                              : "bg-background border border-border text-foreground"
                          }`}
                        >
                          {message.text}
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-start">
                      <div className="bg-primary/20 px-4 py-2 rounded-full">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {step.mockup.type === "loading" && (
                  <div className="text-center space-y-4">
                    <step.icon className="w-12 h-12 mx-auto text-foreground animate-pulse" />
                    <p className="text-sm text-foreground font-medium">{step.mockup.text}</p>
                    <div className="flex justify-center space-x-2">
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                )}

                {step.mockup.type === "notification" && (
                  <div className="w-full space-y-4">
                    <div className="bg-background border border-border p-4 rounded-2xl">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-linear-to-r from-primary to-accent-custom"></div>
                        <div className="text-sm font-medium text-foreground">Ember</div>
                      </div>
                      <p className="text-sm text-foreground font-medium">{step.mockup.text}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs">
                        ✓ Accept
                      </button>
                      <button className="bg-background border border-border text-foreground px-4 py-2 rounded-full text-xs">
                        ✗ Decline
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="text-xl font-display font-bold mb-3 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;