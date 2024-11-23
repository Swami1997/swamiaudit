import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { getAuditDatabase } from "../lib/auditSupabase";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PageTransition } from "../components/PageTransition";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AuditForm } from "../components/AuditForm";
import { generatePointId } from "../lib/utils";

interface Task {
  unique_id: string;
  description: string;
  impact: string;
  weightage: number | null;
  owner: string;
  department: string;
  business_line: string;
}

interface LocationInfo {
  location_name: string;
  location_id: string;
  business_line: string;
}

export default function ScoreboardPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState<Task | null>(null);
  const [locationInfo, setLocationInfo] = useState<LocationInfo | null>(null);
  const [selectedWeightage, setSelectedWeightage] = useState<number | null>(
    null
  );
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const state = location.state as {
    owner: string;
    businessLine: string;
    descriptionId: string;
    returnState: {
      selectedOwner: string;
      selectedBusinessLine: string;
    };
  } | null;

  const checkAllTasksCompleted = async (
    locationId: string,
    businessLine: string
  ) => {
    try {
      // Get all tasks for this business line
      const { data: allTasks } = await supabase
        .from("checklist")
        .select("unique_id")
        .eq("business_line", businessLine);

      if (!allTasks) return false;

      // Get completed tasks
      const auditDb = getAuditDatabase(businessLine);
      const { data: completedTasks } = await auditDb
        .from(`${businessLine.toLowerCase()}_audit_data`)
        .select("unique_id")
        .eq("location_id", locationId);

      if (!completedTasks) return false;

      // Check if all tasks are completed
      const isAllCompleted = allTasks.every(task =>
        completedTasks.some(completed => completed.unique_id === task.unique_id)
      );

      return isAllCompleted;
    } catch (error) {
      console.error("Error checking task completion:", error);
      return false;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.email || !id || !state) {
        navigate("/dashboard");
        return;
      }

      try {
        // Fetch location info
        const { data: locationData, error: locationError } = await supabase
          .from("user_accessible_locations")
          .select("location_id, location_name, business_line")
          .eq("location_id", id)
          .eq("user_mail", user.email)
          .single();

        if (locationError || !locationData) {
          throw new Error("Location not found or access denied");
        }

        setLocationInfo(locationData);

        // Check if task is already completed
        const auditDb = getAuditDatabase(locationData.business_line);
        const { data: existingAudit } = await auditDb
          .from(`${locationData.business_line.toLowerCase()}_audit_data`)
          .select("unique_id")
          .eq("unique_id", state.descriptionId)
          .eq("location_id", id)
          .single();

        if (existingAudit) {
          toast.error("This task has already been completed");
          navigate(`/location/${id}`, {
            state: {
              returnState: state.returnState,
              refreshOwner: true,
            },
          });
          return;
        }

        // Fetch task details
        const { data: taskData, error: taskError } = await supabase
          .from("checklist")
          .select(
            "unique_id, description, impact, weightage, owner, department, business_line"
          )
          .eq("unique_id", state.descriptionId)
          .eq("business_line", state.businessLine)
          .eq("owner", state.owner)
          .single();

        if (taskError || !taskData) {
          throw new Error("Task not found");
        }

        setTask(taskData);
        setSelectedWeightage(
          taskData.weightage ? Number(taskData.weightage) : null
        );
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load task details");
        navigate(`/location/${id}`, {
          state: {
            returnState: state?.returnState,
            refreshOwner: true,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, state, user, navigate]);

  const handleSubmit = async () => {
    if (!task || !state || !locationInfo || !user?.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (
      (selectedWeightage === null || selectedWeightage !== 5) &&
      !remarks.trim()
    ) {
      toast.error("Remarks are required for all scores except 5");
      return;
    }

    setSubmitting(true);
    try {
      const auditDb = getAuditDatabase(locationInfo.business_line);

      // Get current audit number
      const { count } = await auditDb
        .from(`${locationInfo.business_line.toLowerCase()}_audit_data`)
        .select("*", { count: "exact", head: true })
        .eq("unique_id", task.unique_id)
        .eq("location_id", locationInfo.location_id);

      const auditNumber = ((count || 0) + 1).toString();
      const pointId = generatePointId();

      // Submit audit data
      const { error: submitError } = await auditDb
        .from(`${locationInfo.business_line.toLowerCase()}_audit_data`)
        .insert([
          {
            point_id: pointId,
            location_name: locationInfo.location_name,
            owner: task.owner,
            department: task.department,
            description: task.description,
            impact: task.impact,
            weightage: task.weightage,
            unique_id: task.unique_id,
            business_line: task.business_line,
            audit_score: selectedWeightage === -1 ? null : selectedWeightage,
            audit_remarks: remarks.trim(),
            audit_number: auditNumber,
            user_mail: user.email,
            location_id: locationInfo.location_id,
          },
        ]);

      if (submitError) throw submitError;

      toast.success("Audit submitted successfully");

      // Check if all tasks are completed
      const isAllCompleted = await checkAllTasksCompleted(
        locationInfo.location_id,
        locationInfo.business_line
      );

      if (isAllCompleted) {
        toast.success("All tasks completed for this location!");
        navigate("/dashboard");
      } else {
        navigate(`/location/${id}`, {
          state: {
            returnState: state.returnState,
            refreshOwner: true,
          },
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to submit audit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!task || !state) {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F67A2C]">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() =>
                navigate(`/location/${id}`, {
                  state: {
                    returnState: state.returnState,
                    refreshOwner: true,
                  },
                })
              }
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-2"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Location
            </button>
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">
                Score Task - {state.owner}
              </h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {state.businessLine}
              </span>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <AuditForm
              task={task}
              selectedWeightage={selectedWeightage}
              remarks={remarks}
              submitting={submitting}
              onWeightageSelect={value => setSelectedWeightage(value)}
              onRemarksChange={setRemarks}
              onSubmit={handleSubmit}
            />
          </motion.div>
        </main>
      </div>
    </PageTransition>
  );
}
