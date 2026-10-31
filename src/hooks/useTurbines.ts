import { useState, useEffect } from 'react';
import { TurbineSummary } from '../types/turbine';
import { TurbineService } from '../services/turbineService';

/**
 * Türbin verilerini çeken ve yöneten custom hook taslağı
 * Aşama 2'de canlı polling döngüsü ve filtreleme mantığı eklenecektir.
 */
export function useTurbines() {
  const [turbines, setTurbines] = useState<TurbineSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchInitialData() {
      try {
        setLoading(true);
        const data = await TurbineService.getTurbines();
        if (isMounted) {
          setTurbines(data);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Veri çekilemedi');
          setLoading(false);
        }
      }
    }

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  return { turbines, loading, error };
}

