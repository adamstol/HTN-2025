import { ZepClient, EntityType, EdgeType, entityFields } from "@getzep/zep-cloud";
import { env } from "../constants";
// Entity Interfaces

export interface User {
  id: string;
  program_code: string;
  year: number;
  languages: string[];
  timezone: string;
  visibility: string;
}

export interface Program {
  code: string;
  name: string;
  faculty: string;
}

export interface Course {
  code: string;
  term: string;
  section: string;
  title: string;
}

export interface Club {
  slug: string;
  name: string;
  category: string;
}

export interface Topic {
  slug: string;
  name: string;
  facet: "hobby" | "convo" | "academic" | "activity";
  // Optionally: synonyms?: string[];
}

export interface Trait {
  slug: string;
  name: string;
}

export interface MeetupType {
  slug: string;
  name: string;
}

export interface Goal {
  slug: string;
  description: string;
}

export interface Event {
  id: string;
  description: string;
  start_ts: string; // ISO timestamp
  end_ts: string;   // ISO timestamp
}

export type Dorm = "KA" | "RU" | "IH" | "YA" | "CD" | "AU" | "GL" | "OL" | "CR" | "VC";

export interface Language {
  iso: string;
  name: string;
  proficiency: number; // 1–5
}

export interface Group {
  slug: string;
  name: string;
}

export interface Persona {
  id: string;
  name: string;
  type: "study_partner" | "mentor" | "friend" | "cofounder" | "life_partner";
  visibility: string;
}

// Edge Interfaces (all edges support these base properties)
interface EdgeBase {
  weight?: number;
  confidence?: number;
  valid_from?: string; // ISO timestamp
  valid_to?: string;   // ISO timestamp
  visibility?: string;
  source?: string;
}

// Academic & Affiliation
export interface EnrolledIn extends EdgeBase {
  code: string;
  term: string;
  section: string;
}
export interface StudiesIn extends EdgeBase { }
export interface MemberOf extends EdgeBase { }
export interface BelongsTo extends EdgeBase { }

// Interests & Social
export interface InterestedIn extends EdgeBase { }
export interface SeeksTrait extends EdgeBase { }
export interface PrefersMeetup extends EdgeBase { }
export interface HasGoal extends EdgeBase { }
export interface Attended extends EdgeBase { }
export interface ResidesIn extends EdgeBase { }
export interface Speaks extends EdgeBase { }

// Evaluations & Outcomes
export interface MatchRecommended extends EdgeBase {
  reason_vector: string[];
  created_ts: string;
}
export interface MatchAccepted extends EdgeBase {
  ts: string;
}
export interface MatchDeclined extends EdgeBase {
  ts: string;
}
export interface MetWith extends EdgeBase {
  ts: string;
  location?: string;
  duration?: number;
}
export interface GaveFeedback extends EdgeBase {
  rating: number;
  tags: string[];
}

// Persona-Based Matching
export interface WantsToMeet extends EdgeBase { }

export interface PersonaSeeksTrait extends EdgeBase { }
export interface PersonaSeeksTopic extends EdgeBase {
  modality: "talk" | "do";
}
export interface PersonaSeeksProgram extends EdgeBase { }
export interface PersonaSeeksCourse extends EdgeBase { }
export interface PersonaSeeksLanguage extends EdgeBase {
  min_proficiency?: number;
}
export interface PersonaPrefersMeetup extends EdgeBase { }
export interface PersonaSeeksYear extends EdgeBase {
  min?: number;
  max?: number;
}

// Entity Types Map
export const entity_types = {
  User: {} as User,
  Program: {} as Program,
  Course: {} as Course,
  Club: {} as Club,
  Topic: {} as Topic,
  Trait: {} as Trait,
  MeetupType: {} as MeetupType,
  Goal: {} as Goal,
  Event: {} as Event,
  Dorm: {} as Dorm,
  Language: {} as Language,
  Group: {} as Group,
  Persona: {} as Persona,
};

