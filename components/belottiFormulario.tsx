import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { PlusCircle, MinusCircle, Save } from 'lucide-react';
// import axiosInstanceClient from '@/utils/axiosInstanceClient'; // Non usato qui
import { useRecordsStore } from './records/recordsStore';

const isDev = false;

// Interfaces
interface PropsInterface {
  formType: string;
  onSaveOrder?: (orderData: any) => void;
}

interface ResponseInterface {
  formName: string;
  categories: {
    title: string;
    products: {
      id: string;
      name: string;
    }[];
  }[];
}

export default function BelottiFormulario({ formType, onSaveOrder }: PropsInterface) {
  // Stati per i campi del form
  const [order, setOrder] = useState<{ [key: string]: string }>({}); // Quantità
  const [diottrie, setDiottrie] = useState<{ [key: string]: string }>({}); // Generico, usato per LAC
  const [colori, setColori] = useState<{ [key: string]: string }>({}); // Usato da MERCE BELOTTI (select) e MERCE OAKLEY (input)

  // Stati specifici per MERCE OAKLEY
  const [boxdl, setBoxDl] = useState<{ [key: string]: string }>({});
  const [referenze, setReferenze] = useState<{ [key: string]: string }>({});
  const [raggi, setRaggi] = useState<{ [key: string]: string }>({});
  const [sphValues, setSphValues] = useState<{ [key: string]: string }>({});
  const [diametri, setDiametri] = useState<{ [key: string]: string }>({});

  const [responseData, setResponseData] = useState<ResponseInterface>({ formName: "", categories: [] });

  const payload = useMemo(() => ({
    apiRoute: 'get_form_data',
    formType: formType,
  }), [formType]);

  const { response, loading, error } = useApi<ResponseInterface>(payload);
  
  // Resetta gli stati quando cambia il formType per evitare di mantenere dati vecchi
  useEffect(() => {
    setOrder({});
    setDiottrie({});
    setColori({});
    setBoxDl({});
    setReferenze({});
    setRaggi({});
    setSphValues({});
    setDiametri({});
  }, [formType]);


  // Handlers generici per i campi input
  const createFieldHandler = (setter: React.Dispatch<React.SetStateAction<{ [key: string]: string; }>>) => 
    (productId: string, value: string) => {
      setter(prev => ({ ...prev, [productId]: value }));
    };

  const handleDiottriaChange = createFieldHandler(setDiottrie);
  const handleColoreChange = createFieldHandler(setColori);
  const handleBoxDlChange = createFieldHandler(setBoxDl);
  const handleReferenzaChange = createFieldHandler(setReferenze);
  const handleRaggioChange = createFieldHandler(setRaggi);
  const handleSphChange = createFieldHandler(setSphValues);
  const handleDiametroChange = createFieldHandler(setDiametri);

  const handleChange = (productId: string, value: string) => {
    if (value === "" || /^\d+$/.test(value)) { // Accetta solo numeri interi
      setOrder(prev => ({ ...prev, [productId]: value }));
    }
  };

  const incrementQuantity = (productId: string) => {
    const currentValue = parseInt(order[productId] || '0');
    handleChange(productId, (currentValue + 1).toString());
  };

  const decrementQuantity = (productId: string) => {
    const currentValue = parseInt(order[productId] || '0');
    if (currentValue > 0) {
      handleChange(productId, (currentValue - 1).toString());
    }
  };

  const getCompleteOrder = () => {
    const data = response || responseData;
    return data.categories.map((category) => ({
      title: category.title,
      products: category.products.map((p) => {
        const productData: any = {
          id: p.id,
          name: p.name,
          quantity: parseInt(order[p.id]) || 0,
          categoria: category.title,
          formType: formType,
        };

        // Aggiungi i campi condizionalmente
        if (formType === 'MERCE BELOTTI') {
          productData.colore = colori[p.id] || "";
        } else if (formType.includes('LAC')) { // Gestisce LAC, LAC COLORATE, etc.
          productData.diottria = diottrie[p.id] || "";
          productData.colore = colori[p.id] || "";
        } else if (formType === 'MERCE OAKLEY') {
          productData.boxdl = boxdl[p.id] || "";
          productData.referenza = referenze[p.id] || "";
          productData.colore = colori[p.id] || "";
          productData.raggio = raggi[p.id] || "";
          productData.sph = sphValues[p.id] || "";
          productData.diametro = diametri[p.id] || "";
        }

        return productData;
      }),
    }));
  };

  const handleSaveOrder = (e) => {
    e.preventDefault();
    const completeOrder = getCompleteOrder();

    if (onSaveOrder) {
      console.log("Dati inviati al padre:", completeOrder);
      onSaveOrder(completeOrder);
    }
  };

  useEffect(() => {
    if (response) {
      setResponseData(response);
    }
  }, [response]);

  return (
    <GenericComponent response={response || responseData} loading={loading} error={error}>
      {(data: ResponseInterface) => (
        <form className="w-full h-full flex flex-col overflow-hidden">
          <div className="bg-blue-800 text-white p-6">
            <h1 className="text-2xl font-bold text-center">{data.formName}</h1>
          </div>

          <div className="flex-grow overflow-auto p-2">
            {data.categories.map((category, idx) => (
              <div key={idx} className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-blue-800 border-b-2 border-blue-800 p-2">
                  {category.title}
                </h2>
                <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Codice</th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prodotto</th>
                        
                        {formType === 'MERCE BELOTTI' && (
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colore</th>
                        )}

                        {formType === 'MERCE OAKLEY' && (
                          <>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Box/DL</th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referenza</th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colore</th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raggio</th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SPH</th>
                            <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Diametro</th>
                          </>
                        )}
                        
                        <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantità</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {category.products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50">
                          <td className="px-2 py-4 text-sm font-medium text-blue-600">{product.id}</td>
                          <td className="px-2 py-4 text-sm text-gray-900">{product.name}</td>

                          {formType === 'MERCE BELOTTI' && (
                            <td className="px-2 py-4 text-sm">
                              <select className="w-full border rounded-md p-1 text-sm" value={colori[product.id] || ""} onChange={(e) => handleColoreChange(product.id, e.target.value)}>
                                <option value="">--</option>
                                <option value="Green">Green</option>
                                <option value="Gray">Gray</option>
                                {/* Aggiungi altre opzioni qui */}
                              </select>
                            </td>
                          )}
                          
                          {formType === 'MERCE OAKLEY' && (
                            <>
                              <td className="px-2 py-4 text-sm">
                                <select className="w-full border rounded-md p-1 text-sm" value={boxdl[product.id] || ""} onChange={(e) => handleBoxDlChange(product.id, e.target.value)}>
                                  <option value="">--</option>
                                  <option value="Box">Box</option>
                                  <option value="DL">DL</option>
                                </select>
                              </td>
                              <td className="px-2 py-4 text-sm">
                                <input type="text" className="w-full border rounded-md p-1 text-sm" value={referenze[product.id] || ""} onChange={(e) => handleReferenzaChange(product.id, e.target.value)} />
                              </td>
                              <td className="px-2 py-4 text-sm">
                                <input type="text" className="w-full border rounded-md p-1 text-sm" value={colori[product.id] || ""} onChange={(e) => handleColoreChange(product.id, e.target.value)} />
                              </td>
                              <td className="px-2 py-4 text-sm">
                                <input type="text" className="w-full border rounded-md p-1 text-sm" value={raggi[product.id] || ""} onChange={(e) => handleRaggioChange(product.id, e.target.value)} />
                              </td>
                              <td className="px-2 py-4 text-sm">
                                <input type="text" className="w-full border rounded-md p-1 text-sm" value={sphValues[product.id] || ""} onChange={(e) => handleSphChange(product.id, e.target.value)} />
                              </td>
                              <td className="px-2 py-4 text-sm">
                                <input type="text" className="w-full border rounded-md p-1 text-sm" value={diametri[product.id] || ""} onChange={(e) => handleDiametroChange(product.id, e.target.value)} />
                              </td>
                            </>
                          )}

                          <td className="px-2 py-4 text-sm text-gray-500">
                            <div className="flex items-center justify-end">
                              <button type="button" onClick={() => decrementQuantity(product.id)} className="text-gray-500 hover:text-red-500"><MinusCircle size={20} /></button>
                              <input type="text" className="mx-2 w-16 text-center border rounded-md p-1" value={order[product.id] || ""} onChange={(e) => handleChange(product.id, e.target.value)} />
                              <button type="button" onClick={() => incrementQuantity(product.id)} className="text-gray-500 hover:text-green-500"><PlusCircle size={20} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-100 p-4 border-t border-gray-200">
            <button type='button' className="flex items-center justify-center w-full gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm" onClick={handleSaveOrder}>
              <Save size={20} />
              <span>AGGIUNGI ALLA RICHIESTA</span>
            </button>
          </div>
        </form>
      )}
    </GenericComponent>
  );
}