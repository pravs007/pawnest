import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  CalendarDays, 
  MapPin, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

const Landing = () => {
  return (
    <div className="flex min-h-screen flex-col bg-brand-light selection:bg-brand-orange selection:text-white">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-brand-cream/30 px-6 lg:px-12 bg-white/70 backdrop-blur-md sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-wide text-brand-orange">🐾 PawNest</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/lost-found" className="text-sm font-semibold text-brand-dark/80 hover:text-brand-orange transition-colors hidden sm:block">Lost & Found</Link>
          <Link to="/rescue" className="text-sm font-semibold text-brand-dark/80 hover:text-brand-orange transition-colors hidden sm:block">Rescue Board</Link>
          <Link to="/login" className="rounded-xl border border-brand-cream bg-white px-4 py-2 text-sm font-bold text-brand-dark/80 hover:bg-brand-cream/40 transition-all duration-200">
            Sign In
          </Link>
          <Link to="/register" className="rounded-xl bg-brand-orange px-4 py-2 text-sm font-bold text-white shadow-md shadow-brand-orange/15 hover:bg-brand-orange/90 transition-all duration-200">
            Join PawNest
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 py-16 text-center sm:px-12 lg:px-24 lg:py-24 bg-gradient-to-b from-brand-cream/30 to-brand-light">
          <div className="mx-auto max-w-4xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/10 px-3.5 py-1.5 text-sm font-bold text-brand-orange mb-6">
              🐾 Empowering Pet Parents & Saving Stray Lives
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-brand-dark sm:text-5xl lg:text-6xl leading-tight">
              AI-Powered Care For Your <br className="hidden sm:inline" />
              <span className="text-brand-orange">Pets</span> & Community Rescue
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-dark/70">
              PawNest brings state-of-the-art AI veterinary guidance, vaccination timelines, lost & found boards, and community-driven rescue dispatcher panels into one beautiful, easy-to-use platform.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/register"
                className="flex items-center justify-center gap-2 rounded-2xl bg-brand-orange px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand-orange/20 hover:bg-brand-orange/95 hover:translate-y-[-2px] transition-all duration-200"
              >
                Get Started For Free
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/rescue"
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-brand-orange/40 bg-white px-8 py-4 text-base font-bold text-brand-orange hover:bg-brand-cream/20 hover:translate-y-[-2px] transition-all duration-200"
              >
                Report Emergency Rescue
                <ShieldAlert className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Graphic Element */}
          <div className="mt-16 flex justify-center">
            <div className="relative rounded-3xl border border-brand-cream bg-white p-4 shadow-2xl max-w-3xl overflow-hidden hover-card">
              <img
                src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80"
                alt="A happy golden retriever"
                className="rounded-2xl max-h-[350px] w-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-20 lg:px-24 bg-white">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight text-brand-dark sm:text-4xl">
                Every Care Tool You Need, Combined
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-brand-dark/70">
                Explore the core modules built specifically for pet caregivers, local shelters, and animal lovers.
              </p>
            </div>

            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-2xl border border-brand-cream/60 p-6 hover-card bg-brand-light/35">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange mb-4">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-brand-dark">AI Pet Assistant</h3>
                <p className="mt-2 text-sm text-brand-dark/70">
                  Got questions about toxic foods, training methods, or behavior issues? Ask our AI assistant for veterinary-backed tips instantly.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-2xl border border-brand-cream/60 p-6 hover-card bg-brand-light/35">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green mb-4">
                  <CalendarDays className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-brand-dark">Vaccine Scheduler</h3>
                <p className="mt-2 text-sm text-brand-dark/70">
                  Plan, record, and track vaccine administrations on a custom timeline calendar. Get notified of upcoming boosters easily.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-2xl border border-brand-cream/60 p-6 hover-card bg-brand-light/35">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange mb-4">
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-brand-dark">Lost & Found Map</h3>
                <p className="mt-2 text-sm text-brand-dark/70">
                  File missing reports or stray reports. Filter location grids, upload pictures, and contact owners to safely return animals.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="rounded-2xl border border-brand-cream/60 p-6 hover-card bg-brand-light/35">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange/10 text-brand-orange mb-4">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-brand-dark">Emergency Rescue</h3>
                <p className="mt-2 text-sm text-brand-dark/70">
                  Report stray animals in danger, injured wildlife, or rescue emergencies. Pinpoint coordinates and track dispatch status.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="rounded-2xl border border-brand-cream/60 p-6 hover-card bg-brand-light/35">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-green/10 text-brand-green mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-brand-dark">Admin Analytics</h3>
                <p className="mt-2 text-sm text-brand-dark/70">
                  Manage users, toggle verification badges, validate listings, assign rescue squads, and evaluate platform statistics.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-6 py-20 lg:px-24 bg-white">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-3xl font-extrabold text-brand-dark">Loved by Pet Parents</h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-2">
              <div className="rounded-2xl bg-brand-light/50 p-8 border border-brand-cream/35 relative">
                <span className="text-4xl text-brand-orange/20 font-serif absolute top-4 left-4">“</span>
                <p className="text-brand-dark/80 italic text-sm relative z-10">
                  "The Vaccination Tracker was a lifesaver. Being able to log boosters and view them on a clean calendar helps me keep check of my puppy's schedule effortlessly. The AI assistant is surprisingly smart with puppy nutrition tips too!"
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Sarah" alt="Sarah" className="h-10 w-10 rounded-full border border-brand-orange/20" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-brand-dark">Sarah Jenkins</p>
                    <p className="text-xs text-brand-dark/50">Milo's Parent (Golden Retriever)</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-brand-light/50 p-8 border border-brand-cream/35 relative">
                <span className="text-4xl text-brand-orange/20 font-serif absolute top-4 left-4">“</span>
                <p className="text-brand-dark/80 italic text-sm relative z-10">
                  "I reported a stray cat in our parking lot that looked hurt. Using the Emergency Rescue module, the dispatch team sent animal rescuers in an hour, and we tracked their status from reported to rescued. Remarkable tool!"
                </p>
                <div className="mt-6 flex items-center justify-center gap-3">
                  <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=Marcus" alt="Marcus" className="h-10 w-10 rounded-full border border-brand-orange/20" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-brand-dark">Marcus Thorne</p>
                    <p className="text-xs text-brand-dark/50">Community Volunteer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-brand-cream/30 bg-brand-dark text-white/95 px-6 py-12 lg:px-24">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row md:justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-wide text-brand-orange">🐾 PawNest</span>
          </div>
          <p className="text-xs text-white/50">&copy; 2026 PawNest Inc. AI Pet Care & Community Rescue operations.</p>
          <div className="flex gap-4">
            <Link to="/lost-found" className="text-xs text-white/70 hover:text-brand-orange transition-colors">Lost & Found</Link>
            <Link to="/rescue" className="text-xs text-white/70 hover:text-brand-orange transition-colors">Rescue</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
