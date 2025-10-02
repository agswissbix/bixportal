import React, { useMemo, useContext, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
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

// **MODIFICA 1: Aggiunta di _uniqueId all'interfaccia del prodotto per chiarezza**
interface ProductInterface {
  id: string;
  name: string;
  _uniqueId?: string; // ID univoco generato internamente
}

interface ResponseInterface {
  formName: string;
  categories: {
    title: string;
    products: ProductInterface[];
  }[];
}

function BelottiFormulario({ formType, onSaveOrder }: PropsInterface, ref) {
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

  // **MODIFICA 2: Aggiunto stato per i dati processati**
  // responseData è stato rinominato in processedData per maggiore chiarezza
  const [processedData, setProcessedData] = useState<ResponseInterface>({ formName: "", categories: [] });

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
    // Resetta anche i dati processati
    setProcessedData({ formName: "", categories: [] });
  }, [formType]);

  useImperativeHandle(ref, () => ({
    // **MODIFICA 3: Usare l'identificatore univoco per il reset**
    resetProduct: (item) => {
      const uniqueId = item._uniqueId;
      if (!uniqueId) return; // Sicurezza
      setOrder((prev) => ({ ...prev, [uniqueId]: "0" }));
      setDiottrie((prev) => ({ ...prev, [uniqueId]: "" }));
      setColori((prev) => ({ ...prev, [uniqueId]: "" }));
      setBoxDl((prev) => ({ ...prev, [uniqueId]: "" }));
      setReferenze((prev) => ({ ...prev, [uniqueId]: "" }));
      setRaggi((prev) => ({ ...prev, [uniqueId]: "" }));
      setSphValues((prev) => ({ ...prev, [uniqueId]: "" }));
      setDiametri((prev) => ({ ...prev, [uniqueId]: "" }));
    }
  }));

  // Handlers generici per i campi input
  // Non serve modificarli, perché ricevono già l'ID corretto
  const createFieldHandler = (setter: React.Dispatch<React.SetStateAction<{ [key: string]: string; }>>) => 
    (uniqueProductId: string, value: string) => {
      setter(prev => ({ ...prev, [uniqueProductId]: value }));
    };

  const handleDiottriaChange = createFieldHandler(setDiottrie);
  const handleColoreChange = createFieldHandler(setColori);
  const handleBoxDlChange = createFieldHandler(setBoxDl);
  const handleReferenzaChange = createFieldHandler(setReferenze);
  const handleRaggioChange = createFieldHandler(setRaggi);
  const handleSphChange = createFieldHandler(setSphValues);
  const handleDiametroChange = createFieldHandler(setDiametri);

  const handleChange = (uniqueProductId: string, value: string) => {
    if (value === "" || /^\d+$/.test(value)) { // Accetta solo numeri interi
      setOrder(prev => ({ ...prev, [uniqueProductId]: value }));
    }
  };

  const incrementQuantity = (uniqueProductId: string) => {
    const currentValue = parseInt(order[uniqueProductId] || '0');
    handleChange(uniqueProductId, (currentValue + 1).toString());
  };

  const decrementQuantity = (uniqueProductId: string) => {
    const currentValue = parseInt(order[uniqueProductId] || '0');
    if (currentValue > 0) {
      handleChange(uniqueProductId, (currentValue - 1).toString());
    }
  };

  const getCompleteOrder = () => {
    const data = processedData;
    return data.categories.map((category) => ({
      title: category.title,
      products: category.products.map((p) => {
        const uniqueId = p._uniqueId!;
        
        // SOLUZIONE 1 (CRITICA): Aggiungi SEMPRE _uniqueId all'oggetto.
        const productData: any = {
          id: p.id,
          name: p.name,
          quantity: parseInt(order[uniqueId]) || 0,
          categoria: category.title,
          formType: formType,
          _uniqueId: uniqueId, // <-- ESSENZIALE PER IL COMPONENTE GENITORE
        };

        // SOLUZIONE 2: Usa una struttura if / else if robusta.
        // I casi più specifici (come LAC BELOTTI) vanno prima di quelli generici.
        if (formType === 'LAC BELOTTI' ) {
          productData.boxdl = boxdl[uniqueId] || "";
          productData.referenza = referenze[uniqueId] || "";
          productData.colore = colori[uniqueId] || "";
          productData.raggio = raggi[uniqueId] || "";
          productData.sph = sphValues[uniqueId] || "";
          productData.diametro = diametri[uniqueId] || "";
        } 
        else if (formType === 'LAC COLORATE BELOTTI') {
          productData.colore = colori[uniqueId] || "";
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

  // **MODIFICA 5: useEffect per processare la risposta e aggiungere l'ID univoco**
  useEffect(() => {
    if (response) {
      // Crea una copia profonda per non mutare la risposta originale
      const dataWithUniqueIds: ResponseInterface = JSON.parse(JSON.stringify(response));

      dataWithUniqueIds.categories.forEach(category => {
        category.products.forEach(product => {
          // Aggiungi un ID univoco a ogni prodotto
          product._uniqueId = crypto.randomUUID();
        });
      });
      
      setProcessedData(dataWithUniqueIds);
    }
  }, [response]);

  return (
    // **MODIFICA 6: Usare processedData invece di 'response' per il rendering**
    <GenericComponent response={processedData} loading={loading} error={error}>
      {(data: ResponseInterface) => (
        <form className="w-full h-full flex flex-col overflow-hidden">
          <div className="bg-blue-800 text-white p-6">
            <h1 className="text-2xl font-bold text-center">{data.formName}</h1>
          </div>

          <div className="flex-grow overflow-auto p-2">
            {data.categories.map((category, idx) => (
              <div key={`${category.title}`} className="mb-8">
                <h2 className="text-xl font-bold mb-4 text-blue-800 border-b-2 border-blue-800 p-2">
                  {category.title}
                </h2>
                <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Codice</th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prodotto</th>
                        
                        {formType === 'LAC COLORATE BELOTTI' && (
                          <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colore</th>
                        )}

                        {formType === 'LAC BELOTTI' && (
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
                      {category.products.map((product, pIdx) => (
                        // **MODIFICA 7: Usare l'ID univoco come key per la riga**
                        <tr key={product._uniqueId} className="hover:bg-gray-50">
                          <td className="px-2 py-4 text-sm font-medium text-blue-600">{product.id}</td>
                          <td className="px-2 py-4 text-sm text-gray-900">{product.name}</td>

                          {/* D'ora in poi, passare sempre product._uniqueId agli handler */}
                          {formType === 'LAC COLORATE BELOTTI' && (
                            <td className="px-2 py-4 text-sm">
                              <select className="w-full border rounded-md p-1 text-sm" value={colori[product._uniqueId!] || ""} onChange={(e) => handleColoreChange(product._uniqueId!, e.target.value)}>
                                <option value="">--</option>
                                <option value="Green">Green</option>
                                <option value="Gray">Gray</option>
                                {/* Aggiungi altre opzioni qui */}
                              </select>
                            </td>
                          )}
                          
                          {formType === 'LAC BELOTTI' && (
                            <>
                              <td className="px-2 py-4 text-sm">
                                <select className="w-full border rounded-md p-1 text-sm" value={boxdl[product._uniqueId!] || ""} onChange={(e) => handleBoxDlChange(product._uniqueId!, e.target.value)}>
                                  <option value="">--</option>
                                  <option value="Box">Box</option>
                                  <option value="DL">DL</option>
                                </select>
                              </td>
                              <td className="px-2 py-4 text-sm">
                                <input type="text" className="w-full border rounded-md p-1 text-sm" value={referenze[product._uniqueId!] || ""} onChange={(e) => handleReferenzaChange(product._uniqueId!, e.target.value)} />
                              </td>
                              <td className="px-2 py-4 text-sm">
                                <input type="text" className="w-full border rounded-md p-1 text-sm" value={colori[product._uniqueId!] || ""} onChange={(e) => handleColoreChange(product._uniqueId!, e.target.value)} />
                              </td>
                              <td className="px-2 py-4 text-sm">
                                <input type="text" className="w-full border rounded-md p-1 text-sm" value={raggi[product._uniqueId!] || ""} onChange={(e) => handleRaggioChange(product._uniqueId!, e.target.value)} />
                              </td>
                              <td className="px-2 py-4 text-sm">
                                <input type="text" className="w-full border rounded-md p-1 text-sm" value={sphValues[product._uniqueId!] || ""} onChange={(e) => handleSphChange(product._uniqueId!, e.target.value)} />
                              </td>
                              <td className="px-2 py-4 text-sm">
                                <input type="text" className="w-full border rounded-md p-1 text-sm" value={diametri[product._uniqueId!] || ""} onChange={(e) => handleDiametroChange(product._uniqueId!, e.target.value)} />
                              </td>
                            </>
                          )}

                          <td className="px-2 py-4 text-sm text-gray-500">
                            <div className="flex items-center justify-end">
                              <button type="button" onClick={() => decrementQuantity(product._uniqueId!)} className="text-gray-500 hover:text-red-500"><MinusCircle size={20} /></button>
                              <input type="text" className="mx-2 w-16 text-center border rounded-md p-1" value={order[product._uniqueId!] || ""} onChange={(e) => handleChange(product._uniqueId!, e.target.value)} />
                              <button type="button" onClick={() => incrementQuantity(product._uniqueId!)} className="text-gray-500 hover:text-green-500"><PlusCircle size={20} /></button>
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

export default forwardRef(BelottiFormulario);