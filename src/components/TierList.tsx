import React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';

export type Item = {
  id: string;
  name: string;
  image: string;
};

export type Tier = {
  label: string;
  color: string;
  items: Item[];
};

function SortableItemCard({ item }: { item: Item }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex cursor-grab flex-col items-center gap-1.5 rounded-[11px] bg-[#2E2E2A] p-1 pb-2 select-none active:cursor-grabbing"
    >
      <img
        src={item.image}
        alt={item.name}
        className="h-16 w-16 rounded-md object-cover"
        draggable={false}
      />
      <span
        className="text-center text-[17px] leading-tight text-white"
        style={{ fontFamily: 'Manjari, sans-serif' }}
      >
        {item.name}
      </span>
    </div>
  );
}

function TierRow({ tier, tierIndex }: { tier: Tier; tierIndex: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `tier-${tierIndex}`,
  });

  return (
    <div className="flex items-stretch gap-0.5">
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
        ref={setNodeRef}
        className={`flex min-h-[112px] flex-1 flex-wrap items-center gap-2.5 px-2.5 py-2 transition-colors ${
          isOver ? 'bg-[#2a2a26]' : 'bg-[#191917]'
        }`}
      >
        <SortableContext
          items={tier.items.map((i) => i.id)}
          strategy={horizontalListSortingStrategy}
        >
          {tier.items.map((item) => (
            <SortableItemCard key={item.id} item={item} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function TierList({
  logo,
  logoAlt,
  tiers,
  onDragEnd,
  enabled = true,
}: {
  logo: string;
  logoAlt: string;
  tiers: Tier[];
  enabled?: boolean;
  onDragEnd: (oldTierIndex: number, newTierIndex: number, oldIndex: number, newIndex: number) => void;
}) {
  const [activeItem, setActiveItem] = React.useState<Item | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5, delay: enabled ? 0 : 999999 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findTierIndex = (itemId: string) =>
    tiers.findIndex((t) => t.items.some((i) => i.id === itemId));

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    for (const tier of tiers) {
      const found = tier.items.find((i) => i.id === active.id);
      if (found) {
        setActiveItem(found);
        break;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const activeTierIdx = findTierIndex(active.id as string);
    let overTierIdx: number;

    // Check if dropped directly on a tier droppable or on an item
    const overAsStr = over.id as string;
    if (overAsStr.startsWith('tier-')) {
      overTierIdx = parseInt(overAsStr.replace('tier-', ''), 10);
    } else {
      overTierIdx = findTierIndex(overAsStr);
    }

    if (activeTierIdx === -1 || overTierIdx === -1) return;

    const oldItems = [...tiers[activeTierIdx].items];
    const newItems = activeTierIdx === overTierIdx ? oldItems : [...tiers[overTierIdx].items];

    const oldIndex = oldItems.findIndex((i) => i.id === active.id);
    let newIndex: number;

    if (activeTierIdx === overTierIdx) {
      newIndex = newItems.findIndex((i) => i.id === over.id);
    } else {
      // Dropping into a different tier — place at end or at the position of the hovered item
      const overItemIdx = newItems.findIndex((i) => i.id === over.id);
      newIndex = overItemIdx >= 0 ? overItemIdx : newItems.length;
    }

    onDragEnd(activeTierIdx, overTierIdx, oldIndex, newIndex);
  };

  return (
    <div className="flex w-full max-w-[629px] flex-col gap-0.5 bg-black p-2.5">
      <div className="flex items-center justify-center px-0 pb-2.5 pt-1">
        <img src={logo} alt={logoAlt} className="h-[62px] w-[168px]" />
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {tiers.map((tier, idx) => (
          <TierRow key={tier.label} tier={tier} tierIndex={idx} />
        ))}
        <DragOverlay>
          {activeItem ? (
            <div className="flex flex-col items-center gap-1.5 rounded-[11px] bg-[#2E2E2A] p-1 pb-2 opacity-90 shadow-xl">
              <img
                src={activeItem.image}
                alt={activeItem.name}
                className="h-16 w-16 rounded-md object-cover"
              />
              <span
                className="text-center text-[17px] leading-tight text-white"
                style={{ fontFamily: 'Manjari, sans-serif' }}
              >
                {activeItem.name}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