// Edge Types Map
export const edge_types = {
  ENROLLED_IN: {} as EnrolledIn,
  STUDIES_IN: {} as StudiesIn,
  MEMBER_OF: {} as MemberOf,
  BELONGS_TO: {} as BelongsTo,
  INTERESTED_IN: {} as InterestedIn,
  SEEKS_TRAIT: {} as SeeksTrait,
  PREFERS_MEETUP: {} as PrefersMeetup,
  HAS_GOAL: {} as HasGoal,
  ATTENDED: {} as Attended,
  RESIDES_IN: {} as ResidesIn,
  SPEAKS: {} as Speaks,
  MATCH_RECOMMENDED: {} as MatchRecommended,
  MATCH_ACCEPTED: {} as MatchAccepted,
  MATCH_DECLINED: {} as MatchDeclined,
  MET_WITH: {} as MetWith,
  GAVE_FEEDBACK: {} as GaveFeedback,
  WANTS_TO_MEET: {} as WantsToMeet,
  PERSONA_SEEKS_TRAIT: {} as PersonaSeeksTrait,
  PERSONA_SEEKS_TOPIC: {} as PersonaSeeksTopic,
  PERSONA_SEEKS_PROGRAM: {} as PersonaSeeksProgram,
  PERSONA_SEEKS_COURSE: {} as PersonaSeeksCourse,
  PERSONA_SEEKS_LANGUAGE: {} as PersonaSeeksLanguage,
  PERSONA_PREFERS_MEETUP: {} as PersonaPrefersMeetup,
  PERSONA_SEEKS_YEAR: {} as PersonaSeeksYear,
};

// Optionally, define edge_type_map for relationship constraints
export const edge_type_map = {
  // Example: [edge_types]: [source, target]
  ["ENROLLED_IN"]: ["User", "Course"],
  ["STUDIES_IN"]: ["User", "Program"],
  ["MEMBER_OF"]: ["User", "Club"],
  ["BELONGS_TO"]: ["Course", "Program"],
  ["INTERESTED_IN"]: ["User", "Topic"],
  ["SEEKS_TRAIT"]: ["User", "Trait"],
  ["PREFERS_MEETUP"]: ["User", "MeetupType"],
  ["HAS_GOAL"]: ["User", "Goal"],
  ["ATTENDED"]: ["User", "Event"],
  ["RESIDES_IN"]: ["User", "Dorm"],
  ["SPEAKS"]: ["User", "Language"],
  ["MATCH_RECOMMENDED"]: ["User", "User"],
  ["MATCH_ACCEPTED"]: ["User", "User"],
  ["MATCH_DECLINED"]: ["User", "User"],
  ["MET_WITH"]: ["User", "User"],
  ["GAVE_FEEDBACK"]: ["User", "User"],
  ["WANTS_TO_MEET"]: ["User", "Persona"],
  ["PERSONA_SEEKS_TRAIT"]: ["Persona", "Trait"],
  ["PERSONA_SEEKS_TOPIC"]: ["Persona", "Topic"],
  ["PERSONA_SEEKS_PROGRAM"]: ["Persona", "Program"],
  ["PERSONA_SEEKS_COURSE"]: ["Persona", "Course"],
  ["PERSONA_SEEKS_LANGUAGE"]: ["Persona", "Language"],
  ["PERSONA_PREFERS_MEETUP"]: ["Persona", "MeetupType"],
  ["PERSONA_SEEKS_YEAR"]: ["Persona", "Year"],
  // Add more as needed...
};

// Optional: if you don’t already have a client
// const client = new ZepClient({ apiKey: process.env.ZEP_API_KEY! });

/** ---------- ENTITY TYPES (<=10 custom) ---------- **/

const Trait: EntityType = {
  description: "A personality trait that describes a User. This is used for matching users based on their traits. For example, User('Alice') -> RELATES_TO -> Trait('charismatic')",
  fields: {
    description: entityFields.text("More details on the user's trait and context on it"),
  },
};

