import FloatingBlobs from '@/components/landing/FloatingBlobs';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Ember',
  description: 'Read our Terms of Service to understand your rights and responsibilities when using our platform.',
};

const TermsPage = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center my-12">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent-custom bg-clip-text text-transparent mb-4">
          Terms of Service
        </h1>
        <p className="text-muted-foreground">Last updated: July 26, 2025</p>
      </div>

      <div className="prose prose-lg dark:prose-invert max-w-none">
        <div className="bg-card p-6 rounded-lg shadow-sm mb-8">
          <p className="text-lg leading-relaxed">
            Ember&apos;s Terms of Service summarize how you can sign up with your university email, interact via chat to build a personalized profile, opt into profile sharing and group chats, and trust that your data is used responsibly under Alberta law. These Terms define key concepts like &quot;Service&quot; and &quot;Connection Profile&quot;, outline age requirements and user expectations, explain how we process your data with third-party AI providers, and set out liability limits and contact details.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-border">Definitions</h2>
          <ul className="space-y-3">
            <li className="flex">
              <span className="font-medium text-primary mr-2 text-nowrap">&quot;Service&quot;</span>
              means Ember, the AI superconnector accessible at heyember.me.
            </li>
            <li className="flex">
              <span className="font-medium text-primary mr-2 text-nowrap">&quot;User&quot;</span>
              means any individual who registers with a valid US or Canadian university email and interacts with Ember via chat.
            </li>
            <li className="flex">
              <span className="font-medium text-primary mr-2 text-nowrap">&quot;Connection Profile&quot;</span>
              means the information collected during your conversation with Ember, including interests, academic details, and match preferences.
            </li>
            <li className="flex">
              <span className="font-medium text-primary mr-2 text-nowrap">&quot;Match&quot;</span>
              means another User whose Connection Profile aligns with yours and who has mutually opted in to receive introductions.
            </li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-border">Eligibility</h2>
          <p>You must be at least 18 years of age to use the Service.</p>
          <p>By using the Service, you represent and warrant that you meet this age requirement.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-border">Registration and Account Activation</h2>
          <p>To register, you provide a valid US or Canadian university email on heyember.me.</p>
          <p>Your account is activated once you complete the initial chat session with Ember to establish your Connection Profile.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-border">Profile Creation and Matching</h2>
          <p>Ember learns about your interests and goals through chat interactions.</p>
          <p>Based on these conversations, Ember builds your Connection Profile to capture who you are and who you want to meet.</p>
          <p>Ember then searches for compatible matches on campus using your Connection Profile.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-border">Profile Sharing and Group Chat</h2>
          <p>When Ember finds a potential Match, it only shares your Profile Information if both you and the other User explicitly approve.</p>
          <p>Once approval is given by both parties, Ember sets up a group chat to facilitate introductions.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-border">User Conduct</h2>
          <p>Users must maintain respectful and appropriate behavior when interacting with Ember and other Users.</p>
          <p>Inappropriate conduct—including harassment, hate speech, or attempts to misuse the system—may result in suspension or removal.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-border">AI Processing and Data Usage</h2>
          <p>Ember uses industry-leading third-party AI providers (e.g., OpenAI) to process your chat interactions and build your Connection Profile.</p>
          <p>Your conversation data and profile details may be stored securely to improve matching accuracy and Service quality.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-border">Intellectual Property</h2>
          <p>All content, features, and functionality of the Service are the exclusive property of Ember or its licensors.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-border">Limitation of Liability</h2>
          <p>The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind.</p>
          <p>Ember is not liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-border">Governing Law</h2>
          <p>These Terms are governed by the laws of the Province of Alberta and the federal laws of Canada applicable therein.</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-border">Changes to Terms</h2>
          <p>We may update these Terms from time to time. Material changes will be communicated via email to your registered address or posted on the Service. Continued use after notification constitutes acceptance of the revised Terms.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 pb-2 border-b border-border">Contact Information</h2>
          <p>For questions about these Terms, please contact us at <a href="mailto:legal@heyember.me" className="text-primary hover:underline">legal@heyember.me</a>.</p>
        </section>
    </div>
    </div>
  );
};

export default TermsPage;
