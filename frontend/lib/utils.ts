import { cva } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import stringSimilarity from "string-similarity";
import { NextResponse } from "next/server";
import { SharedStore } from "./pocketflow/types";
import { searchClubs } from "./supabase/queries";
import MessagingResponse from "twilio/lib/twiml/MessagingResponse";

import users from "./zep/mock_users.json";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);



// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;


export const siteConfig = {
  name: 'Exo',
  slogan: 'Deepen Your Relationships Through Meaningful Conversations',
  hero: 'Deepen Your Relationships Through Meaningful Conversations',
  description:
    'In a world of surface-level interactions, Exo gives you the tools to strengthen your relationships and connect on a deeper level',
  url: '',
  ogImage: '',
  links: {
    twitter: 'https://x.com/rami__maalouf',
    github: 'https://github.com/psycho-baller/exo',
    waitlist: 'https://survey.typeform.com/to/erptGdCr',
    discord: 'https://discord.gg/m9mWXcrstw',
    kofi: 'https://ko-fi.com/ramimaalouf',
    linkedin: 'https://www.linkedin.com/in/rami-m',
    youtube: 'https://youtube.com/@ramimaalouf',
    instagram: 'https://www.instagram.com/psycho.baller/',
    portfolio: 'https://rami-maalouf.tech',
    iOS: 'https://apps.apple.com/app/exo-have-better-conversations/id6740080383',
    android: 'https://play.google.com/store/apps/details?id=com.ramimaalouf.rooots',
  },
} as const


export const headerRoutes = [
  {
    id: 1,
    title: 'About',
    newTab: false,
    path: '/',
  },
  {
    id: 2,
    title: 'Mission',
    newTab: false,
    path: '/#mission',
  },
  {
    id: 3,
    title: 'How i work',
    newTab: false,
    path: '/#how-i-work',
  },
  {
    id: 4,
    title: 'Discord',
    newTab: true,
    path: siteConfig.links.discord,
  },
  // {
  //   id: 5,
  //   title: 'Support Us',
  //   newTab: true,
  //   path: siteConfig.links.kofi,
  // },
] as const

export function pickBestEmail(firstName: string, candidates: string[]): string | null {
  if (candidates.length === 0) return null;


  const expectedPrefix = `${firstName.toLowerCase()}.`;
  const ratings = stringSimilarity.findBestMatch(
    expectedPrefix,
    candidates.map((e) => e.split("@")[0])
  );
  const bestIdx = ratings.bestMatchIndex;
  return candidates[bestIdx];
}

export function looksLikeEmail(s?: string) {
  return !!s?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/i);
}

const YES = new Set(["yes", "y", "yeah", "yup", "sure", "confirm", "correct"]);
const NO = new Set(["no", "n", "nope", "nah", "incorrect"]);

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
}


export function isYes(text: string): boolean {
  return YES.has(normalize(text));
}


export function isNo(text: string): boolean {
  return NO.has(normalize(text));
}


export function isEmail(text: string): boolean {
  if (!text) return false;
  if (text.length > 254) return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  return re.test(text.trim());
}


export function inferFirstName(profileName?: string): string | undefined {
  if (!profileName) return undefined;
  const token = profileName.split(/\s+/)[0];
  if (/^[A-Za-z][A-Za-z'-]{1,30}$/.test(token)) return token;
  return undefined;
}


export function sessionIdFromPhone(from: string): string {
  return `wa:${from}`; // stable id
}


export function prompt(msg: string): NextResponse {
  const twiml = new MessagingResponse();
  twiml.message(msg);
  return new NextResponse(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}

export const emailRe = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
export const yesRe = /^(y|ya|yes|yup|yeah|ok|okay|sure|confirm|correct|affirmative)\b/i;
export const noRe = /^(n|no|nope|nah)\b/i;


export function extractEmail(text?: string): string | null {
  if (!text) return null;
  const m = text.match(emailRe);
  return m ? m[0] : null;
}

/**
 * Prompt for the AI to provide more info on the user
 * @param shared
 * @returns
 */
export function userInfo(shared: SharedStore): string {
  const realUser = shared.user;
  const mockUser2 = {
    firstName: users[1].first_name,
    lastName: users[1].last_name,
    email: users[1].email,
    phone: users[1].phone,
  };
  const user = process.env.ZEP_GRAPH_ID?.includes("mock") ? mockUser2 : realUser;
  return `
Here is some info on the student you are currently chatting with:

Name: ${user.firstName} ${user.lastName}
Email: ${user.email}`;
}
