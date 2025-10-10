"use client";

import React, { useState, useEffect, useMemo, ChangeEvent } from "react";
import { useApi } from "@/utils/useApi"; // ipotizzo un hook custom
import GenericComponent from "@/components/genericComponent";
import SelectStandard from "@/components/selectStandard";
import { Button } from "@/components/ui/button";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { toast } from "sonner";
import { Save, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const isDev = false;

interface LookupItem {
  id?: string;
  name: string;
  selected?: boolean;
}

interface TableSettingOption {
  id?: string;     
  name?: string;      
  value?: string;
}

interface TableSetting {
  type: "select" | "multiselect" | "parola";
  options?: (string | TableSettingOption)[];
  value: string | string[];
}

interface ResponseInterface {
  tablesettings: Record<string, TableSetting>;
}

interface Props {
  tableId: string;
  userId: string
}

const ResponseDataDef : ResponseInterface = {
  tablesettings: {}
};

const ResponseDataDev: ResponseInterface = {
  tablesettings: {
    edit: { type: "select", options: ["true", "false"], value: "true" },
    risultati_edit: { type: "select", options: ["true", "false"], value: "false" },
    default_viewid: { type: "select", options: [{ id: "1", name: "Vista 1" }, { id: "2", name: "Vista 2" }], value: "None" },
    default_recordstab: { type: "parola", value: "Tabella" },
    default_recordtab: { type: "parola", value: "Fields" },
    dem_mail_field: { type: "select", options: ["address", "email", "user_mail"], value: "address" },
    fields_autoscroll: { type: "select", options: ["true", "false"], value: "false" },
    col_s: { type: "parola", value: "3" },
    col_m: { type: "parola", value: "3" },
    col_l: { type: "parola", value: "3" },
  },
};

const TableSettingsForm: React.FC<Props> = ({ tableId, userId }) => {
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? ResponseDataDev : ResponseDataDef);
  const [formValues, setFormValues] = useState<Record<string, string | string[]>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");

  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: "settings_table_settings",
      tableid: tableId,
      userid: userId
    };
  }, [tableId]);

  const { response, loading, error } =
    !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

  useEffect(() => {
    const source = isDev ? ResponseDataDev : response;
    if (source) {
      setResponseData(source);
      const initialValues = Object.entries(source.tablesettings).reduce((acc, [key, val]) => {
        acc[key] = val.value;
        return acc;
      }, {} as Record<string, string | string[]>);
      setFormValues(initialValues);
    }
  }, [response, isDev]);

  const handleInputChange = (fieldId: string, value: string | string[]) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSave = async () => {
    try {
      const settings = Object.entries(formValues).map(([name, value]) => ({
        name,
        value: Array.isArray(value) ? value.join(",") : value,
      }));

      await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "settings_table_fields_settings_save",
          settings,
          tableid: tableId,
          userid: userId
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      toast.success("Impostazioni salvate correttamente.");
    } catch (err) {
      toast.error("Errore durante il salvataggio delle impostazioni");
    }
  };

  // filtro frontend per ricerca
  const filteredSettings = useMemo(() => {
    if (!searchTerm.trim()) return responseData.tablesettings;
    const lower = searchTerm.toLowerCase();
    return Object.fromEntries(
      Object.entries(responseData.tablesettings).filter(([key, val]) => {
        return key.toLowerCase().includes(lower) || 
               (typeof val.value === "string" && val.value.toLowerCase().includes(lower));
      })
    );
  }, [searchTerm, responseData]);

  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(response: ResponseInterface) => (
        <div className="flex flex-col gap-4 p-4 ">
          {/* Campo di ricerca */}
          <div className="relative mb-4 max-w-full">
            <Search className="absolute left-3 top-3 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cerca impostazione..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            />
          </div>

          {Object.entries(filteredSettings).map(([setting, val]) => {
            const initialValue = formValues[setting] ?? val.value ?? "";

            if (val.type === "select" || val.type === "multiselect") {
              const lookupItems =
                val.options?.map((opt) =>
                  typeof opt === "string" ? { name: opt, id: opt } : { name: opt.name ?? opt.id ?? "", id: opt.id ?? opt.name ?? "" }
                ) ?? [];

              return (
                <div key={setting} className="flex flex-col gap-2">
                  <label className="font-medium text-sm">{setting}</label>
                  <SelectStandard
                    lookupItems={lookupItems.map(item => ({ itemcode: item.id ?? item.name, itemdesc: item.name }))}
                    initialValue={initialValue}
                    onChange={(value: string | string[]) => handleInputChange(setting, value)}
                    isMulti={val.type === "multiselect"}
                  />
                </div>
              );
            }

            return (
              <div key={setting} className="flex flex-col gap-2">
                <label className="font-medium text-sm">{setting}</label>
                <input
                  type="text"
                  className="border rounded-md p-2"
                  value={initialValue as string}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(setting, e.target.value)}
                />
              </div>
            );
          })}

          <div className="sticky bottom-0 bg-white p-4 border-t w-full">
            <Button
              onClick={handleSave}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-colors"
            >
              <Save className="h-4 w-4 mr-2" /> Salva Impostazioni
            </Button>
          </div>
        </div>
      )}
    </GenericComponent>
  );
};

export default TableSettingsForm;
