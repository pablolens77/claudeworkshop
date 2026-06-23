"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Transaction {
  id: string;
  amount: number;
  direction: "IN" | "OUT";
  description?: string;
  date: string;
  category: { id: string; name: string; color: string; icon: string };
  user: { name: string };
  account: { name: string };
}

interface Category { id: string; name: string; icon: string; color: string }
interface Account { id: string; name: string; type: string }

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    const [txRes, catRes, accRes] = await Promise.all([
      fetch("/api/transactions"),
      fetch("/api/categories"),
      fetch("/api/accounts"),
    ]);
    setTransactions(await txRes.json());
    setCategories(await catRes.json());
    setAccounts(await accRes.json());
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);

    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: data.get("accountId"),
        amount: data.get("amount"),
        direction: data.get("direction"),
        categoryId: data.get("categoryId"),
        description: data.get("description"),
        date: data.get("date"),
      }),
    });

    setShowForm(false);
    setLoading(false);
    loadData();
  }

  async function deleteTransaction(id: string) {
    if (!confirm("Remove this transaction?")) return;
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Add transaction
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>New Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Account</Label>
                <Select name="accountId" required>
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Direction</Label>
                <Select name="direction" required>
                  <option value="OUT">Money Out</option>
                  <option value="IN">Money In</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" required />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select name="categoryId" required>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Date</Label>
                <Input name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required />
              </div>
              <div className="space-y-1.5">
                <Label>Description (optional)</Label>
                <Input name="description" placeholder="What was this for?" />
              </div>
              {accounts.length === 0 && (
                <div className="col-span-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                  You need to <a href="/onboarding" className="font-medium underline">add an account</a> first.
                </div>
              )}
              <div className="col-span-2 flex gap-2">
                <Button type="submit" disabled={loading || accounts.length === 0}>
                  {loading ? "Saving…" : "Save transaction"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-3xl">📋</p>
              <p className="mt-2">No transactions yet. Add your first one above!</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-lg"
                      style={{ backgroundColor: tx.category.color + "22" }}
                    >
                      {tx.category.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tx.description || tx.category.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(tx.date)} · {tx.category.name} · {tx.account.name} · {tx.user.name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${tx.direction === "IN" ? "text-green-600" : "text-gray-900"}`}>
                      {tx.direction === "IN" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </span>
                    <button onClick={() => deleteTransaction(tx.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
