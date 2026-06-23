"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  createdAt: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadGoals() {
    const res = await fetch("/api/goals");
    setGoals(await res.json());
  }

  useEffect(() => { loadGoals(); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const data = new FormData(e.currentTarget);
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.get("title"),
        targetAmount: data.get("targetAmount"),
        currentAmount: data.get("currentAmount") || "0",
        targetDate: data.get("targetDate") || null,
      }),
    });
    setShowForm(false);
    setLoading(false);
    loadGoals();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Savings Goals</h1>
          <p className="text-sm text-gray-500">Work toward shared financial milestones together</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4" />
          New goal
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Goal</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Goal name</Label>
                <Input name="title" placeholder="e.g. Vacation Fund, Emergency Fund, New Car" required />
              </div>
              <div className="space-y-1.5">
                <Label>Target amount ($)</Label>
                <Input name="targetAmount" type="number" step="0.01" min="1" placeholder="5000" required />
              </div>
              <div className="space-y-1.5">
                <Label>Current savings ($)</Label>
                <Input name="currentAmount" type="number" step="0.01" min="0" placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Target date (optional)</Label>
                <Input name="targetDate" type="date" />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Create goal"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {goals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-400">
            <p className="text-3xl">🌟</p>
            <p className="mt-2">No goals yet. What are you saving for?</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
            return (
              <Card key={goal.id}>
                <CardContent className="p-5">
                  <div className="mb-4">
                    <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                    {goal.targetDate && (
                      <p className="text-xs text-gray-400 mt-0.5">By {formatDate(goal.targetDate)}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-center my-4">
                    <div className="relative h-28 w-28">
                      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                        <circle
                          cx="50" cy="50" r="40" fill="none" stroke="#f43f5e" strokeWidth="10"
                          strokeDasharray={`${pct * 2.51} 251`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-lg font-bold text-gray-900">{Math.round(pct)}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Saved</span>
                    <span className="font-medium">{formatCurrency(goal.currentAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Target</span>
                    <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Remaining</span>
                    <span className="font-medium text-rose-500">
                      {formatCurrency(Math.max(0, goal.targetAmount - goal.currentAmount))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
