import { motion } from 'framer-motion';

interface ScoreSelectorProps {
  selectedWeightage: number | null;
  onSelect: (value: number | null) => void;
  disabled?: boolean;
}

const weightageOptions = [
  { value: 0, label: '0', width: 'w-[23%]' },
  { value: 3, label: '3', width: 'w-[23%]' },
  { value: 5, label: '5', width: 'w-[23%]' },
  { value: -1, label: 'NA', width: 'w-[23%]' }, // Using -1 to represent NA
];

export function ScoreSelector({ selectedWeightage, onSelect, disabled }: ScoreSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Score <span className="text-red-500">*</span>
      </label>
      <div className="flex justify-between">
        {weightageOptions.map((option) => (
          <motion.button
            key={option.label}
            onClick={() => onSelect(option.value)}
            disabled={disabled}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            className={`${option.width} py-3 rounded-lg text-sm font-medium transition-colors ${
              (option.value === -1 && selectedWeightage === null) || selectedWeightage === option.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            {option.label}
          </motion.button>
        ))}
      </div>
      {selectedWeightage === undefined && (
        <p className="mt-2 text-sm text-red-500">Please select a score</p>
      )}
    </div>
  );
}