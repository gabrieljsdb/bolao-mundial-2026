import { Plus, Minus } from "lucide-react";
import { useState } from "react";

interface ScoreInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
}

export function ScoreInput({ 
  value, 
  onChange, 
  disabled = false,
  min = 0,
  max = 20
}: ScoreInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const numValue = value ?? 0;

  const handleIncrement = () => {
    if (!disabled && numValue < max) {
      onChange(numValue + 1);
    }
  };

  const handleDecrement = () => {
    if (!disabled && numValue > min) {
      onChange(numValue - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      onChange(null);
    } else {
      const num = parseInt(val);
      if (!isNaN(num) && num >= min && num <= max) {
        onChange(num);
      }
    }
  };

  return (
    <div 
      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border-2 transition-all ${
        isFocused
          ? "border-green-400 bg-black/60 shadow-[0_0_12px_rgba(74,222,128,0.4)]"
          : "border-green-800 bg-black/40 hover:border-green-700"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <button
        onClick={handleDecrement}
        disabled={disabled || numValue <= min}
        className={`p-1 rounded transition-colors ${
          disabled || numValue <= min
            ? "text-green-900 cursor-not-allowed"
            : "text-green-400 hover:text-green-300 hover:bg-green-900/30"
        }`}
        title="Diminuir"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <input
        type="number"
        value={value === null ? "" : value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        min={min}
        max={max}
        className={`w-10 h-9 text-center font-bebas text-lg font-bold outline-none bg-transparent text-green-300 placeholder-green-900 ${
          disabled ? "cursor-not-allowed" : ""
        }`}
        placeholder="—"
      />

      <button
        onClick={handleIncrement}
        disabled={disabled || numValue >= max}
        className={`p-1 rounded transition-colors ${
          disabled || numValue >= max
            ? "text-green-900 cursor-not-allowed"
            : "text-green-400 hover:text-green-300 hover:bg-green-900/30"
        }`}
        title="Aumentar"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
