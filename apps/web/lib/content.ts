import { createApiClient } from "@kampus/api-client";

export interface SchoolContentData {
  id: string;
  name: string;
  subdomain: string;
  primaryColor: string;
  logoUrl: string | null;
  whatsappPhone: string | null;
  accreditation: string | null;
  content: {
    heroHeadline: string;
    heroSubcopy: string;
    aboutText: string;
    admissionsText: string;
    safetyPickupPolicy: string;
    statsStudents: number;
    statsTeachers: number;
    statsYears: number;
    jhsComingSoon: boolean;
  };
  testimonials: { id: string; authorName: string; relation: string | null; quote: string }[];
  events: { id: string; title: string; date: string; time: string | null }[];
  staffDirectory: { id: string; name: string; title: string | null }[];
  feeSchedule: { label: string; amount: number; className: string }[];
}

/**
 * Reference-client fixture, used when the API is unreachable (e.g. static build/preview)
 * so the marketing site is never blank. In production this is only a fallback —
 * `getSchoolContent` always tries the live tenant API first.
 */
const ASPIRE_ROYAL_FIXTURE: SchoolContentData = {
  id: "fixture",
  name: "Aspire Royal Academy",
  subdomain: "aspire-royal",
  primaryColor: "#FFC629",
  logoUrl: null,
  whatsappPhone: "+233 24 883 4000",
  accreditation: "Ghana Education Service Accredited",
  content: {
    heroHeadline: "Where every child's aspiration takes root.",
    heroSubcopy:
      "A nurturing basic school in Ghana guiding pupils from Crèche through Primary 6 with a safe, structured, and joyful learning environment.",
    aboutText:
      "Aspire Royal Academy has served families for over a decade, combining the Ghana Education Service curriculum with strong pastoral care.",
    admissionsText: "Admissions are open year-round for Crèche through Primary 6.",
    safetyPickupPolicy:
      "Every pickup is verified against a one-time code generated in the Parent App and confirmed at the gate by school staff before a child is released.",
    statsStudents: 340,
    statsTeachers: 28,
    statsYears: 12,
    jhsComingSoon: true,
  },
  testimonials: [
    { id: "1", authorName: "Ernest Konadu Appiah", relation: "Parent, KG 2", quote: "The pickup code system gives me real peace of mind." },
    { id: "2", authorName: "Mrs. Adjei", relation: "Parent, Primary 3", quote: "Fee balances and grades are always one tap away." },
  ],
  events: [
    { id: "1", title: "PTA General Meeting", date: "2026-08-22", time: "9:00am · Main Hall" },
    { id: "2", title: "New Term Begins", date: "2026-09-03", time: "7:30am · All Levels" },
    { id: "3", title: "Inter-House Sports", date: "2026-09-19", time: "8:00am · School Field" },
  ],
  staffDirectory: [
    { id: "1", name: "Mrs. Abigail Bentil", title: "Class Teacher, KG 2" },
    { id: "2", name: "Mr. Collins Amofa Owusu", title: "Head Teacher & Administrator" },
    { id: "3", name: "Ms. Efua Boateng", title: "Primary Coordinator" },
  ],
  feeSchedule: [
    { label: "Tuition", amount: 900, className: "KG 2" },
    { label: "Feeding fee", amount: 200, className: "KG 2" },
    { label: "PTA dues", amount: 50, className: "KG 2" },
    { label: "Sports & excursion", amount: 400, className: "KG 2" },
  ],
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const SCHOOL_SUBDOMAIN = process.env.NEXT_PUBLIC_SCHOOL_SUBDOMAIN ?? "aspire-royal";

export async function getSchoolContent(): Promise<SchoolContentData> {
  try {
    const client = createApiClient({ baseUrl: API_BASE_URL });
    const data = await client.school.bySubdomain(SCHOOL_SUBDOMAIN);
    return data as SchoolContentData;
  } catch {
    return ASPIRE_ROYAL_FIXTURE;
  }
}
