'use client';

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import GenericComponent from "@/components/genericComponent";
import axiosInstanceClient from "@/utils/axiosInstanceClient";
import { useApi } from "@/utils/useApi";
import { Trash2, Play, Save, Plus, Power, Calendar, Clock, Repeat, Settings, CheckCircle, XCircle, PlayCircle, Loader2, RefreshCw } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Copy, ExternalLink } from "lucide-react";


const isDev = false;

interface Schedule {
  id: number;
  name: string;
  func: string;
  schedule_type: string;
  minutes: number | null;
  next_run: string | null;
  repeats: number;
  display_next_run: string | null;
  output?: string;
  send_to_endpoint?: boolean;
  save_monitoring?: boolean
}

type AvailableTask = [string, string, string?];

interface SchedulerResponse {
  schedules: Schedule[];
  available_tasks: AvailableTask[];
}

export default function SchedulerPage() {

  const mockData: SchedulerResponse = {
    schedules: [
      {
        id: 1,
        name: "Backup Database",
        func: "backup_db",
        schedule_type: "D",
        minutes: null, // D è Daily, minutes deve essere null
        next_run: "2025-09-23T02:00:00Z",
        repeats: -1,
        display_next_run: "2025-09-23T02:00",
        output: "Success"
      },
      {
        id: 2,
        name: "Send Reports (Interval)",
        func: "send_reports",
        schedule_type: "I",
        minutes: 30, // I è Interval, minutes è usato
        next_run: "2025-09-24T09:00:00Z",
        repeats: 5,
        display_next_run: "2025-09-24T09:00",
        output: "Pending"
      },
      {
        id: 3,
        name: "Clean Temp Files",
        func: "cleanup_temp",
        schedule_type: "H",
        minutes: null, // H è Hourly, minutes deve essere null (o gestito diversamente se necessario)
        next_run: "2025-09-22T15:30:00Z",
        repeats: -1,
        display_next_run: "2025-09-22T15:30",
        output: "Running..."
      }
    ],
    available_tasks: [
      ["backup_db", "Database Backup", "Performs full database backup"],
      ["send_reports", "Send Reports", "Sends daily/weekly reports via email"],
      ["cleanup_temp", "Cleanup Temp Files", "Removes temporary files and logs"],
      ["sync_data", "Data Sync", "Synchronizes data between systems"]
    ]
  };


  const [responseData, setResponseData] = useState<SchedulerResponse>(isDev ? mockData : {
    schedules: [],
    available_tasks: [],
  });
  const [actionLoading, setActionLoading] = useState<{ [key: number]: string }>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [backendResponse, setBackendResponse] = useState<any>(null);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isOutputDialogOpen, setIsOutputDialogOpen] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState<string | null>(null);

  const payload = useMemo(() => {
    if (isDev) return null;
    return { apiRoute: 'schedule_list' };
  }, []);

  // useApi gestisce il caricamento iniziale
  const { response, loading, error } =
    !isDev && payload
      ? useApi<SchedulerResponse>(payload)
      : { response: null, loading: false, error: null };

  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response);
    }
  }, [response]);

  const { schedules = [], available_tasks = [] } = responseData;

  // Funzione per controllare lo stato di caricamento per azioni di riga o refresh
  const isLoadingOrRefreshing = (id?: number, apiRoute?: string) => {
    if (id !== undefined && apiRoute) {
      return actionLoading[id] === apiRoute;
    }
    return isRefreshing || loading;
  };

  // Funzione per eseguire il refresh della lista
  const refreshData = async () => {
    if (isDev) return;
    setIsRefreshing(true);
    try {
      const fresh = await axiosInstanceClient.post("/postApi", { apiRoute: "schedule_list" }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setResponseData(fresh.data);
    } catch (err: any) {
      console.error("Errore durante il refresh:", err);
    } finally {
      setIsRefreshing(false);
    }
  };


  // Funzioni helper per il design
  const getScheduleTypeLabel = (type: string) => {
    const types = {
      'O': 'Once',
      'I': 'Interval',
      'H': 'Hourly',
      'D': 'Daily',
      'W': 'Weekly',
      'M': 'Monthly'
    };
    return types[type as keyof typeof types] || type;
  };

  const getScheduleTypeIcon = (type: string) => {
    switch (type) {
      case 'O': return <PlayCircle className="w-4 h-4" />;
      case 'I': return <Repeat className="w-4 h-4" />;
      case 'H': return <Clock className="w-4 h-4" />;
      case 'D': case 'W': case 'M': return <Calendar className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const formatJsonString = (str: string) => {
      try {
          // Trasforma il formato Python in JSON standard
          const jsonValid = str
              .replace(/'/g, '"') // Apici singoli -> doppi
              .replace(/True/g, "true") // Booleani Python -> JSON
              .replace(/False/g, "false")
              .replace(/None/g, "null");

          return JSON.stringify(JSON.parse(jsonValid), null, 2);
      } catch (e) {
          return str; // Ritorna l'originale se il parsing fallisce
      }
  };

  const cleanPythonString = (str: string) => {
      return str
          .replace(/'/g, '"') // Apici singoli -> doppi
          .replace(/True/g, "true") // True -> true
          .replace(/False/g, "false") // False -> false
          .replace(/None/g, "null"); // None -> null
  };

  const formatNextRun = (nextRun: string | null) => {
    if (!nextRun) return 'Non schedulato';
    try {
      const date = new Date(nextRun.includes('T') ? nextRun : nextRun + 'T00:00:00');
      
      if (isNaN(date.getTime())) {
          return nextRun; 
      }

      return date.toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return nextRun;
    }
  };

  const getStatusIcon = (schedule: Schedule) => {
    const isActive = !!schedule.next_run;
    const output = schedule.output?.toLowerCase() || '';

    if (output.includes('error') || output.includes('failed')) {
      return <XCircle className="w-5 h-5 text-red-600" />;
    }
    
    // Mostra un loader se l'azione in corso è "run_now"
    if (actionLoading[schedule.id] === 'schedule_run_now') {
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    }

    if (output.includes('running')) {
      return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    }

    return isActive ?
      <CheckCircle className="w-5 h-5 text-green-600" /> :
      <XCircle className="w-5 h-5 text-red-600" />;
  };

  const callApiAction = async (apiRoute: string, schedule?: any) => {
    const scheduleId = schedule?.id || Date.now();
    setActionLoading(prev => ({ ...prev, [scheduleId]: apiRoute }));
    
    setEditingId(null);

    try {
      let payload: any = { apiRoute };

      if (apiRoute === "schedule_save") {
        payload.schedule = schedule;
      } else if (apiRoute === "run_function") {
        payload.func = schedule?.func;
      } else {
        payload.id = schedule?.id ?? scheduleId;
      }

      const response = await axiosInstanceClient.post("/postApi", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      setBackendResponse({
        apiRoute,
        status: response.data.success ? response.data.success : 'success',
        data: response.data ? response.data : null,
      });

      toast.success(response.data.message || "Azione completata con successo");

      await refreshData();
    } catch (err: any) {
      toast.error(err?.message || "Azione completata con errore");
      setBackendError(err?.message || "Errore generico dal backend");
      setBackendResponse({
        apiRoute,
        status: "error",
        data: err?.response?.data || null,
      });
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[scheduleId];
        return newState;
      });
    } finally {
      if (!isRefreshing) {
          setActionLoading(prev => {
              const newState = { ...prev };
              delete newState[scheduleId];
              return newState;
          });
      }
    }
  };

  const handleSave = (schedule: Schedule) => callApiAction("schedule_save", schedule);
  const handleToggle = (schedule: Schedule) => callApiAction("schedule_toggle", { id: schedule.id });
  const handleRunNow = (schedule: Schedule) => callApiAction("schedule_run_now", { id: schedule.id });
  const handleRunFunction = (schedule: Schedule) => callApiAction("run_function", { func: schedule.func });
  const handleDelete = (schedule: Schedule) => callApiAction("schedule_delete", { id: schedule.id });
  const handleAdd = () => callApiAction("schedule_add", {});

  const handleFieldChange = (id: number, field: string, value: any) => {
    setResponseData(prev => ({
      ...prev,
      schedules: prev.schedules.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const handleCopyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      toast.success("Copiato negli appunti");
  };

  const intervalScheduleCount = schedules.filter(s => s.schedule_type === 'I').length;

  const deepParseJSON = (obj: any): any => {
    if (typeof obj === "string") {
      try {
        const parsed = JSON.parse(obj);
        // Se il parsing ha successo, chiama ricorsivamente
        return deepParseJSON(parsed);
      } catch {
        return obj; // non è JSON valido, restituisci com’è
      }
    } else if (Array.isArray(obj)) {
      return obj.map(item => deepParseJSON(item));
    } else if (obj && typeof obj === "object") {
      const result: any = {};
      for (const key of Object.keys(obj)) {
        result[key] = deepParseJSON(obj[key]);
      }
      return result;
    }
    return obj;
  };

  const renderOutput = (output: string | undefined) => {
      if (!output)
          return <span className="text-slate-400 italic">Nessun output</span>;

      let parsedOutput: any;
      let isJson = false;
      try {
          parsedOutput = JSON.parse(cleanPythonString(output));
          isJson = true;
      } catch (e) {
          parsedOutput = output;
      }

      const status = isJson
          ? parsedOutput.status?.toLowerCase() || "unknown"
          : "text";
      const message = isJson
          ? typeof parsedOutput.value === "object"
              ? parsedOutput.value?.message || JSON.stringify(parsedOutput.value)
              : parsedOutput.value || status
          : output;

      // Logica Colori Originale
      let colorClass = "bg-slate-100 text-slate-800 hover:bg-slate-200";
      if (status === "success")
          colorClass = "bg-green-100 text-green-800 hover:bg-green-200";
      else if (status === "error" || status === "failure")
          colorClass = "bg-red-100 text-red-800 hover:bg-red-200";
      else if (output.toLowerCase().includes("running") || status === "running")
          colorClass = "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";

      const openDetails = () => {
          setSelectedOutput(output);
          setIsOutputDialogOpen(true);
      };

      return (
          <div className="flex items-center space-x-2">
              <Badge
                  className={`cursor-pointer font-medium transition-all ${colorClass}`}
                  variant="secondary"
                  onClick={openDetails}
                  title="Clicca per i dettagli">
                  <span className="truncate max-w-[120px]">{message}</span>
              </Badge>
              <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-slate-400 hover:text-indigo-600"
                  onClick={openDetails}>
                  <ExternalLink className="h-3 w-3" />
              </Button>
          </div>
      );
  };

  return (
      <GenericComponent
          response={responseData}
          loading={loading}
          error={error}>
          {(response: SchedulerResponse) => (
              <>
                  <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
                      <div className="max-w-[90%] mx-auto">
                          {/* Header */}
                          <div className="mb-8">
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                      <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                                          Task Scheduler
                                      </h1>
                                      <Button
                                          onClick={refreshData}
                                          variant="ghost"
                                          size="sm"
                                          disabled={isLoadingOrRefreshing()}
                                          className="ml-4 h-8 w-8 p-0 text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                                          title="Aggiorna Lista">
                                          {isRefreshing ? (
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                              <RefreshCw className="w-4 h-4" />
                                          )}
                                      </Button>
                                  </div>
                                  <Button
                                      onClick={handleAdd}
                                      disabled={isLoadingOrRefreshing(
                                          0,
                                          "schedule_add"
                                      )}
                                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-200">
                                      {isLoadingOrRefreshing(
                                          0,
                                          "schedule_add"
                                      ) ? (
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      ) : (
                                          <Plus className="w-4 h-4 mr-2" />
                                      )}
                                      Aggiungi Task
                                  </Button>
                              </div>
                              <p className="text-slate-600 mt-2">
                                  Gestisci e monitora le tue attività
                                  automatizzate
                              </p>
                          </div>

                          {/* Stats Cards - Nessun problema di whitespace qui */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                                  <CardContent className="p-6">
                                      <div className="flex items-center justify-between">
                                          <div>
                                              <p className="text-sm font-medium text-slate-600">
                                                  Total Tasks
                                              </p>
                                              <p className="text-3xl font-bold text-slate-900">
                                                  {schedules.length}
                                              </p>
                                          </div>
                                          <div className="p-3 bg-blue-100 rounded-full">
                                              <Settings className="w-6 h-6 text-blue-600" />
                                          </div>
                                      </div>
                                  </CardContent>
                              </Card>

                              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                                  <CardContent className="p-6">
                                      <div className="flex items-center justify-between">
                                          <div>
                                              <p className="text-sm font-medium text-slate-600">
                                                  Active
                                              </p>
                                              <p className="text-3xl font-bold text-green-600">
                                                  {
                                                      schedules.filter(
                                                          (s) => s.next_run
                                                      ).length
                                                  }
                                              </p>
                                          </div>
                                          <div className="p-3 bg-green-100 rounded-full">
                                              <CheckCircle className="w-6 h-6 text-green-600" />
                                          </div>
                                      </div>
                                  </CardContent>
                              </Card>

                              <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-200">
                                  <CardContent className="p-6">
                                      <div className="flex items-center justify-between">
                                          <div>
                                              <p className="text-sm font-medium text-slate-600">
                                                  Interval Tasks
                                              </p>
                                              <p className="text-3xl font-bold text-red-600">
                                                  {intervalScheduleCount}
                                              </p>
                                          </div>
                                          <div className="p-3 bg-red-100 rounded-full">
                                              <Repeat className="w-6 h-6 text-red-600" />
                                          </div>
                                      </div>
                                  </CardContent>
                              </Card>
                          </div>

                          {(backendResponse || backendError) && (
                              <Card className="mb-8 border-0 shadow-md bg-white/80 backdrop-blur-sm">
                                  <CardHeader
                                      className={`border-b ${
                                          backendResponse?.status === "error"
                                              ? "bg-red-50"
                                              : "bg-green-50"
                                      }`}>
                                      <CardTitle className="flex items-center text-slate-800">
                                          {backendResponse?.status ===
                                          "error" ? (
                                              <XCircle className="w-5 h-5 text-red-600 mr-2" />
                                          ) : (
                                              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                                          )}
                                          {backendResponse?.status === "error"
                                              ? "Errore Backend"
                                              : "Risposta Backend"}
                                      </CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-4 text-sm text-slate-700">
                                      <p className="mb-2">
                                          <span className="font-semibold text-slate-900">
                                              API Route:
                                          </span>{" "}
                                          {backendResponse?.apiRoute || "—"}
                                      </p>

                                      {backendError && (
                                          <p className="text-red-600 mb-2 font-medium">
                                              {backendError}
                                          </p>
                                      )}

                                      {backendResponse?.data && (
                                          <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto text-xs text-slate-600">
                                              {JSON.stringify(
                                                  deepParseJSON(
                                                      backendResponse.data
                                                  ),
                                                  null,
                                                  2
                                              )}
                                          </pre>
                                      )}

                                      <div className="flex justify-end mt-3">
                                          <Button
                                              variant="ghost"
                                              size="sm"
                                              className="text-slate-600 hover:text-slate-900"
                                              onClick={() => {
                                                  setBackendResponse(null);
                                                  setBackendError(null);
                                              }}>
                                              Chiudi
                                          </Button>
                                      </div>
                                  </CardContent>
                              </Card>
                          )}

                          {/* Scheduler Table */}
                          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                              <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
                                  <CardTitle className="text-xl font-semibold text-slate-800 flex items-center">
                                      <Calendar className="w-5 h-5 mr-2" />
                                      Scheduled Tasks
                                  </CardTitle>
                              </CardHeader>
                              <CardContent className="p-0">
                                  <div className="overflow-x-auto max-w-full">
                                      {/* INIZIO CORREZIONE WHITESPACE */}
                                      <table className="w-full min-w-[1000px]">
                                          <thead className="bg-slate-50 border-b sticky top-0 z-10">
                                              <tr>
                                                  <th className="text-left p-3 font-semibold text-slate-700 min-w-[180px]">
                                                      Nome Task
                                                  </th>
                                                  <th className="text-left p-3 font-semibold text-slate-700 min-w-[200px]">
                                                      Funzione
                                                  </th>
                                                  <th className="text-left p-3 font-semibold text-slate-700 min-w-[160px]">
                                                      Tipo Schedula
                                                  </th>
                                                  <th className="text-left p-3 font-semibold text-slate-700 min-w-[80px]">
                                                      Minuti
                                                  </th>
                                                  <th className="text-left p-3 font-semibold text-slate-700 min-w-[200px]">
                                                      Prossima Esecuzione
                                                  </th>
                                                  <th className="text-left p-3 font-semibold text-slate-700 min-w-[120px]">
                                                      Ripetizioni
                                                  </th>
                                                  <th className="text-center p-3 font-semibold text-slate-700 min-w-[80px]">
                                                      Stato
                                                  </th>
                                                  <th className="text-left p-3 font-semibold text-slate-700 min-w-[150px]">
                                                      Output
                                                  </th>
                                                  <th className="text-left p-3 font-semibold text-slate-700 min-w-[150px]">
                                                      Send to Endpoint
                                                  </th>
                                                  <th className="text-left p-3 font-semibold text-slate-700 min-w-[150px]">
                                                      Save Monitoring
                                                  </th>
                                                  <th className="text-center p-3 font-semibold text-slate-700 min-w-[200px] sticky right-0 bg-slate-100 border-l">
                                                      Azioni
                                                  </th>
                                              </tr>
                                          </thead>
                                          <tbody>
                                              {schedules.map((s, index) => (
                                                  <tr
                                                      key={s.id}
                                                      className={`border-b hover:bg-slate-50/50 transition-colors ${
                                                          index % 2 === 0
                                                              ? "bg-white"
                                                              : "bg-slate-25"
                                                      }`}>
                                                      <td className="p-3">
                                                          <Input
                                                              value={s.name}
                                                              onChange={(e) =>
                                                                  handleFieldChange(
                                                                      s.id,
                                                                      "name",
                                                                      e.target
                                                                          .value
                                                                  )
                                                              }
                                                              className="w-full font-medium border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md"
                                                              placeholder="Nome del task"
                                                          />
                                                      </td>
                                                      <td className="p-3">
                                                          <Select
                                                              value={s.func}
                                                              onValueChange={(
                                                                  val
                                                              ) =>
                                                                  handleFieldChange(
                                                                      s.id,
                                                                      "func",
                                                                      val
                                                                  )
                                                              }>
                                                              <SelectTrigger className="w-full border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md">
                                                                  <div className="flex items-left text-left space-x-2 max-w-[300px] truncate">
                                                                      <SelectValue
                                                                          placeholder="Seleziona funzione"
                                                                          className="truncate"
                                                                      />
                                                                  </div>
                                                              </SelectTrigger>
                                                              <SelectContent>
                                                                  {available_tasks.length >
                                                                  0 ? (
                                                                      available_tasks.map(
                                                                          (
                                                                              t,
                                                                              idx
                                                                          ) => (
                                                                              <SelectItem
                                                                                  key={
                                                                                      t[0]
                                                                                  }
                                                                                  value={
                                                                                      t[0]
                                                                                  }
                                                                                  title={
                                                                                      t[2] ||
                                                                                      ""
                                                                                  }
                                                                                  className="hover:bg-slate-100 cursor-pointer rounded-md px-2 py-1">
                                                                                  <div className="flex flex-col">
                                                                                      <span className="font-medium text-black">
                                                                                          {
                                                                                              t[1]
                                                                                          }
                                                                                      </span>
                                                                                      {t[2] && (
                                                                                          <span className="text-xs text-slate-500">
                                                                                              {
                                                                                                  t[2]
                                                                                              }
                                                                                          </span>
                                                                                      )}
                                                                                  </div>
                                                                              </SelectItem>
                                                                          )
                                                                      )
                                                                  ) : (
                                                                      <SelectItem
                                                                          key="no-tasks"
                                                                          value=""
                                                                          disabled>
                                                                          <span className="text-slate-400">
                                                                              Nessuna
                                                                              funzione
                                                                              disponibile
                                                                          </span>
                                                                      </SelectItem>
                                                                  )}
                                                              </SelectContent>
                                                          </Select>
                                                      </td>
                                                      <td className="p-3">
                                                          <div className="space-y-2">
                                                              <Select
                                                                  value={
                                                                      s.schedule_type ||
                                                                      "O"
                                                                  }
                                                                  onValueChange={(
                                                                      val
                                                                  ) =>
                                                                      handleFieldChange(
                                                                          s.id,
                                                                          "schedule_type",
                                                                          val
                                                                      )
                                                                  }>
                                                                  <SelectTrigger className="w-full border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md">
                                                                      <div className="flex items-center space-x-2">
                                                                          <SelectValue
                                                                              placeholder={getScheduleTypeLabel(
                                                                                  s.schedule_type ||
                                                                                      "O"
                                                                              )}
                                                                          />
                                                                      </div>
                                                                  </SelectTrigger>
                                                                  <SelectContent>
                                                                      <SelectItem value="O">
                                                                          <div className="flex items-center space-x-2">
                                                                              <PlayCircle className="w-4 h-4" />
                                                                              <span>
                                                                                  Una
                                                                                  Volta
                                                                                  (Once)
                                                                              </span>
                                                                          </div>
                                                                      </SelectItem>
                                                                      <SelectItem value="I">
                                                                          <div className="flex items-center space-x-2">
                                                                              <Repeat className="w-4 h-4" />
                                                                              <span>
                                                                                  Intervallo
                                                                                  (Interval)
                                                                              </span>
                                                                          </div>
                                                                      </SelectItem>
                                                                      <SelectItem value="H">
                                                                          <div className="flex items-center space-x-2">
                                                                              <Clock className="w-4 h-4" />
                                                                              <span>
                                                                                  Ogni
                                                                                  Ora
                                                                                  (Hourly)
                                                                              </span>
                                                                          </div>
                                                                      </SelectItem>
                                                                      <SelectItem value="D">
                                                                          <div className="flex items-center space-x-2">
                                                                              <Calendar className="w-4 h-4" />
                                                                              <span>
                                                                                  Giornaliero
                                                                                  (Daily)
                                                                              </span>
                                                                          </div>
                                                                      </SelectItem>
                                                                      <SelectItem value="W">
                                                                          <div className="flex items-center space-x-2">
                                                                              <Calendar className="w-4 h-4" />
                                                                              <span>
                                                                                  Settimanale
                                                                                  (Weekly)
                                                                              </span>
                                                                          </div>
                                                                      </SelectItem>
                                                                      <SelectItem value="M">
                                                                          <div className="flex items-center space-x-2">
                                                                              <Calendar className="w-4 h-4" />
                                                                              <span>
                                                                                  Mensile
                                                                                  (Monthly)
                                                                              </span>
                                                                          </div>
                                                                      </SelectItem>
                                                                  </SelectContent>
                                                              </Select>
                                                          </div>
                                                      </td>
                                                      <td className="p-3">
                                                          {s.schedule_type ===
                                                          "I" ? (
                                                              <Input
                                                                  type="number"
                                                                  min={1}
                                                                  value={
                                                                      s.minutes ??
                                                                      1
                                                                  }
                                                                  onChange={(
                                                                      e
                                                                  ) =>
                                                                      handleFieldChange(
                                                                          s.id,
                                                                          "minutes",
                                                                          Number(
                                                                              e
                                                                                  .target
                                                                                  .value
                                                                          )
                                                                      )
                                                                  }
                                                                  className="w-full border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md text-center font-medium"
                                                                  placeholder="60"
                                                              />
                                                          ) : (
                                                              <div className="text-center text-slate-400 italic">
                                                                  N/A
                                                              </div>
                                                          )}
                                                      </td>
                                                      <td className="p-3">
                                                          {editingId ===
                                                          s.id ? (
                                                              <div className="space-y-2">
                                                                  <Input
                                                                      type="datetime-local"
                                                                      value={
                                                                          s.display_next_run ??
                                                                          ""
                                                                      }
                                                                      onChange={(
                                                                          e
                                                                      ) =>
                                                                          handleFieldChange(
                                                                              s.id,
                                                                              "display_next_run",
                                                                              e
                                                                                  .target
                                                                                  .value
                                                                          )
                                                                      }
                                                                      onBlur={() =>
                                                                          setEditingId(
                                                                              null
                                                                          )
                                                                      }
                                                                      className="w-full border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md text-sm"
                                                                      autoFocus
                                                                  />
                                                                  <p className="text-xs text-slate-500 font-medium px-1">
                                                                      Valore
                                                                      salvato:{" "}
                                                                      {formatNextRun(
                                                                          s.next_run
                                                                      )}
                                                                  </p>
                                                              </div>
                                                          ) : (
                                                              <div
                                                                  onClick={() =>
                                                                      setEditingId(
                                                                          s.id
                                                                      )
                                                                  }
                                                                  className="cursor-pointer hover:bg-slate-100 p-1 rounded-md transition-colors"
                                                                  title="Clicca per modificare la prossima esecuzione">
                                                                  <div className="flex items-center space-x-2 font-medium text-slate-700">
                                                                      {getScheduleTypeIcon(
                                                                          s.schedule_type ||
                                                                              "O"
                                                                      )}
                                                                      <span className="truncate">
                                                                          {formatNextRun(
                                                                              s.display_next_run ||
                                                                                  s.next_run
                                                                          )}
                                                                      </span>
                                                                  </div>
                                                                  <p className="text-xs text-slate-500 mt-1">
                                                                      {s.next_run
                                                                          ? "Clicca per aggiornare la data"
                                                                          : "Non schedulato. Clicca per impostare."}
                                                                  </p>
                                                              </div>
                                                          )}
                                                      </td>
                                                      <td className="p-3">
                                                          <div className="space-y-2">
                                                              <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
                                                                  <input
                                                                      type="checkbox"
                                                                      checked={
                                                                          s.repeats <
                                                                          0
                                                                      }
                                                                      onChange={(
                                                                          e
                                                                      ) =>
                                                                          handleFieldChange(
                                                                              s.id,
                                                                              "repeats",
                                                                              e
                                                                                  .target
                                                                                  .checked
                                                                                  ? -1
                                                                                  : 1
                                                                          )
                                                                      }
                                                                      className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                                                                  />
                                                                  <span className="text-slate-700">
                                                                      Infinito
                                                                  </span>
                                                              </label>
                                                              {s.repeats >=
                                                                  0 && (
                                                                  <Input
                                                                      type="number"
                                                                      value={
                                                                          s.repeats
                                                                      }
                                                                      onChange={(
                                                                          e
                                                                      ) =>
                                                                          handleFieldChange(
                                                                              s.id,
                                                                              "repeats",
                                                                              Number(
                                                                                  e
                                                                                      .target
                                                                                      .value
                                                                              )
                                                                          )
                                                                      }
                                                                      min={0}
                                                                      className="w-full border border-slate-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-md text-center font-medium"
                                                                      placeholder="1"
                                                                  />
                                                              )}
                                                          </div>
                                                      </td>
                                                      <td className="p-3 text-center">
                                                          <div className="flex justify-center">
                                                              {getStatusIcon(s)}
                                                          </div>
                                                      </td>
                                                      <td className="p-3">
                                                          <div className="flex justify-start">
                                                              {renderOutput(
                                                                  s.output
                                                              )}
                                                          </div>
                                                      </td>
                                                      <td className="p-3">
                                                          <div className="flex justify-start">
                                                              <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
                                                                  <input
                                                                      type="checkbox"
                                                                      checked={
                                                                          !!s.send_to_endpoint
                                                                      }
                                                                      onChange={(
                                                                          e
                                                                      ) =>
                                                                          handleFieldChange(
                                                                              s.id,
                                                                              "send_to_endpoint",
                                                                              e
                                                                                  .target
                                                                                  .checked
                                                                          )
                                                                      }
                                                                      className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                                                                  />
                                                                  <span className="text-slate-700">
                                                                      Invia
                                                                      all'endpoint
                                                                  </span>
                                                              </label>
                                                          </div>
                                                      </td>
                                                      <td className="p-3">
                                                          <div className="flex justify-start">
                                                              <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
                                                                  <input
                                                                      type="checkbox"
                                                                      checked={
                                                                          !!s.save_monitoring
                                                                      }
                                                                      onChange={(
                                                                          e
                                                                      ) =>
                                                                          handleFieldChange(
                                                                              s.id,
                                                                              "save_monitoring",
                                                                              e
                                                                                  .target
                                                                                  .checked
                                                                          )
                                                                      }
                                                                      className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 focus:ring-2"
                                                                  />
                                                                  <span className="text-slate-700">
                                                                      Salva
                                                                      monitoring
                                                                  </span>
                                                              </label>
                                                          </div>
                                                      </td>
                                                      <td className="p-3 sticky right-0 bg-gray-50 border-l">
                                                          <div className="flex justify-center space-x-1">
                                                              <Button
                                                                  onClick={() =>
                                                                      handleSave(
                                                                          s
                                                                      )
                                                                  }
                                                                  variant="ghost"
                                                                  size="sm"
                                                                  disabled={isLoadingOrRefreshing(
                                                                      s.id,
                                                                      "schedule_save"
                                                                  )}
                                                                  className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                                                                  title="Salva">
                                                                  {isLoadingOrRefreshing(
                                                                      s.id,
                                                                      "schedule_save"
                                                                  ) ? (
                                                                      <Loader2 className="w-4 h-4 animate-spin" />
                                                                  ) : (
                                                                      <Save className="w-4 h-4" />
                                                                  )}
                                                              </Button>
                                                              <Button
                                                                  onClick={() =>
                                                                      handleToggle(
                                                                          s
                                                                      )
                                                                  }
                                                                  variant="ghost"
                                                                  size="sm"
                                                                  disabled={isLoadingOrRefreshing(
                                                                      s.id,
                                                                      "schedule_toggle"
                                                                  )}
                                                                  className={`h-8 w-8 p-0 ${
                                                                      s.next_run
                                                                          ? "hover:bg-red-100 hover:text-red-600"
                                                                          : "hover:bg-green-100 hover:text-green-600"
                                                                  }`}
                                                                  title={
                                                                      s.next_run
                                                                          ? "Disattiva"
                                                                          : "Attiva"
                                                                  }>
                                                                  {isLoadingOrRefreshing(
                                                                      s.id,
                                                                      "schedule_toggle"
                                                                  ) ? (
                                                                      <Loader2 className="w-4 h-4 animate-spin" />
                                                                  ) : (
                                                                      <Power className="w-4 h-4" />
                                                                  )}
                                                              </Button>
                                                              <Button
                                                                  onClick={() =>
                                                                      handleRunNow(
                                                                          s
                                                                      )
                                                                  }
                                                                  variant="ghost"
                                                                  size="sm"
                                                                  disabled={isLoadingOrRefreshing(
                                                                      s.id,
                                                                      "schedule_run_now"
                                                                  )}
                                                                  className="h-8 w-8 p-0 hover:bg-green-100 hover:text-green-600"
                                                                  title="Avvia il task pianificato ora">
                                                                  {isLoadingOrRefreshing(
                                                                      s.id,
                                                                      "schedule_run_now"
                                                                  ) ? (
                                                                      <Loader2 className="w-4 h-4 animate-spin" />
                                                                  ) : (
                                                                      <PlayCircle className="w-4 h-4" />
                                                                  )}
                                                              </Button>
                                                              <Button
                                                                  onClick={() =>
                                                                      handleRunFunction(
                                                                          s
                                                                      )
                                                                  }
                                                                  variant="ghost"
                                                                  size="sm"
                                                                  disabled={isLoadingOrRefreshing(
                                                                      s.id,
                                                                      "run_function"
                                                                  )}
                                                                  className="h-8 w-8 p-0 hover:bg-yellow-100 hover:text-yellow-600"
                                                                  title="Esegui ora la funzione python">
                                                                  {isLoadingOrRefreshing(
                                                                      s.id,
                                                                      "run_function"
                                                                  ) ? (
                                                                      <Loader2 className="w-4 h-4 animate-spin" />
                                                                  ) : (
                                                                      <Play className="w-4 h-4" />
                                                                  )}
                                                              </Button>
                                                              <Button
                                                                  onClick={() =>
                                                                      handleDelete(
                                                                          s
                                                                      )
                                                                  }
                                                                  variant="ghost"
                                                                  size="sm"
                                                                  disabled={isLoadingOrRefreshing(
                                                                      s.id,
                                                                      "schedule_delete"
                                                                  )}
                                                                  className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                                                                  title="Elimina">
                                                                  {isLoadingOrRefreshing(
                                                                      s.id,
                                                                      "schedule_delete"
                                                                  ) ? (
                                                                      <Loader2 className="w-4 h-4 animate-spin" />
                                                                  ) : (
                                                                      <Trash2 className="w-4 h-4" />
                                                                  )}
                                                              </Button>
                                                          </div>
                                                      </td>
                                                  </tr>
                                              ))}
                                          </tbody>
                                      </table>
                                      {/* FINE CORREZIONE WHITESPACE */}
                                  </div>

                                  {schedules.length === 0 && (
                                      <div className="text-center py-12">
                                          <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                          <h3 className="text-lg font-medium text-slate-600 mb-2">
                                              Nessun task schedulato
                                          </h3>
                                          <p className="text-slate-500 mb-4">
                                              Inizia aggiungendo il tuo primo
                                              task automatizzato
                                          </p>
                                          <Button
                                              onClick={handleAdd}
                                              className="bg-blue-600 hover:bg-blue-700">
                                              <Plus className="w-4 h-4 mr-2" />
                                              Aggiungi Task
                                          </Button>
                                      </div>
                                  )}
                              </CardContent>
                          </Card>
                      </div>
                  </div>
                  <Dialog
                      open={isOutputDialogOpen}
                      onOpenChange={setIsOutputDialogOpen}>
                      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col bg-white">
                          <DialogHeader className="border-b pb-4">
                              <DialogTitle className="flex justify-between items-center pr-10">
                                  <span className="text-xl font-bold">
                                      Dettaglio Output
                                  </span>
                                  <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                          handleCopyToClipboard(
                                              selectedOutput || ""
                                          )
                                      }>
                                      <Copy className="h-4 w-4 mr-2" /> Copia
                                      JSON
                                  </Button>
                              </DialogTitle>
                          </DialogHeader>

                          <div className="flex-1 overflow-y-auto mt-4 rounded-lg border bg-slate-950 p-4">
                              <pre className="text-sm font-mono text-blue-300 whitespace-pre-wrap break-all leading-relaxed">
                                  {selectedOutput
                                      ? formatJsonString(selectedOutput)
                                      : "Nessun dato"}
                              </pre>
                          </div>

                          <DialogFooter className="pt-4 border-t">
                              <Button
                                  onClick={() => setIsOutputDialogOpen(false)}>
                                  Chiudi
                              </Button>
                          </DialogFooter>
                      </DialogContent>
                  </Dialog>
              </>
          )}
      </GenericComponent>
  );
}