"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

interface Budget {
  id: string;
  monthlyLimit: number;
  spent: number;
  category: { name: string; color: string; icon: string };
}

interface Category { id: string; name: string; icon: string; color: string }

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadData() {
    const [bRes, cRes] = await Promise.all([fetch("/api/budgets"), fetch("/api/categories")]);
    setBudgets(await bRes.json());
    setCategories(await cRes.json());
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);
    const now = new Date();
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: data.get("categoryId"),
        monthlyLimit: data.get("monthlyLimit"),
        month: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      }),
    });
    setShowForm(false);
    setLoading(false);
    loadData();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Budgets</h1>
          <p className="text-sm text-gray-500">Track spending against your limits this month</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          Set budget
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Budget</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[180px] space-y-1.5">
                <Label>Category</Label>
                <Select name="categoryId" required>
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="flex-1 min-w-[140px] space-y-1.5">
                <Label>Monthly limit ($)</Label>
                <Input name="monthlyLimit" type="number" step="0.01" min="1" placeholder="500" required />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {budgets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-400">
            <p className="text-3xl">🎯</p>
            <p className="mt-2">No budgets set yet. Add your first budget above!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {budgets.map((budget) => {
            const pct = Math.min((budget.spent / budget.monthlyLimit) * 100, 100);
            const color = pct >= 90 ? "#ef4444" : pct >= 70 ? "#f59e0b" : "#22c55e";
            return (
              <Card key={budget.id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{budget.category.icon}</span>
                      <span className="font-medium text-gray-900">{budget.category.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(budget.spent)}</p>
                      <p className="text-xs text-gray-400">of {formatCurrency(budget.monthlyLimit)}</p>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-gray-400">
                    {pct >= 100
                      ? `Over by ${formatCurrency(budget.spent - budget.monthlyLimit)}`
                      : `${formatCurrency(budget.monthlyLimit - budget.spent)} remaining`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
