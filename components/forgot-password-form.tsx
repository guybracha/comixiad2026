"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col justify-center px-4 py-16">
      <Card>
        {sent ? (
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <MailCheck className="size-10 text-primary" />
            <p className="font-semibold">Check your email</p>
            <p className="text-sm text-muted-foreground">
              If an account exists for <span className="font-medium">{email}</span>,
              we sent a link to reset your password. The link is valid for a
              limited time.
            </p>
          </CardContent>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Forgot your password?</CardTitle>
              <CardDescription>
                Enter your email and we&apos;ll send you a reset link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? "Sending…" : "Send reset link"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Remembered it?{" "}
                  <Link href="/login" className="text-foreground underline">
                    Log in
                  </Link>
                </p>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
