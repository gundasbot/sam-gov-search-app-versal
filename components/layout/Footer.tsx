// components/layout/CompactFooter.tsx
// Updated: 50% larger fonts, bold text, same vertical space

"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import ContactModal from "./ContactModal";
import { Mail, Clock, X } from "lucide-react";

export default function CompactFooter() {
  const year = new Date().getFullYear();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showFooter, setShowFooter] = useState(false);

  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Show footer when user scrolls near bottom
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const threshold = 300; // Show footer when within 300px of bottom
      
      setShowFooter(scrollPosition >= documentHeight - threshold);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isProtected = (href: string) => href === "/search";

  const scrollTop = (smooth = true) => {
    const mainContent = document.querySelector('main');
    if (mainContent) {
      mainContent.scrollTo({ top: 0, left: 0, behavior: smooth ? "smooth" : "auto" });
    }
  };

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isProtected(href) && status !== "authenticated") {
      e.preventDefault();
      setShowLoginPrompt(true);
      return;
    }

    if (pathname === href) {
      e.preventDefault();
      scrollTop(true);
      return;
    }

    e.preventDefault();
    router.push(href);
    setTimeout(() => scrollTop(false), 50);
  };

  return (
    <div style={{ fontFamily: 'Aptos, system-ui, -apple-system, sans-serif' }}>
      {/* Slide-up footer modal */}
      <footer className={`fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700 bg-slate-800 overflow-hidden transition-transform duration-500 ease-in-out ${
        showFooter ? 'translate-y-0' : 'translate-y-full'
      }`}>
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

        {/* Close button */}
        <button
          onClick={() => setShowFooter(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors z-10"
          aria-label="Close footer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 90% width container (5% margin each side) - 50% taller for more content */}
        <div className="relative w-[90%] mx-auto px-6 py-10 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-4 gap-12 items-start">
            {/* Brand Section - 50% larger fonts */}
            <div>
              <Link
                href="/"
                onClick={(e) => handleNav(e, "/")}
                className="flex items-center gap-2 mb-4 hover:opacity-90 transition-opacity cursor-pointer group"
              >
                <Image
                  src="/logo.png"
                  alt="Precise GovCon"
                  width={48}
                  height={48}
                  className="w-12 h-12 group-hover:scale-105 transition-transform"
                  priority
                />
                <div className="flex flex-col">
                  <div className="text-2xl font-black leading-tight tracking-tight">
                    <span className="text-white">PRECISE</span>{' '}
                    <span className="text-[#f97316]">GOVCON</span>
                  </div>
                  <div className="text-xs font-bold text-slate-400 tracking-wide">
                    contracting intelligence
                  </div>
                </div>
              </Link>

              <div className="space-y-2">
                <a
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-lg font-black transition-colors"
                  href="mailto:support@precisegovcon.com"
                >
                  <Mail className="w-5 h-5" />
                  support@precisegovcon.com
                </a>
                <div className="flex items-center gap-1.5 text-slate-400 text-sm font-black">
                  <Clock className="w-4 h-4" />
                  Mon–Fri • 9am–5pm ET
                </div>
              </div>
            </div>

            {/* Quick Links - 50% larger, bold text */}
            <div>
              <h4 className="text-white font-black text-lg uppercase tracking-wider mb-4">
                QUICK LINKS
              </h4>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  { href: '/', label: 'Home' },
                  { href: '/features', label: 'Features' },
                  { href: '/search', label: 'Contract Search' },
                  { href: '/dashboard', label: 'Dashboard' },
                  { href: '/about', label: 'About' },
                  { href: '/help', label: 'Help Center' }
                ].map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={(e) => handleNav(e, link.href)}
                      className="text-slate-300 hover:text-cyan-300 text-lg font-black transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Section - 50% larger, bold text */}
            <div>
              <h4 className="text-white font-black text-lg uppercase tracking-wider mb-4">
                LEGAL
              </h4>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  { href: '/privacy', label: 'Privacy Policy' },
                  { href: '/terms', label: 'Terms of Use' },
                  { href: '/security', label: 'Security' },
                  { href: '/accessibility', label: 'Accessibility' }
                ].map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={(e) => handleNav(e, link.href)}
                      className="text-slate-300 hover:text-emerald-300 text-lg font-black transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Section - 50% larger, bold text */}
            <div>
              <h4 className="text-white font-black text-lg uppercase tracking-wider mb-4">
                GET IN TOUCH
              </h4>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white px-4 py-3 text-xl font-black transition-all shadow-lg uppercase tracking-wide mb-3"
              >
                Contact Us
              </button>
              <p className="text-sm text-slate-400 mt-2 font-black">
                © {year} Precise Analytics
              </p>
            </div>
          </div>
        </div>

        {/* Decorative bottom gradient - thinner */}
        <div className="h-0.5 bg-gradient-to-r from-cyan-500 via-emerald-500 to-orange-500" />
      </footer>

      {/* Contact Modal */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-3">Sign In Required</h3>
            <p className="text-slate-300 mb-4 text-sm">
              Please sign in to access Contract Search features.
            </p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-bold rounded-lg text-center transition-all text-sm"
                onClick={() => setShowLoginPrompt(false)}
              >
                Sign In
              </Link>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all text-sm"
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
