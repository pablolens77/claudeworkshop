"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

interface Account { id: string; name: string; type: string; balance: number }

export default function OnboardingPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadAccounts() {
    const res = await fetch("/api/accounts");
    setAccounts(await res.json());
  }

  useEffect(() => { loadAccounts(); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        type: data.get("type"),
        balance: data.get("balance"),
      }),
    });
    setLoading(false);
    (e.target as HTMLFormElement).reset();
    loadAccounts();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Set up your accounts</h1>
        <p className="mt-1 text-sm text-gray-500">Add your joint accounts to start tracking your finances together.</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Add Account</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Account name</Label>
              <Input name="name" placeholder="e.g. Joint Checking, Shared Savings" required />
            </div>
            <div className="space-y-1.5">
              <Label>Account type</Label>
              <Select name="type" required>
                <option value="CHECKING">Checking</option>
                <option value="SAVINGS">Savings</option>
                <option value="CREDIT">Credit</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Current balance ($)</Label>
              <Input name="balance" type="number" step="0.01" placeholder="0.00" defaultValue="0" />
            </div>
            <Button type="submit" disabled={loading}>{loading ? "Adding…" : "Add account"}</Button>
          </form>
        </CardContent>
      </Card>

      {accounts.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Your accounts</CardTitle></CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-gray-50">
              {accounts.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.name}</p>
                      <p className="text-xs text-gray-400">{a.type}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold">{formatCurrency(a.balance)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {accounts.length > 0 && (
        <Button className="w-full" onClick={() => router.push("/dashboard")}>
          Go to Dashboard →
        </Button>
      )}
    </div>
  );
}