const MeetupType: EntityType = {
  description: "A meetup type that a User prefers when meeting with new people. For example, User('Alice') -> PREFERS_MEETUP -> MeetupType('cafe') // cafe, lunch, walk, gym, etc.",
  fields: {
    description: entityFields.text("More details on the user's preferred meetup type and context on it"),
  },
};

const Goal: EntityType = {
  description: "A goal that someone wants to achieve. An ambition or aspiration that someone wants to achieve. Whether it's academic, social, entrepreneurial, or personal. For example, User('Toby') -> HAS_GOAL -> Goal('start a YouTube channel') or Friend('Emma') -> HAS_GOAL -> Goal('find a job in tutoring')",
  fields: {
    description: entityFields.text("More details on the user's goal and context on it"),
  },
};

const Dorm: EntityType = {
  description: `A dormitory building in University of ${env.LOCATION_ID === "uofc" ? "Calgary" : "Waterloo"} campus. For example, User('Bob') -> RESIDES_IN -> Dorm('KA')`,
  fields: {
    code: entityFields.text("Dorm code, here's a list of dorms and their associated codes:'Kananaskis Hall'->'KA','Rundle Hall'->'RU','International House'->'IH','Yamnuska Hall'->'YA','Cascade Hall'->'CD','Aurora Hall'->'AU','Glacier Hall'->'GL','Olympus Hall'->'OL','Crowsnest Hall'->'CR','Varsity Courts'->'VC'"),
  },
};

const Language: EntityType = {
  description: "Language spoken by a User. For example, User('Alice') -> SPEAKS -> Language('spa')",
  fields: {
    code: entityFields.text("Three-letter language code; e.g., ara, eng, fra, spa, deu, dan, zho, jpn, etc."),
  },
};

// const Persona: EntityType = {
//   description: "User-defined matching persona with preferences.",
//   fields: {
//     label: entityFields.text("Short label for the persona."),
//     description: entityFields.text("Narrative description of the persona."),
//   },
// };


// Note: Using Zep defaults for Topic and Event. Also use default Organization for Club/Group. :contentReference[oaicite:1]{index=1}

/** ---------- EDGE TYPES (<=10 custom) ---------- **/

const sharedFields = {
  description: entityFields.text("More details on the user's shared interest and context on it"),
};

const STUDIES_IN: EdgeType = {
  description: `Represents that the user studies in a specific program/major at University of ${env.LOCATION_ID === "uofc" ? "Calgary" : "Waterloo"}. For example, User('Bob') -> STUDIES_IN -> Program('PSYC')`,
  fields: {
    ...sharedFields,
  },
  sourceTargets: [{ source: "User", target: "Program" }, { source: "Friend", target: "Program" }],
};

const SPEAKS: EdgeType = {
  description: "Represents that the user speaks a specific language. For example, User('Charlie') -> SPEAKS -> Language('fra')",
  fields: {
    proficiency: entityFields.integer("Proficiency level; e.g., 1-5."),
  },
  sourceTargets: [{ source: "User", target: "Language" }],
};

const HAS_GOAL: EdgeType = {
  description: "Represents that the user has a goal they want to achieve. For example, User('David') -> HAS_GOAL -> Goal('find a job in tutoring')",
  fields: {
    ...sharedFields,
  },
  sourceTargets: [{ source: "User", target: "Goal" }, { source: "Friend", target: "Goal" }],
};

const INTERESTED_IN: EdgeType = {
  description: "Represents that the user is interested in a specific activity, topic, or trait, etc. For example, User('Eve') -> INTERESTED_IN -> Trait('stoicism')",
  fields: {
    ...sharedFields,
  },
  sourceTargets: [{ source: "User", target: "Topic" }, { source: "Friend", target: "Topic" }],
};

const FRIENDS_WITH: EdgeType = {
  description: "Represents that the user is friends with another User. For example, User('Eve') -> FRIENDS_WITH -> Friend('Frank') or Friend('Frank') -> FRIENDS_WITH -> Friend('Eve') when they mention that they both know someone",
  fields: {
    ...sharedFields,
  },
  sourceTargets: [{ source: "User", target: "Friend" }, { source: "Friend", target: "Friend" }],
};

