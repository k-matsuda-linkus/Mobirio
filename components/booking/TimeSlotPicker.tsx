'use client';

interface TimeSlotPickerProps {
  availableSlots: string[];
  selectedSlot?: string;
  onSelect: (slot: string) => void;
}

export function TimeSlotPicker({ availableSlots, selectedSlot, onSelect }: TimeSlotPickerProps) {
  return (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-[6px]">
      {availableSlots.map((slot) => (
        <button
          key={slot}
          onClick={() => onSelect(slot)}
          className={`py-[10px] px-[8px] text-sm text-center border transition-colors ${
            selectedSlot === slot ? 'bg-black text-white border-black' : 'border-gray-200 hover:border-black'
          }`}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}
