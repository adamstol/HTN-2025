const MissionSection = () => {
  return (
    <section id="mission" className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">
              {/* It shouldn't be that hard to */}
              <span className="bg-linear-to-r from-primary to-accent-custom bg-clip-text text-transparent">
                Effortlessly{" "}
              </span>
              find exactly who you&apos;re looking for
            </h2>
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                I get to know you through our chat, create your profile, and as soon as you pass by someone who I think you might like, I&apos;ll provide more information about them for you to decide if you want to connect.
              </p>
              <p className="text-primary font-medium">
                Call me {'->'} Go about your day {'->'} I find you someone who you might like and fits your schedule
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="glass-card p-8 rounded-3xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-r from-primary to-primary-glow"></div>
                  <div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                    <div className="h-2 bg-muted/60 rounded w-16 mt-1"></div>
                  </div>
                </div>
                <div className="bg-background/90 border border-primary/20 p-4 rounded-2xl">
                  <p className="text-sm text-foreground font-medium">
                    &quot;I just talked to a MATH 211 classmate who also goes to bake chef after class. Want an intro?&quot;
                  </p>
                </div>
                <div className="bg-background/90 border border-accent-custom/20 p-4 rounded-2xl">
                  <p className="text-sm text-foreground font-medium">
                    &quot;I found 3 people who enjoy listening to similar podcasts as you and are looking for a lunch buddy...&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;