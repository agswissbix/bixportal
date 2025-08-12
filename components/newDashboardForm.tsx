import axiosInstanceClient from "@/utils/axiosInstanceClient";
import React from "react";
import { toast } from "sonner";

interface PropsInterface {}

export default function DashboardForm({ }: PropsInterface) {

  const [dashboardName, setDashboardName] = React.useState<string>("");

  const addDashboardBlock = async () => {
    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "new_dashboard",
          dashboard_name: dashboardName,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
        window.location.reload();
    } catch (error) {
      console.error("Errore durante il salvataggio della nuova dashboard", error);
      toast.error("Errore durante il salvataggio della nuova dashboard");
    }
  };
  return (
      <div className="w-1/2 mx-auto">
        <label
          htmlFor="dashboardName"   
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Nome dashboard
        </label>
        <input
          type="text"
          id="dashboardName"
          placeholder="Inserisci il nome..."
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={dashboardName}
          onChange={(e) => setDashboardName(e.target.value)}
        />
      <button
        type="button"
        onClick={addDashboardBlock}
        className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition-colors"
      >
        Crea
      </button>
    </div>

  );
}
