export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export const SCHOOL_SUBDOMAIN = process.env.NEXT_PUBLIC_SCHOOL_SUBDOMAIN ?? "default";

export interface SiteData {
  school: {
    id: string;
    name: string;
    subdomain: string;
    primaryColor: string;
    logoUrl: string | null;
    phone: string | null;
    email: string | null;
    whatsappPhone: string | null;
    address: string | null;
    officeHours: string | null;
    accreditation: string | null;
    gesRegNo: string | null;
  };
  content: {
    heroEyebrow: string | null;
    heroHeadline: string | null;
    heroSubcopy: string | null;
    aboutEyebrow: string | null;
    aboutHeading: string | null;
    aboutText: string | null;
    aboutTextSecondary: string | null;
    missionText: string | null;
    visionText: string | null;
    academicsHeading: string | null;
    academicsSubcopy: string | null;
    admissionsHeading: string | null;
    admissionsText: string | null;
    safetyHeading: string | null;
    safetySubcopy: string | null;
    feesNote: string | null;
    voiceText: string | null;
    footerBlurb: string | null;
    statsStudents: number | null;
    statsTeachers: number | null;
    statsYears: number | null;
    teacherRatio: string | null;
    maxClassSize: string | null;
  } | null;
  programmes: { id: string; name: string; ageRange: string | null; description: string | null; icon: string | null; tint: string | null; comingSoon: boolean }[];
  safetyPolicies: { id: string; title: string; description: string | null; icon: string | null }[];
  trustBadges: { id: string; label: string; icon: string | null }[];
  admissionSteps: { id: string; title: string; description: string | null }[];
  testimonials: { id: string; authorName: string; relation: string | null; quote: string; photoUrl: string | null }[];
  events: { id: string; title: string; date: string; time: string | null }[];
  staff: { id: string; name: string; title: string | null; role: string; photoUrl: string | null }[];
  classes: { id: string; name: string }[];
  feeSchedule: { className: string; tuition: number | null; feeding: number | null }[];
  otherFees: { label: string; amount: number; className: string }[];
  gallery: { id: string; url: string; caption: string | null }[];
}

/**
 * The site renders from live tenant data. When the API is unreachable or the school
 * hasn't been set up yet we return null and the page shows a "coming soon" holding
 * state rather than inventing content — no placeholder school data anywhere.
 */
export async function getSiteData(): Promise<SiteData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/site/${SCHOOL_SUBDOMAIN}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return (await res.json()) as SiteData;
  } catch {
    return null;
  }
}
