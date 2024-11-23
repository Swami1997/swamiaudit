import { motion } from 'framer-motion';
import { Save, AlertCircle } from 'lucide-react';
import { ScoreSelector } from './ScoreSelector';

interface AuditFormProps {
  task: {
    description: string;
    impact: string;
  };
  selectedWeightage: number | null;
  remarks: string;
  submitting: boolean;
  onWeightageSelect: (value: number | null) => void;
  onRemarksChange: (value: string) => void;
  onSubmit: () => void;
}

export function AuditForm({
  task,
  selectedWeightage,
  remarks,
  submitting,
  onWeightageSelect,
  onRemarksChange,
  onSubmit,
}: AuditFormProps) {
  const isRemarksRequired = selectedWeightage !== 5;
  const isSubmitDisabled = submitting || 
    selectedWeightage === null || 
    (isRemarksRequired && !remarks.trim());

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Description</h2>
        <p className="text-gray-700">{task.description}</p>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Impact</h3>
        <p className="text-gray-600">{task.impact}</p>
      </div>

      <ScoreSelector
        selectedWeightage={selectedWeightage}
        onSelect={onWeightageSelect}
        disabled={submitting}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Audit Remarks {isRemarksRequired && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <textarea
            value={remarks}
            onChange={(e) => onRemarksChange(e.target.value)}
            disabled={submitting}
            placeholder={isRemarksRequired ? "Remarks are required for all scores except 5" : "Enter your audit remarks here..."}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[120px] resize-none"
          />
          {isRemarksRequired && !remarks.trim() && (
            <div className="absolute top-2 right-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          )}
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
          isSubmitDisabled
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        <Save className="w-4 h-4" />
        {submitting ? 'Submitting...' : 'Submit Audit'}
      </motion.button>
    </div>
  );
}