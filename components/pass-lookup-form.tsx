"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";

export function PassLookupForm() {
  const [token, setToken] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = token.trim();
    if (clean) {
      router.push(`/p/${encodeURIComponent(clean)}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="Enter Pass Token (e.g. ek_8f3a92b...)"
          className="w-full pl-11 pr-4 py-3 bg-zinc-950/80 border border-zinc-700/80 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
        />
      </div>
      <button
        type="submit"
        disabled={!token.trim()}
        className="px-5 py-3 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-all flex items-center gap-1.5 cursor-pointer"
      >
        View Pass <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
