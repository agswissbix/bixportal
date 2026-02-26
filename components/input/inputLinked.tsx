"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Loader2, Filter } from "lucide-react"
import _ from "lodash"
import axiosInstanceClient from "@/utils/axiosInstanceClient"
import { useRecordsStore } from "../records/recordsStore"
import { Plus, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface PropsInterface {
  initialValue?: string
  onChange?: (value: string) => void
  tableid?: string
  linkedmaster_tableid?: string
  linkedmaster_recordid: string
  fieldid: string
  valuecode?: { code: string; value: string }
  formValues: Record<string, any>
  disabled?: boolean
}

interface LinkedItem {
  recordid: string
  name: string
}

interface LinkedMaster {
  linkeditems: LinkedItem[]
}

// Simulate API call - replace with your actual API call
const fetchLinkedItems = async (
    searchTerm: string,
    linkedmaster_tableid: string,
    tableid: string,
    fieldid: string,
    formValues: Record<string, any>,
    recordid?: string,
): Promise<{items: LinkedItem[], active_filters: {field: string, value: string, convertedvalue?: string}[]}> => {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 300));
    const payload = {
        apiRoute: "get_input_linked",
        fieldid: fieldid,
        tableid: tableid,
        linkedmaster_tableid: linkedmaster_tableid,
        searchTerm: searchTerm,
        formValues: formValues,
        recordid: recordid,
    };
    const res = await axiosInstanceClient.post("/postApi/", payload, {
        headers: {
            "Content-Type": "application/json",
        },
        withCredentials: true,
    });
    // Mock data - replace with actual API call
    return res.data;
};

