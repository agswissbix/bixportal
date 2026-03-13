import { toast } from 'sonner';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { useRecordsStore } from '../components/records/recordsStore';

export const useRecordActions = () => {
  const setRefreshTable = useRecordsStore((state) => state.setRefreshTable);

  const duplicateRecordAction = async (tableid: string, recordid: string) => {
    const loadingToastId = toast.loading('Duplicazione in corso...');
    try {
      const response = await axiosInstanceClient.post(
        '/postApi',
        {
          apiRoute: 'duplicate_record',
          tableid,
          recordid,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      if (response?.data?.success == true) {
        toast.success('Record duplicato con successo', { id: loadingToastId });
        return response.data;
      } else {
        toast.error('Errore durante la duplicazione del record', { id: loadingToastId });
        return null;
      }
    } catch (err) {
      console.error('Errore durante la duplicazione del record', err);
      toast.error('Errore durante la duplicazione del record', { id: loadingToastId });
      return null;
    } finally {
      setRefreshTable(tableid);
    }
  };

  const deleteRecordAction = async (tableid: string, recordid: string) => {
    const loadingToastId = toast.loading('Eliminazione in corso...');
    try {
      await axiosInstanceClient.post(
        '/postApi',
        {
          apiRoute: 'delete_record',
          tableid,
          recordid,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      toast.success('Record eliminato con successo', { id: loadingToastId });
      return true;
    } catch (err) {
      console.error('Errore durante l\'eliminazione del record', err);
      toast.error('Errore durante l\'eliminazione del record', { id: loadingToastId });
      return false;
    } finally {
      setRefreshTable(tableid);
    }
  };

  return { duplicateRecordAction, deleteRecordAction };
};
