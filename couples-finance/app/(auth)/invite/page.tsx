"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code") ?? "";
  const [inviteInfo, setInviteInfo] = useState<{ coupleName: string; members: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) return;
    fetch(`/api/invite?code=${code}`)
      .then((r) => r.json())
      .then((d) => !d.error && setInviteInfo(d));
  }, [code]);

  async function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);

    const regRes = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        password: data.get("password"),
      }),
    });

    if (!regRes.ok) {
      const { error } = await regRes.json();
      // User may already exist, try to sign in instead
      if (error !== "Email already in use") {
        setError(error);
        setLoading(false);
        return;
      }
    }

    const signInRes = await signIn("credentials", {
      email: data.get("email"),
      password: data.get("password"),
      redirect: false,
    });

    if (signInRes?.error) {
      setError("Sign-in failed");
      setLoading(false);
      return;
    }

    const acceptRes = await fetch("/api/invite/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    if (!acceptRes.ok) {
      const { error } = await acceptRes.json();
      setError(error);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500">
            <Heart className="h-7 w-7 text-white" fill="white" />
          </div>
          {inviteInfo ? (
            <>
              <h1 className="text-2xl font-bold text-gray-900">You&apos;re invited!</h1>
              <p className="mt-1 text-sm text-gray-500">
                Join <strong>{inviteInfo.coupleName}</strong> ({inviteInfo.members.join(" & ")})
              </p>
            </>
          ) : (
            <h1 className="text-2xl font-bold text-gray-900">Join your partner</h1>
          )}
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Your name</Label>
              <Input name="name" placeholder="Jamie" required />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input name="password" type="password" placeholder="At least 8 characters" minLength={8} required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Joining…" : "Join household"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense>
      <InviteContent />
    </Suspense>
  );
}
