import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { getAuditDatabase } from "../lib/auditSupabase";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PageTransition } from "../components/PageTransition";
import { ArrowLeft, AlertTriangle, CheckCircle, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { SearchModal } from "../components/SearchModal";

interface Description {
  unique_id: string;
  description: string;
  impact: string;
  weightage: number | null;
  owner: string;
  business_line: string;
}

interface BusinessLine {
  business_line: string;
  owners: string[];
  ownerTaskCounts: Record<string, { total: number; completed: number }>;
}

interface CompletedTask {
  unique_id: string;
  location_id: string;
}

export default function LocationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [locationName, setLocationName] = useState("");
  const [businessLines, setBusinessLines] = useState<BusinessLine[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [selectedBusinessLine, setSelectedBusinessLine] = useState<
    string | null
  >(null);
  const [descriptions, setDescriptions] = useState<Description[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [loadingDescriptions, setLoadingDescriptions] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Description[]>([]);
  const [allDescriptions, setAllDescriptions] = useState<Description[]>([]);

  const fetchDescriptions = async (owner: string, businessLine: string) => {
    setLoadingDescriptions(true);
    try {
      const { data, error } = await supabase
        .from("checklist")
        .select(
          "unique_id, description, impact, weightage, owner, business_line"
        )
        .eq("owner", owner)
        .eq("business_line", businessLine);

      if (error) throw error;

      // Filter out completed tasks
      const incompleteTasks = (data || []).filter(
        task =>
          !completedTasks.some(
            completed =>
              completed.unique_id === task.unique_id &&
              completed.location_id === id
          )
      );

      setDescriptions(incompleteTasks);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load descriptions");
      setDescriptions([]);
    } finally {
      setLoadingDescriptions(false);
    }
  };

  useEffect(() => {
    const fetchLocationDetails = async () => {
      if (!user?.email || !id) {
        navigate("/dashboard");
        return;
      }

      try {
        // Fetch location details
        const { data: locationData, error: locationError } = await supabase
          .from("user_accessible_locations")
          .select("location_name, business_line")
          .eq("location_id", id)
          .eq("user_mail", user.email)
          .single();

        if (locationError || !locationData) {
          throw new Error("Location not found or access denied");
        }

        setLocationName(locationData.location_name);

        // Fetch completed tasks for this location
        const auditDb = getAuditDatabase(locationData.business_line);
        const { data: auditData } = await auditDb
          .from(`${locationData.business_line.toLowerCase()}_audit_data`)
          .select("unique_id, location_id")
          .eq("location_id", id);

        setCompletedTasks(auditData || []);

        // Get checklist data
        const { data: checklistData, error: checklistError } = await supabase
          .from("checklist")
          .select("*")
          .eq("business_line", locationData.business_line);

        if (checklistError || !checklistData) {
          throw new Error("Failed to load checklist data");
        }

        setAllDescriptions(checklistData);

        // Process owners and task counts
        const ownerMap = new Map<
          string,
          { total: number; completed: number }
        >();

        checklistData.forEach(task => {
          if (!task.owner) return;

          if (!ownerMap.has(task.owner)) {
            ownerMap.set(task.owner, { total: 0, completed: 0 });
          }

          const ownerStats = ownerMap.get(task.owner)!;
          ownerStats.total++;

          if (
            auditData?.some(completed => completed.unique_id === task.unique_id)
          ) {
            ownerStats.completed++;
          }
        });

        // Filter out owners with all tasks completed
        const activeOwners = Array.from(ownerMap.entries())
          .filter(([_, stats]) => stats.completed < stats.total)
          .sort(([a], [b]) => a.localeCompare(b));

        if (activeOwners.length === 0) {
          toast.success("All tasks completed for this location!");
          navigate("/dashboard");
          return;
        }

        const formattedBusinessLine: BusinessLine = {
          business_line: locationData.business_line,
          owners: activeOwners.map(([owner]) => owner),
          ownerTaskCounts: Object.fromEntries(activeOwners),
        };

        setBusinessLines([formattedBusinessLine]);

        // Restore selected owner if coming back from scoreboard
        const state = location.state as {
          returnState?: {
            selectedOwner: string;
            selectedBusinessLine: string;
          };
          refreshOwner?: boolean;
        };

        if (state?.returnState && state.refreshOwner) {
          const { selectedOwner, selectedBusinessLine } = state.returnState;
          setSelectedOwner(selectedOwner);
          setSelectedBusinessLine(selectedBusinessLine);
          await fetchDescriptions(selectedOwner, selectedBusinessLine);
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load location details");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchLocationDetails();
  }, [id, user, navigate, location.state]);

  const handleOwnerClick = async (owner: string, businessLine: string) => {
    setSelectedBusinessLine(businessLine);
    if (selectedOwner === owner) {
      setSelectedOwner(null);
      setDescriptions([]);
    } else {
      setSelectedOwner(owner);
      await fetchDescriptions(owner, businessLine);
    }
  };

  const handleDescriptionClick = (descriptionId: string) => {
    if (!selectedOwner || !selectedBusinessLine) return;

    navigate(`/scoreboard/${id}`, {
      state: {
        owner: selectedOwner,
        businessLine: selectedBusinessLine,
        descriptionId: descriptionId,
        returnState: {
          selectedOwner,
          selectedBusinessLine,
        },
      },
    });
  };

  const handleSearchResultClick = (description: Description) => {
    setSelectedBusinessLine(description.business_line);
    setSelectedOwner(description.owner);
    fetchDescriptions(description.owner, description.business_line);
    setIsSearchModalOpen(false);
    setSearchResults([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm mb-1">
          <div className="w-full px-2 py-2">
            <div className="flex items-center justify-between mb-1">
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="text-sm">Back</span>
              </button>
              <button
                onClick={() => setIsSearchModalOpen(true)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Search descriptions"
              >
                <Search className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <h1 className="text-lg font-bold text-gray-900">{locationName}</h1>
          </div>
        </header>

        <main className="w-full px-0.5">
          <div className="space-y-1">
            {businessLines.map(line => (
              <motion.div
                key={line.business_line}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm p-3"
              >
                <h2 className="text-base font-semibold text-gray-900 mb-2">
                  {line.business_line}
                </h2>

                <div className="overflow-x-auto">
                  <div className="flex gap-1.5 pb-2 overflow-x-auto hide-scrollbar">
                    {line.owners.map(owner => {
                      const counts = line.ownerTaskCounts[owner];
                      return (
                        <motion.button
                          key={owner}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            handleOwnerClick(owner, line.business_line)
                          }
                          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            selectedOwner === owner
                              ? "bg-blue-500 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {owner} ({counts.completed}/{counts.total})
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <AnimatePresence>
                  {selectedOwner &&
                    selectedBusinessLine === line.business_line && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1 mt-2"
                      >
                        {loadingDescriptions ? (
                          <div className="flex justify-center py-4">
                            <LoadingSpinner />
                          </div>
                        ) : descriptions.length > 0 ? (
                          descriptions.map(desc => (
                            <motion.div
                              key={desc.unique_id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              onClick={() =>
                                handleDescriptionClick(desc.unique_id)
                              }
                              className="w-[98%] mx-auto bg-gray-50 rounded-lg p-2 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-1">
                                  <p className="text-sm text-gray-900 font-medium mb-1">
                                    {desc.description}
                                  </p>
                                  <div className="flex items-center gap-1 text-xs">
                                    <AlertTriangle className="w-3 h-3 text-orange-500" />
                                    <span className="text-gray-600">
                                      Impact: {desc.impact}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">
                              All tasks completed for this owner!
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </main>

        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => {
            setIsSearchModalOpen(false);
            setSearchResults([]);
          }}
          searchResults={searchResults}
          onResultClick={handleSearchResultClick}
          onSearch={query => {
            if (!query.trim()) {
              setSearchResults([]);
              return;
            }

            const filteredResults = allDescriptions.filter(
              desc =>
                desc.description.toLowerCase().includes(query.toLowerCase()) &&
                !completedTasks.some(task => task.unique_id === desc.unique_id)
            );

            setSearchResults(filteredResults);
          }}
        />
      </div>
    </PageTransition>
  );
}
