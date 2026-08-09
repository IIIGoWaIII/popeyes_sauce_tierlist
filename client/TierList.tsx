import { useRef, useState } from "preact/hooks";
import type { Item, Tier } from "../shared/tierlist";

type DropTarget = { tierIndex: number; index: number } | null;

function SortableItemCard({
  item,
  enabled,
  onAttemptEdit,
  onDragStart,
  onDragEnd
}: {
  item: Item;
  enabled: boolean;
  onAttemptEdit?: () => void;
  onDragStart?: (item: Item) => void;
  onDragEnd?: () => void;
}) {
  return (
    <div
      data-item-id={item.id}
      draggable={enabled}
      onDragStart={
        enabled
          ? (e: DragEvent) => {
              e.dataTransfer?.setData("text/plain", item.id);
              e.dataTransfer!.effectAllowed = "move";
              onDragStart?.(item);
            }
          : undefined
      }
      onDragEnd={enabled ? () => onDragEnd?.() : undefined}
      {...(enabled ? {} : { onClick: onAttemptEdit })}
      className={`flex flex-col items-center gap-1.5 rounded-[11px] bg-[#2E2E2A] p-1 pb-2 select-none ${
        enabled ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
      }`}
    >
      <img
        src={item.image}
        alt={item.name}
        className="h-16 w-16 rounded-md object-cover"
        draggable={false}
      />
      <span
        className="text-center text-[17px] leading-tight text-white"
        style={{ fontFamily: "Manjari, sans-serif" }}
      >
        {item.name}
      </span>
    </div>
  );
}

export function TierList({
  logo,
  logoAlt,
  tiers,
  onDragEnd,
  enabled = true,
  onAttemptEdit
}: {
  logo: string;
  logoAlt: string;
  tiers: Tier[];
  enabled?: boolean;
  onAttemptEdit?: () => void;
  onDragEnd: (oldTierIndex: number, newTierIndex: number, oldIndex: number, newIndex: number) => void;
}) {
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const findTierIndex = (itemId: string) =>
    tiers.findIndex((t) => t.items.some((i) => i.id === itemId));

  const computeDropIndex = (tierIndex: number, clientX: number): number => {
    const rowEl = rowRefs.current[tierIndex];
    const tier = tiers[tierIndex];
    if (!tier) return 0;
    const nodes = rowEl
      ? Array.from(rowEl.querySelectorAll<HTMLElement>("[data-item-id]"))
      : [];
    let index = tier.items.length;
    for (let i = 0; i < nodes.length; i++) {
      const rect = nodes[i].getBoundingClientRect();
      if (clientX < rect.left + rect.width / 2) {
        index = i;
        break;
      }
      index = i + 1;
    }
    return index;
  };

  const handleDragOver = (e: DragEvent, tierIndex: number) => {
    e.preventDefault();
    if (!dragItemId) return;
    const index = computeDropIndex(tierIndex, e.clientX);
    setDropTarget((prev) =>
      prev && prev.tierIndex === tierIndex && prev.index === index ? prev : { tierIndex, index }
    );
  };

  const handleDrop = (e: DragEvent, tierIndex: number) => {
    e.preventDefault();
    if (!dragItemId) {
      setDropTarget(null);
      return;
    }
    const oldTierIdx = findTierIndex(dragItemId);
    const oldIndex = tiers[oldTierIdx]?.items.findIndex((i) => i.id === dragItemId) ?? -1;
    if (oldTierIdx === -1 || oldIndex === -1) {
      setDragItemId(null);
      setDropTarget(null);
      return;
    }
    const j = computeDropIndex(tierIndex, e.clientX);
    let newIndex = j;
    if (oldTierIdx === tierIndex && j > oldIndex) {
      newIndex = j - 1;
    }
    onDragEnd(oldTierIdx, tierIndex, oldIndex, newIndex);
    setDragItemId(null);
    setDropTarget(null);
  };

  const handleDragStart = (item: Item) => {
    setDragItemId(item.id);
  };

  return (
    <div className="flex w-full max-w-[629px] flex-col gap-0.5 bg-black p-2.5">
      <div className="flex items-center justify-center px-0 pb-2.5 pt-1">
        <img src={logo} alt={logoAlt} className="h-[62px] w-[168px]" />
      </div>
      {tiers.map((tier, idx) => (
        <div key={tier.label} className="flex items-stretch gap-0.5">
          <div
            className="flex w-28 shrink-0 items-center justify-center"
            style={{ backgroundColor: tier.color }}
          >
            <span
              className="text-[68px] leading-none text-white"
              style={{ fontFamily: '"Manufacturing Consent", serif' }}
            >
              {tier.label}
            </span>
          </div>
          <div
            ref={(el) => {
              rowRefs.current[idx] = el;
            }}
            onDragOver={(e: DragEvent) => handleDragOver(e, idx)}
            onDrop={(e: DragEvent) => handleDrop(e, idx)}
            className={`flex min-h-[112px] flex-1 flex-wrap items-center gap-2.5 px-2.5 py-2 transition-colors ${
              dropTarget?.tierIndex === idx && enabled ? "bg-[#2a2a26]" : "bg-[#191917]"
            }`}
          >
            {tier.items.map((item) => (
              <SortableItemCard
                key={item.id}
                item={item}
                enabled={enabled}
                onAttemptEdit={onAttemptEdit}
                onDragStart={handleDragStart}
                onDragEnd={() => {
                  setDragItemId(null);
                  setDropTarget(null);
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
