"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
import { X, Lock, Mail, KeyRound, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AuthModalMode = "access" | "login";

type OpenArgs = {
  title?: string;
  message?: string;
  redirectTo?: string; // where to go after login
};

type AuthModalCtx = {
  openAccessModal: (args?: OpenArgs) => void;
  openLoginModal: (args?: OpenArgs) => void;
  close: () => void;
};

const Ctx = createContext<AuthModalCtx | null>(null);

export function useAuthModal() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuthModal must be used within AuthModalProvider");
  return v;
}

export default function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<AuthModalMode>("access");
  const [title, setTitle] = useState("Access required");
  const [message, setMessage] = useState(
    "Log in to access our full functions and capabilities."
  );
  const [redirectTo, setRedirectTo] = useState<string>("/search");

  // login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetLoginState = () => {
    setEmail("");
    setPassword("");
    setSubmitting(false);
    setError(null);
  };

  const openAccessModal = (args?: OpenArgs) => {
    setTitle(args?.title || "Access required");
    setMessage(
      args?.message || "Log in to access our full functions and capabilities."
    );
    setRedirectTo(args?.redirectTo || "/search");
    setMode("access");
    resetLoginState();
    setIsOpen(true);
  };

  const openLoginModal = (args?: OpenArgs) => {
    setTitle(args?.title || "Sign in");
    setMessage(args?.message || "Log in to access our full functions and capabilities.");
    setRedirectTo(args?.redirectTo || "/search");
    setMode("login");
    resetLoginState();
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
    setTimeout(() => {
      // keep it clean for next open
      setMode("access");
      resetLoginState();
    }, 150);
  };

  const value = useMemo<AuthModalCtx>(
    () => ({ openAccessModal, openLoginModal, close }),
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Call NextAuth signIn with redirect: false to handle errors client-side
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: redirectTo,
      });

      if (result?.error) {
        // Handle specific error messages
        if (result.error === "CredentialsSignin") {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(result.error || "Sign in failed. Please try again.");
        }
        setSubmitting(false);
      } else if (result?.ok) {
        // Success - redirect to callback URL or dashboard
        window.location.href = result.url || redirectTo;
      }

    } catch (err: any) {
      // This catches network errors or unexpected failures
      console.error('Sign-in error:', err);
      setError("Connection error. Please check your internet and try again.");
      setSubmitting(false);
    }
  };

  return (
    <Ctx.Provider value={value}>
      {children}

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-6 border-b border-slate-800">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 border border-emerald-500/25 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{title}</h3>
                  <p className="text-sm text-slate-300 mt-1">{message}</p>
                </div>
              </div>

              <button
                onClick={close}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-slate-800 text-slate-200 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {mode === "access" ? (
                <>
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-300">
                    Sign in to unlock:
                    <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-400">
                      <li>Full solicitation details</li>
                      <li>Saved opportunities & deadline tracking</li>
                      <li>Analytics dashboards and trends</li>
                      <li>Advanced filters & exports</li>
                    </ul>
                  </div>

                  <div className="mt-5 flex gap-3">
                    <button
                      onClick={() => setMode("login")}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 via-cyan-600 to-emerald-600 hover:from-emerald-700 hover:via-cyan-700 hover:to-emerald-700 transition-all shadow-xl shadow-emerald-500/25"
                    >
                      Sign in
                      <KeyRound className="h-4 w-4" />
                    </button>

                    <Link
                      href="/login"
                      className="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl font-bold text-sm bg-white/5 hover:bg-white/10 border border-slate-800 text-slate-100 transition-colors"
                      onClick={close}
                    >
                      Go to login page
                    </Link>
                  </div>

                  <button
                    onClick={close}
                    className="mt-3 w-full px-4 py-3 rounded-xl font-semibold text-sm bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-200 transition-colors"
                  >
                    Not now
                  </button>
                </>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300">Email</label>
                      <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5 focus-within:border-emerald-500/50 transition-colors">
                        <Mail className="h-4 w-4 text-slate-500" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@company.com"
                          disabled={submitting}
                          className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 outline-none text-sm disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300">Password</label>
                      <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2.5 focus-within:border-emerald-500/50 transition-colors">
                        <KeyRound className="h-4 w-4 text-slate-500" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          disabled={submitting}
                          className="w-full bg-transparent text-slate-100 placeholder:text-slate-500 outline-none text-sm disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-200">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-emerald-600 via-cyan-600 to-emerald-600 hover:from-emerald-700 hover:via-cyan-700 hover:to-emerald-700 transition-all shadow-xl shadow-emerald-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign in
                          <KeyRound className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setMode("access")}
                        disabled={submitting}
                        className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 border border-slate-800 text-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Back
                      </button>

                      <Link
                        href="/reset-request"
                        className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-white/5 hover:bg-white/10 border border-slate-800 text-slate-200 text-center transition-colors"
                        onClick={close}
                      >
                        Forgot password?
                      </Link>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
