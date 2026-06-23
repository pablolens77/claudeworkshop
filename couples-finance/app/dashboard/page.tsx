"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Wallet, Sparkles, Copy, Check, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { CashFlowBarChart } from "@/components/charts/CashFlowBarChart";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DashboardData {
  totalBalance: number;
  moneyIn: number;
  moneyOut: number;
  netSavings: number;
  recentTransactions: Transaction[];
  categoryBreakdown: { name: string; color: string; amount: number }[];
  sixMonthData: { month: string; in: number; out: number }[];
  accounts: { id: string; name: string; balance: number; type: string }[];
  couple: { name: string; users: { name: string; email: string }[] } | null;
  noCouple?: boolean;
}

interface Transaction {
  id: string;
  amount: number;
  direction: "IN" | "OUT";
  description?: string;
  date: string;
  category: { name: string; color: string; icon: string };
  user: { name: string };
  account: { name: string };
}

function SummaryCard({ title, value, icon: Icon, color, subtitle }: {
  title: string; value: string; icon: React.ElementType; color: string; subtitle?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
          </div>
          <div className={`rounded-xl p-2.5 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard").then((r) => r.json()).then(setData);
  }, []);

  async function generateInvite() {
    const res = await fetch("/api/invite", { method: "POST" });
    const { code } = await res.json();
    setInviteCode(code);
    setShowInvite(true);
  }

  function copyInvite() {
    const url = `${window.location.origin}/invite?code=${inviteCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
      </div>
    );
  }

  const partnerCount = data.couple?.users?.length ?? 1;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {data.couple?.name ?? "Your Dashboard"}
          </h1>
          <p className="text-sm text-gray-500">
            {partnerCount === 1
              ? "Invite your partner to start tracking together"
              : data.couple?.users.map((u) => u.name).join(" & ")}
          </p>
        </div>
        {partnerCount === 1 && (
          <Button onClick={generateInvite} size="sm">
            <Plus className="h-4 w-4" />
            Invite partner
          </Button>
        )}
      </div>

      {showInvite && (
        <Card className="border-rose-100 bg-rose-50">
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-medium text-rose-700">Share this link with your partner:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-lg bg-white px-3 py-2 text-xs text-gray-700 border border-rose-200">
                {`${typeof window !== "undefined" ? window.location.origin : ""}/invite?code=${inviteCode}`}
              </code>
              <Button variant="outline" size="sm" onClick={copyInvite}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          title="Total Balance"
          value={formatCurrency(data.totalBalance)}
          icon={Wallet}
          color="bg-blue-50 text-blue-600"
          subtitle="Across all accounts"
        />
        <SummaryCard
          title="Money In"
          value={formatCurrency(data.moneyIn)}
          icon={TrendingUp}
          color="bg-green-50 text-green-600"
          subtitle="This month"
        />
        <SummaryCard
          title="Money Out"
          value={formatCurrency(data.moneyOut)}
          icon={TrendingDown}
          color="bg-rose-50 text-rose-600"
          subtitle="This month"
        />
        <SummaryCard
          title="Net Savings"
          value={formatCurrency(data.netSavings)}
          icon={Sparkles}
          color={data.netSavings >= 0 ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500"}
          subtitle="This month"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={data.categoryBreakdown} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <CashFlowBarChart data={data.sixMonthData} />
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle>Recent Transactions</CardTitle>
          <a href="/transactions" className="text-xs text-rose-500 hover:underline">View all</a>
        </CardHeader>
        <CardContent className="p-0">
          {data.recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-2xl">💸</p>
              <p className="mt-2 text-sm">No transactions yet. Add your first one!</p>
              <a href="/transactions" className="mt-3 inline-block text-sm font-medium text-rose-500 hover:underline">
                Add transaction
              </a>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {data.recentTransactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-base"
                      style={{ backgroundColor: tx.category.color + "22" }}
                    >
                      {tx.category.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {tx.description || tx.category.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDate(tx.date)} · {tx.account.name} · {tx.user.name}
                      </p>
                    </div>
                  </div>
                  <div className={`text-sm font-semibold ${tx.direction === "IN" ? "text-green-600" : "text-gray-900"}`}>
                    {tx.direction === "IN" ? "+" : "-"}{formatCurrency(tx.amount)}
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