const WORKS_AT: EdgeType = {
  description: "User or their friend works at an organization.",
  fields: {
    job_title: entityFields.text("Job title"),
    description: entityFields.text("More details on the user's job and context on it"),
  },
  sourceTargets: [{ source: "User", target: "Organization" }, { source: "Friend", target: "Organization" }]
};

const ATTENDED: EdgeType = {
  description: "User attended an event.",
  fields: {
    description: entityFields.text("More details on the user's attendance and context on it"),
  },
  sourceTargets: [{ source: "User", target: "Event" }, { source: "Friend", target: "Event" }]
};

// const MATCH_ACCEPTED: EdgeType = {
//   description: "User accepted a recommended match.",
//   fields: {
//     ...baseEdgeFields,
//     ts: entityFields.text("Acceptance timestamp (ISO 8601)."),
//   },
//   sourceTargets: [{ source: "User", target: "User" }],
// };

// const MATCH_DECLINED: EdgeType = {
//   description: "User declined a recommended match.",
//   fields: {
//     ...baseEdgeFields,
//     ts: entityFields.text("Decline timestamp (ISO 8601)."),
//   },
//   sourceTargets: [{ source: "User", target: "User" }],
// };

// const MET_WITH: EdgeType = {
//   description: "Two Users met in real life or virtually.",
//   fields: {
//     ...baseEdgeFields,
//     ts: entityFields.text("Meeting timestamp (ISO 8601)."),
//     location: entityFields.text("Freeform location string. Optional."),
//     duration: entityFields.integer("Duration in minutes. Optional."),
//   },
//   sourceTargets: [{ source: "User", target: "User" }],
// };

// const GAVE_FEEDBACK: EdgeType = {
//   description: "User gave feedback on another User after a meeting.",
//   fields: {
//     ...baseEdgeFields,
//     rating: entityFields.integer("Numeric rating, e.g., 1-5."),
//     tags: entityFields.text("Stringified list of tags, e.g., 'on-time,engaging'."),
//   },
//   sourceTargets: [{ source: "User", target: "User" }],
// };

// const WANTS_TO_MEET: EdgeType = {
//   description: "User wants to meet a specific persona.",
//   fields: {
//     ...baseEdgeFields,
//   },
//   sourceTargets: [{ source: "User", target: "Persona" }],
// };

// const PERSONA_SEEKS_TOPIC: EdgeType = {
//   description: "Persona seeks others around a topic, with interaction modality.",
//   fields: {
//     ...baseEdgeFields,
//     modality: entityFields.text('Interaction mode: "talk" or "do".'),
//   },
//   sourceTargets: [{ source: "Persona", target: "Topic" }], // Topic = default entity type
// };

// const PERSONA_SEEKS_LANGUAGE: EdgeType = {
//   description: "Persona seeks partners by language and proficiency.",
//   fields: {
//     ...baseEdgeFields,
//     min_proficiency: entityFields.integer("Minimum proficiency 0–5. Optional."),
//   },
//   sourceTargets: [{ source: "Persona", target: "Language" }],
// };

// const PERSONA_SEEKS_YEAR: EdgeType = {
//   description: "Persona seeks partners within an academic year band.",
//   fields: {
//     ...baseEdgeFields,
//     min: entityFields.integer("Minimum academic year inclusive. Optional."),
//     max: entityFields.integer("Maximum academic year inclusive. Optional."),
//   },
//   sourceTargets: [{ source: "Persona", target: "Year" }],
// };

// Register the ontology with Zep

async function createOntology() {
  const client = new ZepClient({
    apiKey: process.env.ZEP_API_KEY,
  });

  const ontology = await client.graph.setOntology(
    {
      Trait,
      Goal,
      Language,
      // Group,
      // Persona,
    },
    {
      INTERESTED_IN,
      SPEAKS,
      STUDIES_IN,
      FRIENDS_WITH,
      WORKS_AT,
      ATTENDED,
      HAS_GOAL,
      // MATCH_RECOMMENDED,
    }
  );

  console.log("Ontology created:", ontology);
}

