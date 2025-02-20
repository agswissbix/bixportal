import { useEffect, useState } from 'react';
import { useRecordsStore } from '@/components/records/recordsStore';
import { consoleDebug } from '@/utils/develop';
import axios from 'axios';

export const useApi = <T>(
  payload: Record<string, any>
) => {
  console.info('useApi'); 
  const [response, setResponse] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshTable } = useRecordsStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        consoleDebug('Fetching data with payload:', payload);
        setLoading(true);
        setError(null);

        // Esegui una POST verso /postApi con axios
        const res = await axios.post<T>('/postApi', payload, {
          headers: {
            'Content-Type': 'application/json',
          },
          // Se vuoi includere i cookie (es. per CSRF) abilita le credenziali
          withCredentials: true,
        });

        // Se la risposta è andata a buon fine
        setResponse(res.data);
      } catch (err: any) {
        setError(err.message || 'Errore durante il recupero dei dati');
      } finally {
        setLoading(false);
      }
    };

    console.log('Fetching data with payload:', payload, 'refreshTable:', refreshTable);
    fetchData();
  }, [payload, refreshTable]);

  return { response, loading, error };
};
