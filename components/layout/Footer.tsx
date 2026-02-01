// app/layout/Footer.tsx - UPDATED WITH RELIABLE NAV + TOP-OF-PAGE LANDING
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import ContactModal from "./ContactModal";
import { Mail, Clock, CheckCircle2, Shield, FileText, Scale } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isProtected = (href: string) => href === "/search";

  const scrollTop = (smooth = true) => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: smooth ? "smooth" : "auto" });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Gate protected pages
    if (isProtected(href) && status !== "authenticated") {
      e.preventDefault();
      setShowLoginPrompt(true);
      return;
    }

    // If we are already on the destination, just scroll to top
    if (pathname === href) {
      e.preventDefault();
      scrollTop(true);
      return;
    }

    // Otherwise: navigate + force top landing (prevents "cut off" feeling)
    e.preventDefault();
    router.push(href);
    // after route change paint
    setTimeout(() => scrollTop(false), 50);
  };

  return (
    <div style={{ fontFamily: 'Aptos, system-ui, -apple-system, sans-serif' }}>
      <footer className="relative border-t border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <Link
                href="/"
                onClick={(e) => handleNav(e, "/")}
                className="flex items-center gap-4 mb-4 hover:opacity-90 transition-opacity w-fit cursor-pointer group"
              >
                <Image
                  src="/precise-govcon-logo.jpg"
                  alt="PRECISE GOVCON Logo"
                  width={64}
                  height={64}
                  className="rounded-xl"
                  priority
                />
                <div>
                  <h3 className="text-2xl font-black bg-gradient-to-r from-emerald-400 via-cyan-300 to-orange-400 bg-clip-text text-transparent">
                    PRECISE GOVCON
                  </h3>
                  <p className="text-xs uppercase tracking-widest text-slate-400 font-medium">
                    Federal Contract Intelligence
                  </p>
                </div>
              </Link>

              <p className="text-slate-400 text-base leading-relaxed mb-5">
                Federal contract intelligence for data-driven GovCon teams. Streamline your search,
                stay ahead of opportunities.
              </p>

              <div className="space-y-2">
                <div className="flex items-start gap-2 text-base">
                  <Mail className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-slate-300 font-medium">Support</p>
                    <a
                      className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors"
                      href="mailto:support@precisegovcon.com"
                    >
                      support@precisegovcon.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-base text-slate-500">
                  <Clock className="w-5 h-5" />
                  <span>Mon–Fri • 9am–5pm ET</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-slate-100 font-bold text-base uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full" />
                Quick Links
              </h4>

              <ul className="space-y-3">
                <li>
                  <Link
                    href="/"
                    onClick={(e) => handleNav(e, "/")}
                    className="text-slate-300 hover:text-cyan-300 text-base font-semibold transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-cyan-400 transition-colors" />
                    Home
                  </Link>
                </li>

                <li>
                  <Link
                    href="/features"
                    onClick={(e) => handleNav(e, "/features")}
                    className="text-slate-300 hover:text-purple-300 text-base font-semibold transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-purple-400 transition-colors" />
                    Features
                  </Link>
                </li>

                <li>
                  <Link
                    href="/search"
                    onClick={(e) => handleNav(e, "/search")}
                    className="text-slate-300 hover:text-emerald-300 text-base font-semibold transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-emerald-400 transition-colors" />
                    Contract Search
                  </Link>
                </li>

                <li>
                  <Link
                    href="/dashboard"
                    onClick={(e) => handleNav(e, "/dashboard")}
                    className="text-slate-300 hover:text-cyan-300 text-base font-semibold transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-cyan-400 transition-colors" />
                    Dashboard
                  </Link>
                </li>

                <li>
                  <Link
                    href="/about"
                    onClick={(e) => handleNav(e, "/about")}
                    className="text-slate-300 hover:text-orange-300 text-base font-semibold transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-orange-400 transition-colors" />
                    About
                  </Link>
                </li>

                <li>
                  <Link
                    href="/help"
                    onClick={(e) => handleNav(e, "/help")}
                    className="text-slate-300 hover:text-cyan-300 text-base font-semibold transition-colors inline-flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-slate-600 group-hover:bg-cyan-400 transition-colors" />
                    Help Center &amp; System Status
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Section */}
            <div>
              <h4 className="text-slate-100 font-bold text-base uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-emerald-500 to-orange-500 rounded-full" />
                Legal
              </h4>

              <ul className="space-y-3">
                <li>
                  <Link
                    href="/privacy"
                    onClick={(e) => handleNav(e, "/privacy")}
                    className="text-slate-300 hover:text-emerald-300 text-base font-semibold transition-colors inline-flex items-center gap-2 group"
                  >
                    <Shield className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    Privacy Policy
                  </Link>
                </li>

                <li>
                  <Link
                    href="/terms"
                    onClick={(e) => handleNav(e, "/terms")}
                    className="text-slate-300 hover:text-cyan-300 text-base font-semibold transition-colors inline-flex items-center gap-2 group"
                  >
                    <FileText className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    Terms of Use
                  </Link>
                </li>

                <li>
                  <Link
                    href="/security"
                    onClick={(e) => handleNav(e, "/security")}
                    className="text-slate-300 hover:text-orange-300 text-base font-semibold transition-colors inline-flex items-center gap-2 group"
                  >
                    <Shield className="w-4 h-4 text-slate-500 group-hover:text-orange-400 transition-colors" />
                    Security
                  </Link>
                </li>

                <li>
                  <Link
                    href="/accessibility"
                    onClick={(e) => handleNav(e, "/accessibility")}
                    className="text-slate-300 hover:text-emerald-300 text-base font-semibold transition-colors inline-flex items-center gap-2 group"
                  >
                    <Scale className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    Accessibility
                  </Link>
                </li>
              </ul>

              <div className="mt-6 pt-6 border-t border-slate-800">
                <h5 className="text-slate-300 text-sm font-semibold mb-2 uppercase tracking-wider">
                  Resources
                </h5>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="https://sam.gov"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-300 hover:text-cyan-300 text-base font-semibold transition-colors inline-flex items-center gap-2"
                    >
                      SAM.gov <span className="text-sm text-slate-500">↗</span>
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Contact Section */}
            <div>
              <h4 className="text-slate-100 font-bold text-base uppercase tracking-wider mb-4 flex items-center gap-2">
                <div className="h-1 w-8 bg-gradient-to-r from-orange-500 to-cyan-500 rounded-full" />
                Get In Touch
              </h4>

              <p className="text-slate-400 text-base mb-5 leading-relaxed">
                Partner with us for federal contract intelligence and consulting services.
              </p>

              <button
                onClick={() => setIsContactModalOpen(true)}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-600 via-emerald-600 to-cyan-600 hover:from-cyan-700 hover:via-emerald-700 hover:to-cyan-700 text-white px-6 py-3.5 text-base font-bold transition-all shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]"
              >
                Contact Us
              </button>

              <div className="mt-5 space-y-3">
                <div className="flex items-start gap-2.5 text-sm text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Response within 1 business day</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span>Free initial consultation</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
                  <span>Federal contracting experts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-slate-800/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-slate-500 text-sm">© {year} Precise Analytics • Built for PRECISE GOVCON</p>
            </div>
          </div>
        </div>

        {/* Decorative bottom gradient */}
        <div className="h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-orange-500" />
      </footer>

      {/* Contact Modal */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-4">Sign In Required</h3>
            <p className="text-slate-300 mb-6 text-base">
              Please sign in to access Contract Search features.
            </p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-bold rounded-xl text-center transition-all text-base"
                onClick={() => setShowLoginPrompt(false)}
              >
                Sign In
              </Link>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all text-base"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}