export default createOntology;

if (require.main === module) {
  createOntology().catch(err => { console.error(err); process.exit(1); });
}
// ---------------------------
// Entity type definitions
// ---------------------------
// class User extends EntityModel {
//   program_code?: EntityText;
//   year?: EntityInteger;
//   languages?: EntityText;        // store CSV or per-edge via SPEAKS
//   timezone?: EntityText;
//   visibility?: EntityText;
// }

// class Program extends EntityModel {
//   code?: EntityText;
//   name?: EntityText;
//   faculty?: EntityText;
// }

// class Course extends EntityModel {
//   code?: EntityText;
//   term?: EntityText;
//   section?: EntityText;
//   title?: EntityText;
// }

// class Club extends EntityModel {
//   slug?: EntityText;
//   name?: EntityText;
//   category?: EntityText;
// }

// class Topic extends EntityModel {
//   name?: EntityText;
// }

// class Trait extends EntityModel {
//   name?: EntityText;
// }

// class MeetupType extends EntityModel {
//   name?: EntityText;
// }

// class Goal extends EntityModel {
//   name?: EntityText;
// }

// class Event extends EntityModel {
//   name?: EntityText;
//   when?: EntityDatetime;
//   where?: EntityText;
// }

// class Dorm extends EntityModel {
//   name?: EntityText;
//   campus_area?: EntityText;
// }

// class Language extends EntityModel {
//   name?: EntityText;
//   iso?: EntityText;
// }

// class Group extends EntityModel {
//   name?: EntityText;
// }

// class Persona extends EntityModel {
//   label?: EntityText;
//   description?: EntityText;
// }

// // ---------------------------
// // Edge type definitions
// // ---------------------------
// class EnrolledIn extends EdgeModel {
//   code?: EntityText;
//   term?: EntityText;
//   section?: EntityText;

//   weight?: EntityFloat;
//   confidence?: EntityFloat;
//   valid_from?: EntityDatetime;
//   valid_to?: EntityDatetime;
//   visibility?: EntityText;
//   source?: EntityText;
// }
// class StudiesIn extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class MemberOf extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class BelongsTo extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }

// class InterestedIn extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class SeeksTrait extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class PrefersMeetup extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class HasGoal extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class Attended extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class ResidesIn extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class Speaks extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }

// class MatchRecommended extends EdgeModel {
//   reason_vector?: EntityText;       // store as CSV; or repeatable field if supported
//   created_ts?: EntityDatetime;

//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class MatchAccepted extends EdgeModel {
//   ts?: EntityDatetime;

//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class MatchDeclined extends EdgeModel {
//   ts?: EntityDatetime;

//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class MetWith extends EdgeModel {
//   ts?: EntityDatetime;
//   location?: EntityText;
//   duration?: EntityInteger;

//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class GaveFeedback extends EdgeModel {
//   rating?: EntityFloat;
//   tags?: EntityText;                // CSV if multi-valued

//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }

// class WantsToMeet extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }

