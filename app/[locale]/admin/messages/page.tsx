"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

type Msg = {
  id: string;
  full_name: string;
  email: string;
  category: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
};

const ALLOWED = new Set([
  "skillupyouth.eg@gmail.com",
  "ahmedyasserellisi@gmail.com"
]);

export default function AdminMessagesPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Msg[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Msg | null>(null);

  const requireAllowedSession = useCallback(async () => {
    const { data } = await supabaseBrowser.auth.getSession();
    const email = data.session?.user?.email?.toLowerCase();
    if (!data.session || !email || !ALLOWED.has(email)) return null;
    return data.session;
  }, []);

  const load = useCallback(async () => {
    setErrorMsg("");
    setLoading(true);

    const session = await requireAllowedSession();
    if (!session) {
      setErrorMsg("Unauthorized. Please login with an allowed email.");
      setRows([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabaseBrowser
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      setErrorMsg(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as Msg[]);
    }

    setLoading(false);
  }, [requireAllowedSession]);

  useEffect(() => void load(), [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!s) return true;
      return (
        r.full_name.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s) ||
        (r.subject || "").toLowerCase().includes(s) ||
        r.message.toLowerCase().includes(s)
      );
    });
  }, [rows, q, status]);

  async function mark(id: string, newStatus: string) {
    setErrorMsg("");
    const session = await requireAllowedSession();
    if (!session) return setErrorMsg("Unauthorized.");

    const { error } = await supabaseBrowser
      .from("contact_messages")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) setErrorMsg(error.message);
    else await load();
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Messages</h1>
          <p className="text-sm opacity-75">Contact form inbox.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            placeholder="Search name/email/subject…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="sm:w-[280px]"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-zinc-950/40"
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
          </select>

          <Button variant="secondary" onClick={() => load()}>
            Refresh
          </Button>
        </div>
      </div>

      {errorMsg ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-600 dark:text-red-400">
          {errorMsg}
        </div>
      ) : null}

      <div className="rounded-2xl border border-black/10 dark:border-white/10">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>From</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[260px]">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>Loading...</TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>No messages.</TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="font-medium">{m.full_name}</div>
                    <div className="text-xs opacity-70">{m.email}</div>
                  </TableCell>
                  <TableCell className="opacity-85">{m.category}</TableCell>
                  <TableCell className="opacity-85">{m.status}</TableCell>
                  <TableCell className="text-xs opacity-75">
                    {new Date(m.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="flex flex-wrap gap-2">
                    <Dialog open={open && selected?.id === m.id} onOpenChange={setOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSelected(m);
                            setOpen(true);
                            if (m.status === "new") void mark(m.id, "read");
                          }}
                        >
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Message</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-3 text-sm">
                          <div className="rounded-2xl border border-black/10 p-3 dark:border-white/10">
                            <div className="font-semibold">{m.subject || "(No subject)"}</div>
                            <div className="text-xs opacity-70">
                              {m.full_name} — {m.email} — {m.category}
                            </div>
                          </div>
                          <div className="rounded-2xl border border-black/10 p-3 text-sm dark:border-white/10 whitespace-pre-wrap">
                            {m.message}
                          </div>
                          <a
                            className="underline text-sm"
                            href={`mailto:${m.email}?subject=Re:%20${encodeURIComponent(m.subject || "SkillUp")}`}
                          >
                            Reply by email
                          </a>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button variant="secondary" onClick={() => mark(m.id, "replied")}>
                      Mark replied
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}