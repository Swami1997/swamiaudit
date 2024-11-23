import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Clock, ChevronDown, ChevronUp, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getAuditDatabase } from '../lib/auditSupabase';
import { LoadingSpinner } from './LoadingSpinner';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: { firstName: string; lastName: string; email: string };
  onLogout: () => void;
}

interface MonthlyAudit {
  month: string;
  year: string;
  locations: {
    name: string;
    assignedTasks: number;
    completedTasks: number;
  }[];
}

export function Sidebar({ isOpen, onClose, user, onLogout }: SidebarProps) {
  const [monthlyAudits, setMonthlyAudits] = useState<MonthlyAudit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const toggleMonth = (monthYear: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthYear)) {
      newExpanded.delete(monthYear);
    } else {
      newExpanded.add(monthYear);
    }
    setExpandedMonths(newExpanded);
  };

  const handleHomeClick = () => {
    navigate('/dashboard');
    onClose();
  };

  useEffect(() => {
    const fetchAuditSummary = async () => {
      if (!isOpen || !user.email) return;

      try {
        const { data: locations } = await supabase
          .from('user_accessible_locations')
          .select('*')
          .eq('user_mail', user.email);

        if (!locations) return;

        const monthGroups = locations.reduce((acc: { [key: string]: typeof locations }, loc) => {
          if (!acc[loc.assigned_month]) {
            acc[loc.assigned_month] = [];
          }
          acc[loc.assigned_month].push(loc);
          return acc;
        }, {});

        const summaryPromises = Object.entries(monthGroups).map(async ([monthYear, locs]) => {
          const [month, year] = monthYear.split('-');
          
          const locationPromises = locs.map(async (loc) => {
            const { count: assignedCount } = await supabase
              .from('checklist')
              .select('*', { count: 'exact', head: true })
              .eq('business_line', loc.business_line);

            const auditDb = getAuditDatabase(loc.business_line);
            const { count: completedCount } = await auditDb
              .from(`${loc.business_line.toLowerCase()}_audit_data`)
              .select('*', { count: 'exact', head: true })
              .eq('location_id', loc.location_id);

            return {
              name: loc.location_name,
              assignedTasks: assignedCount || 0,
              completedTasks: completedCount || 0
            };
          });

          const locationSummaries = await Promise.all(locationPromises);

          return {
            month,
            year,
            locations: locationSummaries
          };
        });

        const summaries = await Promise.all(summaryPromises);
        setMonthlyAudits(summaries.sort((a, b) => {
          const dateA = new Date(`${a.month} 1, ${a.year}`);
          const dateB = new Date(`${b.month} 1, ${b.year}`);
          return dateB.getTime() - dateA.getTime();
        }));
      } catch (error) {
        console.error('Error fetching audit summary:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditSummary();
  }, [isOpen, user.email]);

  return (
    <>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-lg z-50 overflow-hidden flex flex-col"
      >
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">{user.firstName} {user.lastName}</h2>
              <p className="text-gray-600 text-sm">{user.email}</p>
            </div>
            <button
              onClick={handleHomeClick}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Go to home"
            >
              <Home className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Audit Summary</h3>
            {loading ? (
              <div className="flex justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <div className="space-y-4">
                {monthlyAudits.map((audit) => {
                  const monthYear = `${audit.month}-${audit.year}`;
                  const isExpanded = expandedMonths.has(monthYear);
                  
                  return (
                    <div key={monthYear} className="bg-gray-50 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleMonth(monthYear)}
                        className="w-full px-4 py-3 flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <h4 className="font-medium text-gray-900">
                          {audit.month} {audit.year}
                        </h4>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="p-4 space-y-3">
                              {audit.locations.map((loc, idx) => (
                                <div key={idx} className="bg-white p-3 rounded-md shadow-sm">
                                  <p className="font-medium text-gray-800 mb-1">{loc.name}</p>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      {loc.completedTasks}/{loc.assignedTasks} tasks completed
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </motion.div>
    </>
  );
}