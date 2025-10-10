"use client";

import GenericComponent from "@/components/genericComponent";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Save } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { useApi } from "@/utils/useApi";
import { toast } from "sonner";
import DraggableList from "@/components/admin/tables/draggableList";
import axiosInstanceClient from "@/utils/axiosInstanceClient";

const isDev = false;

interface LinkedTable {
  tablelinkid: string;
  description: string;
  fieldorder?: number | null;
  visible?: boolean;
}

interface ResponseInterface {
  success: boolean;
  linked_tables: LinkedTable[];
}

interface PropsLinkedTables {
  tableId: string;
  userId: string;
}

const LinkedTablesDev: ResponseInterface = {
  success: true,
  linked_tables: [
    { tablelinkid: "tab_users", description: "Utenti", fieldorder: 0, visible: true },
    { tablelinkid: "tab_orders", description: "Ordini", fieldorder: 1, visible: true },
    { tablelinkid: "tab_invoices", description: "Fatture", fieldorder: 2, visible: false },
  ],
};

export default function LinkedTables({ tableId, userId }: PropsLinkedTables) {
  const [linkedTables, setLinkedTables] = useState<LinkedTable[]>(isDev ? LinkedTablesDev.linked_tables : []);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaved, setIsSaved] = useState(true);

  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: "settings_table_linkedtables",
      tableid: tableId,
      userid: userId,
    };
  }, [userId, tableId]);

  const { response, loading, error } =
    !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

  useEffect(() => {
    if (!isDev && response) {
      console.log(response.linked_tables)
      setLinkedTables(response.linked_tables);
    }
  }, [response]);

  // 🔹 Mappa i dati in formato DraggableList
  const filteredTables = useMemo(() => {
    if (!searchTerm.trim()) return linkedTables;
    const lower = searchTerm.toLowerCase();
    return linkedTables.filter(
      (t) =>
        t.description.toLowerCase().includes(lower) ||
        t.tablelinkid.toLowerCase().includes(lower)
    );
  }, [linkedTables, searchTerm]);

  const tablesAsGroups = useMemo(() => {
    return {
      linked: {
        name: "linked",
        items: filteredTables.map((t) => ({
          id: t.tablelinkid,
          description: t.description,
          order: t.fieldorder ?? null,
          visible: t.visible ?? true,
        })),
      },
    };
  }, [filteredTables]);

  const handleFieldsChange = (groups: Record<string, any>) => {
    const updated = groups.linked.items.map((item: any, index: number) => ({
      tablelinkid: item.id,
      description: item.description,
      fieldorder: item.order,
      visible: item.visible,
    }));
    setLinkedTables(updated);
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (isDev) {
      toast.success("Ordine (mock) salvato!");
      setIsSaved(true);
      return;
    }

    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "settings_table_linkedtables_save",
          tableid: tableId,
          userid: userId,
          fields: linkedTables
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {

        toast.success("Ordine salvato con successo!");
        setIsSaved(true);
      }
    } catch {
      toast.error("Errore durante il salvataggio!");
    }
  };

  const onSelectField = (id: string) => {
    console.log("Settings per:", id);
  };

  return (
    <GenericComponent response={linkedTables} loading={loading} error={error}>
      {(response: LinkedTable[]) => (
        <Card className="overflow-y-auto h-full shadow-lg border-slate-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200 sticky top-0 z-10">
            <CardTitle>
              <div className="flex justify-between items-center">
                <span className="text-slate-800 text-lg font-semibold">Tabelle Collegate</span>
                <Button
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSaved}
                >
                  <Save className="h-4 w-4 mr-2" /> Salva
                </Button>
              </div>
            </CardTitle>

            <div className="relative mt-3">
              <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cerca tabella..."
                className="pl-9 w-full max-w-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <DraggableList
              groups={tablesAsGroups}
              onGroupsChange={handleFieldsChange}
              onItemSettings={(id: string) => onSelectField(id)}
              showGroups={false}
              isSaved={isSaved}
              setIsSaved={setIsSaved}
            />
          </CardContent>
        </Card>
      )}
    </GenericComponent>
  );
}
