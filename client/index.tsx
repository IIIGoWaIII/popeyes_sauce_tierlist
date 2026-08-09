import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { useMutation, useQuery } from "lakebed/client";
import { TierList } from "./TierList";
import { GOWA_LOGO, KATA_LOGO } from "./logos";
import { SEED_STATE, type Tier } from "../shared/tierlist";

const PASSWORD_HASH = "c558430e08e51699d45c06e879ad79f393ef665ba1e6e154463a7564ca201d00";
const PASSWORD_STORAGE_KEY = "popeyes_tierlist_password";

async function verifyPassword(input: string): Promise<boolean> {
  const buf = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  const hash = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hash === PASSWORD_HASH;
}

function readStoredPassword(): string | null {
  try {
    return localStorage.getItem(PASSWORD_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storePassword(password: string) {
  try {
    localStorage.setItem(PASSWORD_STORAGE_KEY, password);
  } catch {
    // storage unavailable; stay unlocked for this session only
  }
}

function clearStoredPassword() {
  try {
    localStorage.removeItem(PASSWORD_STORAGE_KEY);
  } catch {
    // best effort
  }
}

function PasswordGate({ onUnlock, onClose }: { onUnlock: (password: string) => void; onClose: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const ok = await verifyPassword(password);
    if (ok) {
      onUnlock(password);
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="relative flex flex-col gap-4 rounded-xl bg-[#1a1a18] p-6 pr-10 text-white"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition hover:bg-[#2E2E2A] hover:text-white"
        >
          ✕
        </button>
        <h2 className="text-center text-xl font-bold" style={{ fontFamily: "Manjari, sans-serif" }}>
          Enter password to edit
        </h2>
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword((e.target as HTMLInputElement).value);
            setError(false);
          }}
          placeholder="Password"
          autofocus
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

type SavedState = { gowa: Tier[]; kata: Tier[] };

export function App() {
  const [unlocked, setUnlocked] = useState(() => readStoredPassword() !== null);
  const [showGate, setShowGate] = useState(false);
  const passwordRef = useRef<string | null>(readStoredPassword());

  const data = useQuery<SavedState | null>("get");
  const saveMutation = useMutation<[password: string, gowa: Tier[], kata: Tier[]], void>("save");

  const [gowa, setGowa] = useState<Tier[]>(SEED_STATE.gowa as Tier[]);
  const [kata, setKata] = useState<Tier[]>(SEED_STATE.kata as Tier[]);
  const [loaded, setLoaded] = useState(false);
  const loadedRef = useRef(false);
  const savedRef = useRef<string | null>(null);
  const dirtyRef = useRef(false);

  useEffect(() => {
    if (data === undefined || Array.isArray(data)) return;
    const incoming = data ? JSON.stringify({ gowa: data.gowa, kata: data.kata }) : null;
    if (!loadedRef.current) {
      if (data) {
        setGowa(data.gowa);
        setKata(data.kata);
        savedRef.current = incoming;
      }
      loadedRef.current = true;
      dirtyRef.current = false;
      setLoaded(true);
      return;
    }
    if (!data) return;
    if (incoming === savedRef.current) return;
    if (dirtyRef.current) return;
    setGowa(data.gowa);
    setKata(data.kata);
    savedRef.current = incoming;
  }, [data]);

  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    if (!loaded) return;
    if (!dirtyRef.current) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const password = passwordRef.current;
      if (password === null) return;
      const payload = JSON.stringify({ gowa, kata });
      saveMutation(password, gowa, kata)
        .then(() => {
          savedRef.current = payload;
          dirtyRef.current = false;
        })
        .catch(() => {});
    }, 500);
  }, [gowa, kata]);

  const handleDragEnd = useCallback(
    (setter: (updater: (prev: Tier[]) => Tier[]) => void) =>
    (oldTierIdx: number, newTierIdx: number, oldIndex: number, newIndex: number) => {
      dirtyRef.current = true;
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

  if (!loaded) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-black">
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Manufacturing+Consent&family=Manjari:wght@100;400;700&display=swap');`}</style>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-black">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Manufacturing+Consent&family=Manjari:wght@100;400;700&display=swap');`}</style>
      {showGate && !unlocked && (
        <PasswordGate
          onUnlock={(password) => {
            passwordRef.current = password;
            storePassword(password);
            setUnlocked(true);
            setShowGate(false);
          }}
          onClose={() => setShowGate(false)}
        />
      )}
      <div className="relative flex w-full flex-col items-center justify-center gap-1 px-2.5 py-6 lg:flex-row lg:items-start">
        {unlocked && (
          <button
            onClick={() => {
              passwordRef.current = null;
              clearStoredPassword();
              setUnlocked(false);
              setShowGate(false);
            }}
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