export default function inputLinked({
  initialValue = "",
  onChange,
  linkedmaster_tableid,
  linkedmaster_recordid,
  tableid,
  fieldid,
  valuecode,
  formValues,
  disabled=false
}: PropsInterface) {
  const [value, setValue] = useState(valuecode?.value ?? "")
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<LinkedItem[]>([])
  const [activeFilters, setActiveFilters] = useState<{field: string, value: string, convertedvalue?: string}[]>([])
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { handleRowClick } = useRecordsStore()

  linkedmaster_tableid = linkedmaster_tableid ? String(linkedmaster_tableid) : ""

  const formValuesRef = useRef(formValues)
  useEffect(() => {
    formValuesRef.current = formValues
  }, [formValues])

  const internalTableId = linkedmaster_tableid ? String(linkedmaster_tableid) : ""
  useEffect(() => {
      const resolveInitialValue = async () => {
          if (initialValue && initialValue !== "") {
              setLoading(true);
              try {
                  const results = await fetchLinkedItems(
                      "",
                      internalTableId,
                      tableid || "",
                      fieldid,
                      formValuesRef.current,
                      initialValue
                  );

                  if (results?.items && results.items.length > 0) {
                      const matchedItem = results.items.find(
                          (item) => item.recordid === initialValue
                      );
                      if (matchedItem) {
                          setValue(matchedItem.name);
                      }
                  }
                  if (results?.active_filters) {
                      setActiveFilters(results.active_filters);
                  }
              } catch (err) {
                  console.error(
                      "Errore nel recupero del valore iniziale:",
                      err
                  );
              } finally {
                  setLoading(false);
              }
          } else if (initialValue === "") {
              setValue("");
          }
      };

      resolveInitialValue();
  }, [initialValue, internalTableId, tableid, fieldid]);

  const debouncedSearch = useRef(
    _.debounce(async (searchTerm: string) => {
      setLoading(true)
      setError(null)
      try {
        if (linkedmaster_tableid && tableid) {
          const results = await fetchLinkedItems(
            searchTerm,
            linkedmaster_tableid,
            tableid,
            fieldid,
            formValuesRef.current,
          )
          setItems(results?.items || [])
          setActiveFilters(results?.active_filters || [])
        } else {
          setError("Missing required parameters")
          setItems([])
          setActiveFilters([])
        }
      } catch {
        setError("Error fetching data")
        setItems([])
        setActiveFilters([])
      } finally {
        setLoading(false)
      }
    }, 300),
  ).current

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    return () => {
      debouncedSearch.cancel()
    }
  }, [debouncedSearch])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.info("handleChange")
    const newValue = e.target.value
    setValue(newValue)
    setIsOpen(true)
    debouncedSearch(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
    setIsOpen(true)
    debouncedSearch("")
  }

  const handleSelectOption = (item: LinkedItem) => {
    console.info("handleSelectOption")
    setValue(item.name)
    setIsOpen(false)
    if (onChange) {
      onChange(item.recordid)
    }
  }
  console.info("test inputLinked:", valuecode)
  useEffect(() => {
    if (onChange && valuecode?.code) {
      onChange(valuecode?.code)
    }
  }, [valuecode?.code])

  return (
    <div className="relative w-full group" ref={wrapperRef}>
      <div className="relative">
        <div className="flex items-center rounded-lg bg-background border border-gray-300 pl-3 transition-all duration-200 hover:border-gray-300 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:shadow-sm">
          <input
            name="word"
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            disabled={disabled}
            autoComplete="off"
            placeholder={disabled ? "" : "Cerca..."}
            className="block min-w-0 grow py-2.5 pl-1 pr-2 text-sm text-foreground placeholder:text-muted-foreground bg-transparent focus:outline-none transition-colors"
          />

          <button
            type="button"
            onClick={() => {
              if (linkedmaster_tableid && linkedmaster_recordid) {
                handleRowClick("linked", linkedmaster_recordid, linkedmaster_tableid)
              } else {
                toast.error("Nessun dato collegato selezionato.")
              }
            }}
            className="p-2 text-muted-foreground hover:text-accent-foreground hover:bg-accent rounded-md transition-all duration-200 hover:scale-110"
            title="Apri collegato"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (linkedmaster_tableid) {
                handleRowClick("linked", "", linkedmaster_tableid)
              } else {
                console.error("Missing required parameters for handleRowClick", linkedmaster_recordid, linkedmaster_tableid)
              }
            }}
            className="p-2 mr-1 text-muted-foreground hover:text-accent-foreground hover:bg-accent rounded-md transition-all duration-200 hover:scale-110"
            title="Aggiungi nuovo"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="absolute bottom-0 left-1 right-1 h-0.5 bg-gradient-to-r from-primary via-accent to-primary scale-x-0 group-focus-within:scale-x-100 transition-transform duration-300 rounded-full" />
      </div>

      {isOpen && (
        <div className="absolute w-full z-[9999] bg-white mt-2 border border-gray-300 rounded-lg shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
          
{activeFilters.length > 0 && (
  <div className="px-3 py-2 bg-zinc-50 border-b border-zinc-100 flex flex-wrap gap-2 items-center">
    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
      <Filter className="w-4 h-4" />
    </span>
    <div className="flex flex-wrap gap-1.5">
      {activeFilters.map((filter, index) => (
        <div
          key={index}
          className="inline-flex items-center gap-1.5 rounded-full bg-white border border-zinc-200 px-2.5 py-0.5 text-xs"
        >
          <span className="text-zinc-500 font-medium text-[10px] uppercase tracking-wide">
            {filter.field}
          </span>
          <span className="h-3 w-px bg-zinc-200" />
          <span className="text-zinc-700 font-medium">
            {filter.convertedvalue || filter.value}
          </span>
        </div>
      ))}
    </div>
  </div>
)}
          
          {loading ? (
            <div className="flex items-center justify-center p-4 text-muted-foreground">
              <Loader2 className="animate-spin mr-2" size={20} />
              <span className="text-sm">Caricamento...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-destructive text-center text-sm">{error}</div>
          ) : (
            <div className="max-h-60 overflow-y-auto shadow-lg">
              {items.length > 0 ? (
                items.map((item) => (
                  <div
                    key={item.recordid}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      handleSelectOption(item)
                    }}
                    className="px-3 py-2.5 hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors duration-150 border-b border-gray-300/50 last:border-0"
                  >
                    <p className="text-sm font-medium">{item.name}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-muted-foreground text-center text-sm">Nessun risultato trovato</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
