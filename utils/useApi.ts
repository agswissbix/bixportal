import { useEffect, useState, useMemo } from 'react';
import { consoleDebug } from '@/utils/develop';
import axios from 'axios';

export const useApi = <T>(
    payload: Record<string, any> | null
) => {
    const [response, setResponse] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [elapsedTime, setElapsedTime] = useState<number | null>(null);

    const serializedPayload = useMemo(() => JSON.stringify(payload), [payload]);

    useEffect(() => {
        // Se il payload non è valido, semplicemente attendi senza fare nulla.
        // Non modificare lo stato di loading.
        if (!payload) {
            // ★ LA MODIFICA CHIAVE: Abbiamo rimosso setLoading(false) da qui.
            return;
        }

        const controller = new AbortController();

        const fetchData = async () => {
            const startTime = performance.now();
            setLoading(true);
            setError(null);
            
            try {
                const currentPayload = JSON.parse(serializedPayload);
                consoleDebug('Fetching data with payload:', currentPayload);

                const res = await axios.post<T>('/postApi', currentPayload, {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    withCredentials: true,
                    signal: controller.signal,
                });

                setResponse(res.data);

            } catch (err: any) {
                if (axios.isCancel(err)) {
                    console.log('Request canceled:', err.message);
                } else {
                    setError(err.message || 'Errore durante il recupero dei dati');
                }
            } finally {
                const timeTaken = performance.now() - startTime;
                setElapsedTime(timeTaken);
                if (!controller.signal.aborted) setLoading(false);
            }
        };

        fetchData();

        return () => {
            controller.abort();
        };

    }, [serializedPayload]);

    return { response, loading, error, elapsedTime };
};