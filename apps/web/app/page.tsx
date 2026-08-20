import { getSiteData } from "@/lib/api";
import { Nav } from "@/components/Nav";
import {
  About,
  Academics,
  Admissions,
  Contact,
  Events,
  Fees,
  Footer,
  Gallery,
  Hero,
  ParentVoice,
  Safety,
  Staff,
  TrustSignals,
  WhatsAppFab,
} from "@/components/Sections";

export const revalidate = 30;

export default async function HomePage() {
  const site = await getSiteData();

  // Nothing is invented: until a school is set up there is genuinely no content to show.
  if (!site) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[16px] bg-brand text-2xl">🏫</div>
          <h1 className="font-display text-2xl font-bold">This site isn&apos;t set up yet</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
            Once the school completes setup in the staff portal, its website appears here automatically.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Nav site={site} />
      <main>
        <Hero site={site} />
        <TrustSignals site={site} />
        <About site={site} />
        <Academics site={site} />
        <Admissions site={site} />
        <Fees site={site} />
        <Events site={site} />
        <Safety site={site} />
        <Staff site={site} />
        <Gallery site={site} />
        <ParentVoice site={site} />
        <Contact site={site} />
      </main>
      <Footer site={site} />
      <WhatsAppFab site={site} />
    </>
  );
}
