import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import _ from 'lodash';
import { useApi } from '@/utils/useApi';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { useRecordsStore } from './records/recordsStore';
import { Plus,ExternalLink } from 'lucide-react';

interface PropsInterface {
  initialValue?: string;
  onChange?: (value: string) => void;
  tableid?: string;
  linkedmaster_tableid?: string;
  linkedmaster_recordid: string;
  fieldid: string;
  valuecode?: { code: string; value: string };
  formValues: Record<string, any>;
}

interface LinkedItem {
  recordid: string;
  name: string;
}

interface LinkedMaster {
  linkeditems: LinkedItem[];
}

// Simulate API call - replace with your actual API call
const fetchLinkedItems = async (searchTerm: string, linkedmaster_tableid: string, tableid: string, fieldid: string, formValues: Record<string, any>): Promise<LinkedItem[]> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  const payload = {
    apiRoute: "get_input_linked",
    fieldid: fieldid,
    tableid: tableid,
    linkedmaster_tableid: linkedmaster_tableid,
    searchTerm: searchTerm,
    formValues: formValues,
  };
  const res = await axiosInstanceClient.post('/postApi/', payload, {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  // Mock data - replace with actual API call
  return res.data;
};

export default function inputLinked({ initialValue='',onChange,linkedmaster_tableid,linkedmaster_recordid,tableid,fieldid,valuecode,formValues }: PropsInterface) {
  const [value, setValue] = useState(valuecode?.value ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<LinkedItem[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { handleRowClick } = useRecordsStore();

  linkedmaster_tableid = linkedmaster_tableid ? String(linkedmaster_tableid) : '';

  const formValuesRef = useRef(formValues);
  useEffect(() => {
    formValuesRef.current = formValues;
  }, [formValues]);

  const debouncedSearch = useRef(
    _.debounce(async (searchTerm: string) => {
      setLoading(true);
      setError(null);
      try {
        if (linkedmaster_tableid && tableid) {
          const results = await fetchLinkedItems(
            searchTerm,
            linkedmaster_tableid,
            tableid,
            fieldid,
            formValuesRef.current,
          );
          setItems(results);
        } else {
          setError('Missing required parameters');
          setItems([]);
        }
      } catch {
        setError('Error fetching data');
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 300),
  ).current;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.info('handleChange');
    const newValue = e.target.value;
    setValue(newValue);
    setIsOpen(true);
    debouncedSearch(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
    setIsOpen(true);
    debouncedSearch('');
  };

  const handleSelectOption = (item: LinkedItem) => {
    console.info('handleSelectOption');
    setValue(item.name);
    setIsOpen(false);
    if (onChange) {
      onChange(item.recordid);
    }
  };
  console.info('test inputLinked:', valuecode);
  useEffect(() => {
        if(onChange && valuecode?.code){
          onChange(valuecode?.code);
        } 
      }, [valuecode?.code]);
      
  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="">
        <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
          
          <input
            name="word"
            type="text"
            value={value}
            onChange={handleChange}
            onFocus={handleFocus}
            autoComplete='off'
            placeholder=""
            className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
          />
          <button type="button" onClick={() => {
            if (linkedmaster_recordid && linkedmaster_tableid) {
              handleRowClick('linked', linkedmaster_recordid, linkedmaster_tableid);
            } else {
              console.error('Missing required parameters for handleRowClick');
            }
          }} className="p-2 text-tertiary hover:text-tertiaryHover focus:outline-none"><ExternalLink></ExternalLink></button>

          <button type="button" onClick={() => {
            if (linkedmaster_recordid && linkedmaster_tableid) {
              handleRowClick('','', linkedmaster_tableid );
            } else {
              console.error('Missing required parameters for handleRowClick');
            }
          }} className="p-2 text-tertiary hover:text-tertiaryHover focus:outline-none"><Plus></Plus></button>
</div>
      </div>
      
      {isOpen && (
        <div className="absolute w-full z-10 bg-white mt-1 border border-gray-300 rounded-md shadow-lg">
          {loading ? (
            <div className="flex items-center justify-center p-4 text-gray-500">
              <Loader2 className="animate-spin mr-2" size={20} />
              <span>Caricamento...</span>
            </div>
          ) : error ? (
            <div className="p-4 text-red-500 text-center">
              {error}
            </div>
          ) : (
            <div className="mt-2 max-h-60 overflow-y-auto">
              {items.length > 0 ? (
                items.map((item) => (
                  <div
                    key={item.recordid}
                    onMouseDown={(e) => {
                        e.preventDefault(); // Impedisce all'input di perdere il focus
                        handleSelectOption(item);
                      }}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <p className="text-sm text-gray-900">{item.name}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-gray-500 text-center">
                  Nessun risultato trovato
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

