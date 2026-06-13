"use client";
import { useState } from "react";
import { Star, Send, Check } from "lucide-react";

export default function FeedbackSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!name.trim() || !message.trim() || rating === 0) {
      setError("Please fill in your name, a rating, and a message.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, rating, message }),
      });
      if (res.ok) {
        setDone(true);
        setName(""); setEmail(""); setMessage(""); setRating(0);
      } else {
        const d = await res.json();
        setError(d.error || "Something went wrong.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 px-4 bg-[#141414] border-t border-[#2a2a2a]">
      <div className="max-w-xl mx-auto">
        <p className="text-xs text-[#ff0000] font-semibold uppercase tracking-widest text-center mb-2">Feedback</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#f1f1f1] text-center mb-2">Tell us what you think.</h2>
        <p className="text-[#717171] text-sm text-center mb-10">Your feedback helps us improve Clypso for everyone.</p>

        {done ? (
          <div className="bg-[#1a2a1a] border border-[#2a4a2a] rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 bg-[#2a4a2a] rounded-full flex items-center justify-center">
              <Check size={22} className="text-green-400" />
            </div>
            <p className="text-[#f1f1f1] font-semibold">Thanks for your feedback!</p>
            <p className="text-sm text-[#717171]">We read every submission and use it to make Clypso better.</p>
            <button
              onClick={() => setDone(false)}
              className="mt-2 text-xs text-[#555] hover:text-[#aaa] underline underline-offset-2 transition-colors"
            >
              Submit another
            </button>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 space-y-4">
            {/* Star rating */}
            <div>
              <label className="text-xs text-[#717171] mb-2 block">Your rating <span className="text-[#ff0000]">*</span></label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(star)}
                    className="p-0.5 transition-transform hover:scale-110"
                  >
                    <Star
                      size={26}
                      className="transition-colors"
                      fill={(hovered || rating) >= star ? "#ff0000" : "none"}
                      stroke={(hovered || rating) >= star ? "#ff0000" : "#3a3a3a"}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Name + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-[#717171] mb-1 block">Name <span className="text-[#ff0000]">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={100}
                  className="w-full bg-[#212121] border border-[#3a3a3a] rounded-xl px-4 py-2.5 text-sm text-[#f1f1f1] placeholder-[#555] focus:outline-none focus:border-[#555] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-[#717171] mb-1 block">Email <span className="text-[#555] font-normal">(optional)</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  maxLength={200}
                  className="w-full bg-[#212121] border border-[#3a3a3a] rounded-xl px-4 py-2.5 text-sm text-[#f1f1f1] placeholder-[#555] focus:outline-none focus:border-[#555] transition-colors"
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-xs text-[#717171] mb-1 block">Message <span className="text-[#ff0000]">*</span></label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What do you think of Clypso? Any features you'd like to see?"
                maxLength={2000}
                rows={4}
                className="w-full bg-[#212121] border border-[#3a3a3a] rounded-xl px-4 py-2.5 text-sm text-[#f1f1f1] placeholder-[#555] focus:outline-none focus:border-[#555] resize-none transition-colors"
              />
              <p className="text-xs text-[#3a3a3a] text-right mt-1">{message.length}/2000</p>
            </div>

            {error && (
              <p className="text-xs text-[#ff6b6b] bg-[#2a1a1a] border border-[#5a2020] rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              onClick={submit}
              disabled={loading || !name.trim() || !message.trim() || rating === 0}
              className="w-full bg-[#ff0000] hover:bg-[#cc0000] disabled:bg-[#2a2a2a] disabled:text-[#555] text-white font-medium px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={15} />
              )}
              {loading ? "Submitting…" : "Submit Feedback"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
