import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";
import { getAuditDatabase } from "../lib/auditSupabase";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "../components/Avatar";
import { Sidebar } from "../components/Sidebar";
import { LocationCard } from "../components/LocationCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { PageTransition } from "../components/PageTransition";

interface Location {
  location_id: string;
  location_name: string;
  business_line: string;
  assigned_month: string;
  assignedTasks: number;
  completedTasks: number;
}

export default function MainPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.fromLogin) {
      setShowWelcome(true);
      const timer = setTimeout(() => {
        setShowWelcome(false);
        navigate(location.pathname, {
          replace: true,
          state: { refreshed: true },
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  const isLocationActive = (assignedMonth: string) => {
    const currentDate = new Date();
    const [month, year] = assignedMonth.split("-");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthIndex = months.indexOf(month);

    if (monthIndex === -1) return false;

    const assignedDate = new Date(parseInt(year), monthIndex);
    const currentMonthYear = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth()
    );

    return assignedDate >= currentMonthYear;
  };

  useEffect(() => {
    const fetchLocations = async () => {
      if (!user?.email) {
        navigate("/login");
        return;
      }

      try {
        const { data: locationData, error: locationError } = await supabase
          .from("user_accessible_locations")
          .select("location_id, location_name, business_line, assigned_month")
          .eq("user_mail", user.email);

        if (locationError) throw locationError;
        if (!locationData) throw new Error("No locations found");

        const activeLocations = locationData.filter(loc =>
          isLocationActive(loc.assigned_month)
        );

        const locationsWithTasks = await Promise.all(
          activeLocations.map(async loc => {
            const { count: assignedCount } = await supabase
              .from("checklist")
              .select("*", { count: "exact", head: true })
              .eq("business_line", loc.business_line);

            const auditDb = getAuditDatabase(loc.business_line);
            const { count: completedCount } = await auditDb
              .from(`${loc.business_line.toLowerCase()}_audit_data`)
              .select("*", { count: "exact", head: true })
              .eq("location_id", loc.location_id);

            return {
              ...loc,
              assignedTasks: assignedCount || 0,
              completedTasks: completedCount || 0,
            };
          })
        );

        setLocations(locationsWithTasks);
      } catch (error) {
        console.error("Error fetching locations:", error);
        toast.error("Failed to load locations");
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [user, navigate]);

  const handleLocationClick = (locationId: string) => {
    if (!locationId) {
      toast.error("Invalid location");
      return;
    }

    try {
      navigate(`/location/${locationId}`);
    } catch (error) {
      console.error("Navigation error:", error);
      toast.error("Failed to navigate to location details");
    }
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
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-x-0 top-0 bg-green-500 text-white p-4 text-center z-50"
            >
              Login successfully complete
            </motion.div>
          )}
        </AnimatePresence>

        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Process Audit Tool
            </h1>
            <Avatar
              name={`${user?.firstName} ${user?.lastName}`}
              onClick={() => setIsSidebarOpen(true)}
            />
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {locations.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">
                No active locations found for the current month.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locations.map(location => (
                <LocationCard
                  key={location.location_id}
                  locationId={location.location_id}
                  locationName={location.location_name}
                  businessLine={location.business_line}
                  assignedTasks={location.assignedTasks}
                  completedTasks={location.completedTasks}
                  onClick={handleLocationClick}
                  disabled={location.assignedTasks === location.completedTasks}
                />
              ))}
            </div>
          )}
        </main>

        <AnimatePresence>
          {isSidebarOpen && (
            <Sidebar
              isOpen={isSidebarOpen}
              onClose={() => setIsSidebarOpen(false)}
              user={{
                firstName: user?.firstName || "",
                lastName: user?.lastName || "",
                email: user?.email || "",
              }}
              onLogout={logout}
            />
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