// class PersonaSeeksTrait extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class PersonaSeeksTopic extends EdgeModel {
//   modality?: EntityText; // "talk" | "do"
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class PersonaSeeksProgram extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class PersonaSeeksCourse extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class PersonaSeeksLanguage extends EdgeModel {
//   min_proficiency?: EntityInteger;
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class PersonaPrefersMeetup extends EdgeModel {
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }
// class PersonaSeeksYear extends EdgeModel {
//   min?: EntityInteger;
//   max?: EntityInteger;
//   weight?: EntityFloat; confidence?: EntityFloat;
//   valid_from?: EntityDatetime; valid_to?: EntityDatetime;
//   visibility?: EntityText; source?: EntityText;
// }

// // ---------------------------
// // Apply ontology
// // ---------------------------
// const client = new ZepClient({ apiKey: process.env.ZEP_API_KEY! });

// export const ontology = await client.graph.set_ontology({
//   // Scope these to specific graphs/users if needed:
//   // user_ids: ["user_123"], graph_ids: ["graph_abc"],

//   entities: {
//     User,
//     Program,
//     Course,
//     Club,
//     Topic,
//     Trait,
//     MeetupType,
//     Goal,
//     Event,
//     Dorm,
//     Language,
//     Group,
//     Persona,
//   },
//   edges: {
//     ENROLLED_IN: [EnrolledIn, [new EntityEdgeSourceTarget({ source: "User", target: "Course" })]],
//     STUDIES_IN: [StudiesIn, [new EntityEdgeSourceTarget({ source: "User", target: "Program" })]],
//     MEMBER_OF: [MemberOf, [new EntityEdgeSourceTarget({ source: "User", target: "Club" })]],
//     BELONGS_TO: [BelongsTo, [new EntityEdgeSourceTarget({ source: "Course", target: "Program" })]],
//     INTERESTED_IN: [InterestedIn, [new EntityEdgeSourceTarget({ source: "User", target: "Topic" })]],
//     SEEKS_TRAIT: [SeeksTrait, [new EntityEdgeSourceTarget({ source: "User", target: "Trait" })]],
//     PREFERS_MEETUP: [PrefersMeetup, [new EntityEdgeSourceTarget({ source: "User", target: "MeetupType" })]],
//     HAS_GOAL: [HasGoal, [new EntityEdgeSourceTarget({ source: "User", target: "Goal" })]],
//     ATTENDED: [Attended, [new EntityEdgeSourceTarget({ source: "User", target: "Event" })]],
//     RESIDES_IN: [ResidesIn, [new EntityEdgeSourceTarget({ source: "User", target: "Dorm" })]],
//     SPEAKS: [Speaks, [new EntityEdgeSourceTarget({ source: "User", target: "Language" })]],
//     MATCH_RECOMMENDED: [MatchRecommended, [new EntityEdgeSourceTarget({ source: "User", target: "User" })]],
//     MATCH_ACCEPTED: [MatchAccepted, [new EntityEdgeSourceTarget({ source: "User", target: "User" })]],
//     MATCH_DECLINED: [MatchDeclined, [new EntityEdgeSourceTarget({ source: "User", target: "User" })]],
//     MET_WITH: [MetWith, [new EntityEdgeSourceTarget({ source: "User", target: "User" })]],
//     GAVE_FEEDBACK: [GaveFeedback, [new EntityEdgeSourceTarget({ source: "User", target: "User" })]],
//     WANTS_TO_MEET: [WantsToMeet, [new EntityEdgeSourceTarget({ source: "User", target: "Persona" })]],

//     PERSONA_SEEKS_TRAIT: [PersonaSeeksTrait, [new EntityEdgeSourceTarget({ source: "Persona", target: "Trait" })]],
//     PERSONA_SEEKS_TOPIC: [PersonaSeeksTopic, [new EntityEdgeSourceTarget({ source: "Persona", target: "Topic" })]],
//     PERSONA_SEEKS_PROGRAM: [PersonaSeeksProgram, [new EntityEdgeSourceTarget({ source: "Persona", target: "Program" })]],
//     PERSONA_SEEKS_COURSE: [PersonaSeeksCourse, [new EntityEdgeSourceTarget({ source: "Persona", target: "Course" })]],
//     PERSONA_SEEKS_LANGUAGE: [PersonaSeeksLanguage, [new EntityEdgeSourceTarget({ source: "Persona", target: "Language" })]],
//     PERSONA_PREFERS_MEETUP: [PersonaPrefersMeetup, [new EntityEdgeSourceTarget({ source: "Persona", target: "MeetupType" })]],
//     PERSONA_SEEKS_YEAR: [PersonaSeeksYear, [new EntityEdgeSourceTarget({ source: "Persona", target: "User" })]], // "Year" modeled on User
//   },
// });
