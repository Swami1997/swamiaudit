import { User } from 'lucide-react';
import { motion } from 'framer-motion';

interface AvatarProps {
  name: string;
  onClick: () => void;
}

export function Avatar({ name, onClick }: AvatarProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white"
      onClick={onClick}
    >
      <User className="w-6 h-6" />
    </motion.button>
  );
}