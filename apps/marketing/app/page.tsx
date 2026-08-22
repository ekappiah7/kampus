import { Nav, PromoBar } from "@/components/Nav";
import { BookDemo } from "@/components/BookDemo";
import {
  Capabilities,
  Differentiators,
  Faq,
  Footer,
  Hero,
  LiveDemo,
  MarkSheetFeature,
  Pricing,
  Problem,
  Surfaces,
} from "@/components/Sections";

export default function Page() {
  return (
    <>
      <PromoBar />
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Surfaces />
        <Differentiators />
        <MarkSheetFeature />
        <Capabilities />
        <LiveDemo />
        <Pricing />
        <Faq />
        <BookDemo />
      </main>
      <Footer />
    </>
  );
}
