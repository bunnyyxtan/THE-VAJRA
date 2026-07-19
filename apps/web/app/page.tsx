import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Footer } from "@/components/marketing/footer";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Features />
      <CtaBanner />
      <Footer />
    </main>
  );
}
