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
import DraggableList from "@/components/admin/tables/draggableList";

// --- CONFIG DEV ---
const isDev = false;

// --- TYPES ---
interface LinkedTable {
  tablelinkid: string;
  description: string;
  fieldorder?: number | null;
  [key: string]: any;
}

interface ResponseInterface {
  success: boolean;
  linked_tables: LinkedTable[];
}

interface PropsLinkedTables {
    tableId: string
    userId: string
}

// --- COMPONENT ---
export default function LinkedTables({tableId, userId} : PropsLinkedTables) {
  const [responseData, setResponseData] = useState<ResponseInterface>();
  const [searchTerm, setSearchTerm] = useState("");
  const [fieldsAsGroups, setFieldsAsGroups] = useState({});
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
      setResponseData(response);
    } else if (isDev) {
      // Mock di sviluppo
      setResponseData({
        success: true,
        linked_tables: [
          { tablelinkid: "tab_users", description: "Utenti", fieldorder: 0 },
          { tablelinkid: "tab_orders", description: "Ordini", fieldorder: 1 },
          { tablelinkid: "tab_invoices", description: "Fatture", fieldorder: null },
        ],
      });
    }
  }, [response]);

  // 🔹 Mappa i dati in formato DraggableList
  useEffect(() => {
    if (responseData?.linked_tables) {
      const items = responseData.linked_tables.map((t) => ({
        id: t.tablelinkid,
        description: t.description,
        order: t.fieldorder ?? null,
      }));

      // DraggableList accetta un oggetto groups
      const groups = {
        linked: {
          name: "Tabelle Collegate",
          items,
        },
      };

      setFieldsAsGroups(groups);
    }
  }, [responseData]);

  const handleFieldsChange = (newGroups: any) => {
    setFieldsAsGroups(newGroups);
    setIsSaved(false);
  };

  const onSelectField = (fieldId: string) => {
    console.log("Settings per:", fieldId);
  };

  const handleSave = () => {
    console.log("Salvataggio nuovo ordine:", fieldsAsGroups);
    setIsSaved(true);
  };

  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return fieldsAsGroups;
    const group = fieldsAsGroups["linked"];
    if (!group) return fieldsAsGroups;

    const filteredItems = group.items.filter((item: any) =>
      `${item.description} ${item.id}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    return {
      linked: {
        ...group,
        items: filteredItems,
      },
    };
  }, [fieldsAsGroups, searchTerm]);

  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(response: ResponseInterface) => (
        <Card className="overflow-y-auto h-full shadow-lg border-slate-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200">
            <CardTitle>
              <div className="flex flex-wrap justify-between items-center w-full">
                <span className="text-slate-800 text-lg">Tabelle Collegate</span>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors"
                    disabled={isSaved}
                  >
                    <Save className="h-4 w-4 mr-2" /> Salva
                  </Button>
                </div>
              </div>
            </CardTitle>

            <div className="relative mb-2 mt-3 bg-white">
              <Search className="absolute left-3 top-2.5 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cerca tabella per nome o ID..."
                className="pl-9 w-full max-w-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <DraggableList
              groups={filteredGroups}
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
