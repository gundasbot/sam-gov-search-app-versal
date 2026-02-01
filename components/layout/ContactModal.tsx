"use client";

import React, { useEffect, useState, useCallback } from "react";
import { X } from "lucide-react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Memoize closeAll to prevent it from changing on every render
  const closeAll = useCallback(() => {
    setStatus("idle");
    setErrorMsg(null);
    setLoading(false);
    onClose();
  }, [onClose]);

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeAll();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeAll]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Reset banners when opening
  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setErrorMsg(null);
      setLoading(false);
    }
  }, [isOpen]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Capture the form element immediately (before any await)
    const formEl = e.currentTarget;

    setLoading(true);
    setStatus("idle");
    setErrorMsg(null);

    const form = new FormData(formEl);
    const payload = {
      firstName: String(form.get("firstName") || "").trim(),
      lastName: String(form.get("lastName") || "").trim(),
      email: String(form.get("email") || "").trim(),
      phone: String(form.get("phone") || "").trim(),
      company: String(form.get("company") || "").trim(),
      inquiryType: String(form.get("inquiryType") || "").trim(),
      message: String(form.get("message") || "").trim(), // OPTIONAL
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      // Treat as success only when API returns { success: true }
      if (res.ok && data?.success === true) {
        setStatus("ok");
        formEl.reset();
        return;
      }

      setStatus("err");
      setErrorMsg(
        typeof data?.error === "string"
          ? data.error
          : "Unable to send message. Please try again."
      );
    } catch (err) {
      console.error("Contact form submit error:", err);
      setStatus("err");
      setErrorMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={closeAll}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto bg-slate-900 rounded-xl border border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-200">Contact Us</h2>
            <p className="text-slate-400 text-sm mt-1">
              Partner with us for federal contract intelligence and consulting
              services.
            </p>
          </div>
          <button
            onClick={closeAll}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {status === "ok" ? (
            // ✅ SUCCESS SCREEN (same modal)
            <div className="text-center py-6">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>

              <h3 className="text-lg font-bold text-slate-100">
                Message Received — Thank You!
              </h3>

              <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
                We appreciate your business and the opportunity to support your
                federal contracting goals. 📩
                <br />
                <br />
                A member of the Precise GovCon team will review your inquiry and
                follow up within{" "}
                <span className="font-semibold text-slate-100">
                  2–3 business days
                </span>
                .
              </p>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={closeAll}
                  className="rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-3 text-sm font-semibold transition-all shadow-lg shadow-cyan-500/20"
                >
                  Close
                </button>
              </div>

              <p className="mt-4 text-xs text-slate-500">
                If you need to add details, email{" "}
                <a className="underline" href="mailto:support@precisegovcon.com">
                  support@precisegovcon.com
                </a>
                .
              </p>
            </div>
          ) : (
            // ✅ FORM SCREEN
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-slate-300 text-sm mb-1.5"
                  >
                    First Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    required
                    placeholder="John"
                    className="w-full rounded-lg bg-slate-950/50 border border-slate-700 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-slate-300 text-sm mb-1.5"
                  >
                    Last Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    required
                    placeholder="Doe"
                    className="w-full rounded-lg bg-slate-950/50 border border-slate-700 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-slate-300 text-sm mb-1.5"
                >
                  Business Email <span className="text-rose-400">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="john.doe@company.com"
                  className="w-full rounded-lg bg-slate-950/50 border border-slate-700 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-slate-300 text-sm mb-1.5"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    className="w-full rounded-lg bg-slate-950/50 border border-slate-700 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                  />
                </div>

                <div>
                  <label
                    htmlFor="company"
                    className="block text-slate-300 text-sm mb-1.5"
                  >
                    Company/Organization
                  </label>
                  <input
                    id="company"
                    name="company"
                    placeholder="Your Company Name"
                    className="w-full rounded-lg bg-slate-950/50 border border-slate-700 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="inquiryType"
                  className="block text-slate-300 text-sm mb-1.5"
                >
                  Inquiry Type <span className="text-rose-400">*</span>
                </label>
                <select
                  id="inquiryType"
                  name="inquiryType"
                  required
                  defaultValue=""
                  className="w-full rounded-lg bg-slate-950/50 border border-slate-700 px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                >
                  <option value="" disabled>
                    Select an option
                  </option>
                  <option value="contract">Contract Opportunity</option>
                  <option value="consulting">Consulting Services</option>
                  <option value="partnership">Partnership Inquiry</option>
                  <option value="subcontracting">Subcontracting</option>
                  <option value="support">Technical Support</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {/* Message (optional) */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-slate-300 text-sm mb-1.5"
                >
                  Message <span className="text-slate-500">(optional)</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Tell us about your project or inquiry..."
                  rows={4}
                  className="w-full rounded-lg bg-slate-950/50 border border-slate-700 px-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition resize-none"
                />
              </div>

              {/* Error */}
              {status === "err" && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-4">
                  <p className="text-rose-300 text-sm">
                    {errorMsg || (
                      <>
                        Unable to send message. Please email us directly at{" "}
                        <a
                          className="underline font-medium"
                          href="mailto:support@precisegovcon.com"
                        >
                          support@precisegovcon.com
                        </a>
                        .
                      </>
                    )}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-slate-700 disabled:to-slate-700 text-white px-6 py-3 text-sm font-semibold disabled:opacity-60 transition-all shadow-lg shadow-cyan-500/20"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>

                <button
                  type="button"
                  onClick={closeAll}
                  className="px-6 py-3 text-sm font-semibold text-slate-400 hover:text-slate-200 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-slate-500 pt-1">
                By submitting, you agree we may contact you about your inquiry.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}