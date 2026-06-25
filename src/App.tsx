import React, { useState, useCallback, useEffect, useRef } from 'react';
import { TierList } from './components/TierList';
import type { Tier } from './components/TierList';
import { GOWA_LOGO, GOWA_DEFAULT, KATA_LOGO, KATA_DEFAULT } from './components/tierData';

type TierState = { gowa: Tier[]; kata: Tier[] };
const FILENAME = 'tierlist.json';
const LS_KEY = 'popeys-gist-config';
const LS_UNLOCKED = 'popeys-tierlist-unlocked';
const PASSWORD_HASH = 'c558430e08e51699d45c06e879ad79f393ef665ba1e6e154463a7564ca201d00';

async function verifyPassword(input: string): Promise<boolean> {
  const buf = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  const hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hash === PASSWORD_HASH;
}

function loadConfig(): { token: string; gistId: string } | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveConfig(token: string, gistId: string) {
  localStorage.setItem(LS_KEY, JSON.stringify({ token, gistId }));
}

async function loadFromGist(token: string, gistId: string): Promise<TierState | null> {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const gist = await res.json();
  const file = gist.files?.[FILENAME];
  if (!file?.content) return null;
  return JSON.parse(file.content);
}

async function saveToGist(token: string, gistId: string, state: TierState) {
  await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: { [FILENAME]: { content: JSON.stringify(state, null, 2) } },
    }),
  });
}

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await verifyPassword(password);
    if (ok) {
      localStorage.setItem(LS_UNLOCKED, '1');
      onUnlock();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-xl bg-[#1a1a18] p-6 text-white">
        <h2 className="text-center text-xl font-bold" style={{ fontFamily: 'Manjari, sans-serif' }}>
          Enter password to edit
        </h2>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          placeholder="Password"
          autoFocus
          className="rounded-lg bg-[#2E2E2A] px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#8EBB57]"
        />
        {error && <p className="text-sm text-red-400">Wrong password</p>}
        <button
          type="submit"
          className="rounded-lg bg-[#8EBB57] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#a0d468]"
        >
          Unlock
        </button>
      </form>
    </div>
  );
}

function Config({ onSaved }: { onSaved: (token: string, gistId: string) => void }) {
  const [token, setToken] = useState('');
  const [gistId, setGistId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`https://api.github.com/gists/${gistId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError('Invalid token or gist ID. Check both and try again.');
        setLoading(false);
        return;
      }
      saveConfig(token, gistId);
      onSaved(token, gistId);
    } catch {
      setError('Network error — try again.');
      setLoading(false);
    }
  };

  const handleCreateGist = async () => {
    if (!token) { setError('Enter your token first.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: 'Popeys Sauce Tierlist',
          public: false,
          files: {
            [FILENAME]: {
              content: JSON.stringify({ gowa: GOWA_DEFAULT, kata: KATA_DEFAULT }, null, 2),
            },
          },
        }),
      });
      if (!res.ok) { setError('Failed to create gist. Check your token.'); setLoading(false); return; }
      const gist = await res.json();
      setGistId(gist.id);
      saveConfig(token, gist.id);
      onSaved(token, gist.id);
    } catch {
      setError('Network error — try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black p-4">
      <div className="flex max-w-md flex-col gap-4 rounded-xl bg-[#1a1a18] p-6 text-white">
        <h2 className="text-center text-2xl font-bold" style={{ fontFamily: 'Manjari, sans-serif' }}>
          Popeys Sauce Tierlist
        </h2>
        <p className="text-sm text-gray-400">
          Connect a GitHub Gist to sync your tierlist across devices.
        </p>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">GitHub Personal Access Token</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            className="rounded-lg bg-[#2E2E2A] px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#8EBB57]"
          />
          <p className="text-xs text-gray-500">
            Create one at{' '}
            <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="underline">
              github.com/settings/tokens
            </a>{' '}
            with <strong>gist</strong> scope.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-gray-500">Gist ID (optional)</label>
          <input
            type="text"
            value={gistId}
            onChange={(e) => setGistId(e.target.value)}
            placeholder="Paste gist ID or leave blank to create one"
            className="rounded-lg bg-[#2E2E2A] px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-[#8EBB57]"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading || !token || !gistId}
            className="flex-1 rounded-lg bg-[#8EBB57] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#a0d468] disabled:opacity-40"
          >
            Connect
          </button>
          <button
            onClick={handleCreateGist}
            disabled={loading || !token}
            className="flex-1 rounded-lg bg-[#2E2E2A] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#3a3a36] disabled:opacity-40"
          >
            Create New Gist
          </button>
        </div>
      </div>
    </div>
  );
}

export function App() {
  const config = loadConfig();
  const [connected, setConnected] = useState(!!config);
  const [unlocked, setUnlocked] = useState(() => {
    try { return localStorage.getItem(LS_UNLOCKED) === '1'; } catch { return false; }
  });
  const [gowa, setGowa] = useState<Tier[]>(GOWA_DEFAULT);
  const [kata, setKata] = useState<Tier[]>(KATA_DEFAULT);
  const loaded = useRef(false);

  useEffect(() => {
    if (!config) return;
    loadFromGist(config.token, config.gistId).then((data) => {
      if (data?.gowa && data?.kata) {
        setGowa(data.gowa);
        setKata(data.kata);
      }
      loaded.current = true;
    }).catch(() => { loaded.current = true; });
  }, [connected]); // eslint-disable-line react-hooks/exhaustive-deps

  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!connected || !config || !loaded.current) return;
    const state: TierState = { gowa, kata };
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveToGist(config.token, config.gistId, state).catch(() => { /* ignore */ });
    }, 800);
  }, [gowa, kata, connected]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragEnd = useCallback(
    (setter: React.Dispatch<React.SetStateAction<Tier[]>>) =>
    (oldTierIdx: number, newTierIdx: number, oldIndex: number, newIndex: number) => {
      setter((prev) => {
        const next = prev.map((t) => ({ ...t, items: [...t.items] }));
        const [moved] = next[oldTierIdx].items.splice(oldIndex, 1);
        next[newTierIdx].items.splice(newIndex, 0, moved);
        return next;
      });
    },
    []
  );

  if (!connected) {
    return <Config onSaved={() => setConnected(true)} />;
  }

  return (
    <div className="min-h-screen w-full bg-black">
      {!unlocked && <PasswordGate onUnlock={() => setUnlocked(true)} />}
      <div className="flex w-full flex-col items-center justify-center gap-1 lg:flex-row lg:items-start">
        <TierList
          logo={GOWA_LOGO}
          logoAlt="GoWa logo"
          tiers={gowa}
          enabled={unlocked}
          onDragEnd={handleDragEnd(setGowa)}
        />
        <TierList
          logo={KATA_LOGO}
          logoAlt="KATA logo"
          tiers={kata}
          enabled={unlocked}
          onDragEnd={handleDragEnd(setKata)}
        />
      </div>
    </div>
  );
}
