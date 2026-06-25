import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { TierList } from './components/TierList';
import type { Tier } from './components/TierList';
import { GOWA_LOGO, GOWA_DEFAULT, KATA_LOGO, KATA_DEFAULT } from './components/tierData';

const PASSWORD_HASH = 'c558430e08e51699d45c06e879ad79f393ef665ba1e6e154463a7564ca201d00';

async function verifyPassword(input: string): Promise<boolean> {
  const buf = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  const hash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hash === PASSWORD_HASH;
}

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await verifyPassword(password);
    if (ok) {
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

export function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [showGate, setShowGate] = useState(false);

  const data = useQuery(api.tierlist.get);
  const saveMutation = useMutation(api.tierlist.save);

  const [gowa, setGowa] = useState<Tier[]>(GOWA_DEFAULT);
  const [kata, setKata] = useState<Tier[]>(KATA_DEFAULT);
  const loaded = useState(false);

  useEffect(() => {
    if (data !== undefined) {
      if (data) {
        setGowa(data.gowa);
        setKata(data.kata);
      }
      loaded[1](true);
    }
  }, [data]);

  const timerRef = React.useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!loaded[0]) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      saveMutation({ gowa, kata }).catch(() => { /* ignore */ });
    }, 500);
  }, [gowa, kata]);

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

  const handleAttemptEdit = () => {
    if (!unlocked) setShowGate(true);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black">
      {showGate && !unlocked && (
        <PasswordGate onUnlock={() => { setUnlocked(true); setShowGate(false); }} />
      )}
      <div className="relative flex w-full flex-col items-center justify-center gap-1 px-2.5 py-6 lg:flex-row lg:items-start">
        {unlocked && (
          <button
            onClick={() => { setUnlocked(false); setShowGate(false); }}
            className="fixed right-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-[#2E2E2A] text-xl text-white transition hover:bg-[#BB5757]"
            title="Lock tierlist"
          >
            ✕
          </button>
        )}
        <TierList
          logo={GOWA_LOGO}
          logoAlt="GoWa logo"
          tiers={gowa}
          enabled={unlocked}
          onDragEnd={handleDragEnd(setGowa)}
          onAttemptEdit={handleAttemptEdit}
        />
        <TierList
          logo={KATA_LOGO}
          logoAlt="KATA logo"
          tiers={kata}
          enabled={unlocked}
          onDragEnd={handleDragEnd(setKata)}
          onAttemptEdit={handleAttemptEdit}
        />
      </div>
    </div>
  );
}
