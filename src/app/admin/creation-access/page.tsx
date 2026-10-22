"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CREATION_CATEGORIES, CREATION_CATEGORY_LABELS, CREATION_PRODUCTS, CREATION_PRODUCT_LABELS, type CreationAccess, type CreationCategory, type CreationProduct } from "@/lib/creation-access";
export default function CreationAccessAdmin() {
  const [email, setEmail] = useState("");
  const [account, setAccount] = useState<{ email: string; access: CreationAccess } | null>(null);
  const [requests, setRequests] = useState<Array<{ id: string; email: string; capability: string; kind: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async (query = "") => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/admin/creation-access${query ? `?email=${encodeURIComponent(query)}` : ""}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load creation access.");
      setRequests(payload.requests || []); setAccount(payload.account);
      if (query && !payload.account) setMessage("Account not found.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load creation access."); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const mutate = async (method: string, body: object) => {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/creation-access", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Could not save access.");
      await load(account?.email || ""); setMessage("Access updated.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save access."); }
    finally { setBusy(false); }
  };
  return <main className="mx-auto max-w-5xl space-y-6"><Link href="/admin/users" className="inline-flex min-h-11 items-center text-sm font-semibold text-violet-700">Back to users</Link><header><h1 className="text-3xl font-semibold">Creation access</h1><p className="mt-2 text-sm text-slate-600">Standard accounts can enable released categories and tools. Restricted accounts use the explicit grants below. Saved event and co-host permissions stay separate.</p></header>
    <form onSubmit={(event) => { event.preventDefault(); void load(email.trim()); }} className="flex flex-wrap gap-3"><label className="flex-1 text-sm font-semibold">Account email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 block min-h-11 w-full rounded-lg border bg-white px-3" /></label><button disabled={busy} className="mt-6 min-h-11 rounded-lg bg-violet-700 px-5 font-semibold text-white disabled:opacity-50">Find account</button></form>
    {account ? <section className="space-y-4 rounded-xl border bg-white p-5"><h2 className="font-semibold">{account.email}</h2><label className="block text-sm">Account policy<select value={account.access.policy} onChange={(event) => setAccount({ ...account, access: { ...account.access, policy: event.target.value as CreationAccess["policy"] } })} className="ml-3 min-h-11 rounded-lg border px-3"><option value="standard">Standard</option><option value="restricted">Restricted</option></select></label>
      <fieldset disabled={busy || account.access.policy === "standard"} className="grid gap-2 sm:grid-cols-2"><legend className="mb-2 font-semibold">Allowed categories</legend>{CREATION_CATEGORIES.map((key) => <label key={key} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={account.access.allowedCategories.includes(key)} onChange={(event) => setAccount({ ...account, access: { ...account.access, allowedCategories: event.target.checked ? [...account.access.allowedCategories, key] : account.access.allowedCategories.filter((item) => item !== key) } })} />{CREATION_CATEGORY_LABELS[key]}</label>)}</fieldset>
      <fieldset disabled={busy || account.access.policy === "standard"} className="flex flex-wrap gap-4"><legend className="mb-2 font-semibold">Allowed tools</legend>{CREATION_PRODUCTS.map((key) => <label key={key} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={account.access.allowedProducts.includes(key)} onChange={(event) => setAccount({ ...account, access: { ...account.access, allowedProducts: event.target.checked ? [...account.access.allowedProducts, key] : account.access.allowedProducts.filter((item) => item !== key) } })} />{CREATION_PRODUCT_LABELS[key]}</label>)}</fieldset>
      <button type="button" disabled={busy} onClick={() => void mutate("PATCH", { email: account.email, policy: account.access.policy, categories: account.access.allowedCategories, products: account.access.allowedProducts })} className="min-h-11 rounded-lg bg-violet-700 px-5 font-semibold text-white disabled:opacity-50">Save account access</button></section> : null}
    <section className="space-y-3"><h2 className="text-xl font-semibold">Pending requests</h2>{requests.length ? requests.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4"><div><p className="font-semibold">{request.email}</p><p className="text-sm text-slate-600">{request.kind === "category" ? CREATION_CATEGORY_LABELS[request.capability as CreationCategory] : CREATION_PRODUCT_LABELS[request.capability as CreationProduct]}</p></div><div className="flex gap-2"><button disabled={busy} onClick={() => void mutate("POST", { requestId: request.id, decision: "approved" })} className="min-h-11 rounded-lg bg-violet-700 px-4 text-sm font-semibold text-white disabled:opacity-50">Approve</button><button disabled={busy} onClick={() => void mutate("POST", { requestId: request.id, decision: "declined" })} className="min-h-11 rounded-lg border px-4 text-sm font-semibold disabled:opacity-50">Decline</button></div></div>) : <p className="text-sm text-slate-600">No pending requests.</p>}</section>
    {message ? <p role="status" className="text-sm text-violet-800 dark:text-primary">{message}</p> : null}
  </main>;
}
