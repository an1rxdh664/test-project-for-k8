"use client";

import { FormEvent, useState } from "react";

const initialForm = { fullName: "", email: "", phone: "", city: "", message: "" };

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState("");

  function update(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setFeedback("");

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Could not submit the form.");
      setForm(initialForm);
      setStatus("success");
      setFeedback("Thanks! Your details have been submitted successfully.");
    } catch (error) {
      setStatus("error");
      setFeedback(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  }

  const fieldClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/70 md:grid-cols-[0.85fr_1.15fr]">
        <aside className="relative flex flex-col justify-between overflow-hidden bg-slate-950 p-8 text-white md:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="relative">
            <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-indigo-200">
              <span className="h-2 w-2 rounded-full bg-indigo-400" /> QUICKFORM
            </div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-300">Let’s connect</p>
            <h1 className="max-w-sm text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              A little about you.
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
              Share a few details using the form. We’ll keep your submission organised and get back to you.
            </p>
          </div>
          <div className="relative mt-16 border-t border-white/10 pt-5 text-xs text-slate-400">
            Simple, secure, and straight to the point.
          </div>
        </aside>

        <div className="p-6 sm:p-10 md:p-12">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Your details</h2>
            <p className="mt-2 text-sm text-slate-500">Fill in the fields below to submit your response.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="text-sm font-medium text-slate-700">Full name *</label>
              <input id="fullName" name="fullName" autoComplete="name" required maxLength={100}
                value={form.fullName} onChange={(e) => update("fullName", e.target.value)}
                placeholder="e.g. Alex Johnson" className={fieldClass} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="email" className="text-sm font-medium text-slate-700">Email address *</label>
                <input id="email" name="email" type="email" autoComplete="email" required maxLength={254}
                  value={form.email} onChange={(e) => update("email", e.target.value)}
                  placeholder="alex@example.com" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="phone" className="text-sm font-medium text-slate-700">Phone number</label>
                <input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={25}
                  value={form.phone} onChange={(e) => update("phone", e.target.value)}
                  placeholder="+91 98765 43210" className={fieldClass} />
              </div>
            </div>
            <div>
              <label htmlFor="city" className="text-sm font-medium text-slate-700">City</label>
              <input id="city" name="city" autoComplete="address-level2" maxLength={100}
                value={form.city} onChange={(e) => update("city", e.target.value)}
                placeholder="Where are you based?" className={fieldClass} />
            </div>
            <div>
              <label htmlFor="message" className="text-sm font-medium text-slate-700">Message</label>
              <textarea id="message" name="message" rows={3} maxLength={2000}
                value={form.message} onChange={(e) => update("message", e.target.value)}
                placeholder="Anything you’d like us to know?" className={`${fieldClass} resize-y`} />
            </div>

            {feedback && (
              <p role="status" className={`rounded-xl px-4 py-3 text-sm ${status === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                {feedback}
              </p>
            )}

            <button type="submit" disabled={status === "loading"}
              className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-60">
              {status === "loading" ? "Submitting..." : "Submit details"}
              {status !== "loading" && <span className="ml-2" aria-hidden="true">→</span>}
            </button>
            <p className="text-center text-xs text-slate-400">Fields marked with * are required.</p>
          </form>
        </div>
      </section>
    </main>
  );
}
