import { motion } from 'framer-motion';
import { MapPin, CheckSquare, AlertCircle } from 'lucide-react';

interface LocationCardProps {
  locationName: string;
  businessLine: string;
  assignedTasks: number;
  completedTasks: number;
  locationId: string;
  onClick: (locationId: string) => void;
  disabled?: boolean;
}

export function LocationCard({ 
  locationName, 
  businessLine, 
  assignedTasks,
  completedTasks,
  locationId,
  onClick,
  disabled = false
}: LocationCardProps) {
  const getAuditStatus = () => {
    if (completedTasks === 0) return { text: 'Assigned', color: 'text-blue-600' };
    if (completedTasks === assignedTasks) return { text: 'Completed', color: 'text-green-600' };
    return { text: 'In Progress', color: 'text-orange-600' };
  };

  const status = getAuditStatus();

  const handleClick = () => {
    if (!disabled && locationId) {
      onClick(locationId);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`bg-white rounded-xl shadow-lg p-4 ${
        disabled ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-5 h-5 text-blue-500" />
          <h3 className="text-base font-medium">{locationName}</h3>
        </div>
        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-sm">
          {businessLine}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-base text-gray-600">
          <CheckSquare className="w-4 h-4" />
          <span>Assigned: {assignedTasks} | Completed: {completedTasks}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4" />
          <span className={`text-base font-medium ${status.color}`}>
            {status.text}
          </span>
        </div>
      </div>
    </motion.div>
  );
}