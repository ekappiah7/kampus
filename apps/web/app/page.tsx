import { getSchoolContent } from "@/lib/content";
import { Nav } from "@/components/Nav";
import {
  About,
  Academics,
  Admissions,
  Contact,
  EventsPreview,
  FeeSchedule,
  Footer,
  Gallery,
  Hero,
  ParentVoice,
  Safety,
  StaffDirectory,
  TrustSignals,
} from "@/components/Sections";

export const revalidate = 60;

export default async function HomePage() {
  const school = await getSchoolContent();

  return (
    <>
      <Nav school={school} />
      <main>
        <Hero school={school} />
        <TrustSignals school={school} />
        <About school={school} />
        <Academics school={school} />
        <Admissions school={school} />
        <FeeSchedule school={school} />
        <Safety school={school} />
        <StaffDirectory school={school} />
        <Gallery />
        <ParentVoice />
        <EventsPreview school={school} />
        <Contact school={school} />
      </main>
      <Footer school={school} />
    </>
  );
}
