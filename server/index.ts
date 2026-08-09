import { capsule, mutation, query, string, table } from "lakebed/server";
import type { Tier } from "../shared/tierlist";

const STATE_KEY = "main";
const PASSWORD_HASH = "c558430e08e51699d45c06e879ad79f393ef665ba1e6e154463a7564ca201d00";

async function verifyPassword(input: string): Promise<boolean> {
  const buf = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  const hash = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hash === PASSWORD_HASH;
}

export default capsule({
  name: "popeyes-sauce-tierlist",

  schema: {
    tierlist: table({
      key: string(),
      gowa: string(),
      kata: string()
    }).index("by_key", ["key"])
  },

  queries: {
    get: query(async (ctx) => {
      const row = await ctx.db.tierlist
        .withIndex("by_key", (q) => q.eq("key", STATE_KEY))
        .first();
      if (!row) return null;
      return {
        gowa: JSON.parse(row.gowa) as Tier[],
        kata: JSON.parse(row.kata) as Tier[]
      };
    })
  },

  mutations: {
    save: mutation(async (ctx, password: string, gowa: Tier[], kata: Tier[]) => {
      if (!(await verifyPassword(password))) {
        throw new Error("Unauthorized: wrong password");
      }
      const payload = {
        gowa: JSON.stringify(gowa),
        kata: JSON.stringify(kata)
      };
      const existing = await ctx.db.tierlist
        .withIndex("by_key", (q) => q.eq("key", STATE_KEY))
        .first();
      if (existing) {
        await ctx.db.tierlist.update(existing.id, payload);
      } else {
        await ctx.db.tierlist.insert({ key: STATE_KEY, ...payload });
      }
    })
  }
});
