import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { PlusCircle, MinusCircle, Save } from 'lucide-react';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { useRecordsStore } from './records/recordsStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const isDev = true;

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
  const devFormType = isDev ? "Example prop" : formType;

  const defaultResponseData: ResponseInterface = {
    formName: "",
    categories: [],
  };

  const devResponseData: ResponseInterface = {
    formName: "FORMULARIO ORDINE " + formType + " 2025",
    categories: [
      {
        title: "Small Cases",
        products: [
          { id: "20.1069", name: "Pink" },
          { id: "17.0070", name: "Electro" },
          { id: "13.0469", name: "Purple" },
          { id: "23.2442", name: "Brown" },
          { id: "13.0467", name: "Green" },
        ],
      },
      {
        title: "Large Cases",
        products: [
          { id: "20.1070", name: "Pink" },
          { id: "17.0071", name: "Electro" },
          { id: "14.0067", name: "Purple" },
          { id: "23.2443", name: "Brown" },
          { id: "14.0065", name: "Green" },
        ],
      },
      {
        title: "Spray / Microfibers",
        products: [
          { id: "24.4657", name: "Amsterdam" },
          { id: "24.4658", name: "Cannes" },
          { id: "24.4659", name: "Varenna" },
        ],
      },
      {
        title: "Microfibers",
        products: [
          { id: "24.4653", name: "Amsterdam" },
          { id: "24.4654", name: "Cannes" },
          { id: "24.4655", name: "Varenna" },
        ],
      },
      {
        title: "Ambient",
        products: [
          { id: "23.3208", name: "Ambient diffuser 200ml" },
          { id: "23.3209", name: "Ambient spray 250ml" },
          { id: "21.1299", name: "Belotti Candles" },
        ],
      },
      {
        title: "Tatto",
        products: [
          { id: "19.0780", name: "Asphalt clutch" },
          { id: "19.0778", name: "Electro clutch" },
          { id: "19.0779", name: "Nude clutch" },
          { id: "19.0783", name: "Asphalt wallet" },
          { id: "19.0781", name: "Electro wallet" },
          { id: "19.0782", name: "Nude wallet" },
          { id: "15.0021", name: "Black card holder" },
          { id: "15.0016", name: "Black keychain" },
        ],
      },
      {
        title: "Stationery",
        products: [
          { id: "23.2457", name: "Transparent tape" },
          { id: "23.2456", name: "Packing tape" },
          { id: "23.3599", name: "Green highlighter" },
          { id: "23.2459", name: "Yellow highlighter" },
          { id: "23.2460", name: "Stapler refill" },
          { id: "15.557", name: "Zeiss pen" },
          { id: "15.0528", name: "Zeiss centering marker" },
        ],
      },
    ],
  };

  const { user } = useContext(AppContext);
  const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? devResponseData : defaultResponseData);
  const [order, setOrder] = useState<{ [key: string]: string }>({});
  const { setSelectedMenu } = useRecordsStore();
  const [diottrie, setDiottrie] = useState<{ [key: string]: string }>({});
  const [colori, setColori] = useState<{ [key: string]: string }>({});

  const handleDiottriaChange = (productId: string, value: string) => {
    setDiottrie({
      ...diottrie,
      [productId]: value,
    });
  };

  const handleColoreChange = (productId: string, value: string) => {
    setColori({
      ...colori,
      [productId]: value,
    });
  };


  const payload = useMemo(() => {
    if (isDev) return null;
    return {
      apiRoute: 'get_form_data',
      formType: formType,
    };
  }, [formType]);

  const { response, loading, error } = !isDev && payload ? useApi<ResponseInterface>(payload) : { response: null, loading: false, error: null };

  const handleChange = (productId: string, value: string) => {
    if (value === "" || parseInt(value) >= 0) {
      setOrder({
        ...order,
        [productId]: value,
      });
    }
  };

  const incrementQuantity = (productId: string) => {
    const currentValue = order[productId as keyof typeof order] ? parseInt(order[productId as keyof typeof order]) : 0;
    handleChange(productId, (currentValue + 1).toString());
  };

  const decrementQuantity = (productId: string) => {
    const currentValue = order[productId as keyof typeof order] ? parseInt(order[productId as keyof typeof order]) : 0;
    if (currentValue > 0) {
      handleChange(productId, (currentValue - 1).toString());
    }
  };



  const getCompleteOrder = () => {
    return responseData.categories.map((category) => ({
      title: category.title,
      products: category.products.map((p) => ({
        id: p.id,
        name: p.name,
        quantity: parseInt(order[p.id]) || 0,
        diottria: diottrie[p.id] || "",
        colore: colori[p.id] || "",
      })),
    }));
  };

  const handleSaveOrder = async () => {
    try {
      const completeOrder = getCompleteOrder();

      if (onSaveOrder) {
        console.log("Dati inviati al padre:", completeOrder);
        onSaveOrder(completeOrder); // manda i dati al padre
      }



      if (isDev) {
        console.log("Complete order (dev):", completeOrder);
        //alert("Ordine salvato");
        //location.reload();
        return;
      }
      else {
        setTimeout(async () => {
          try {
            const response = await axiosInstanceClient.post(
              "/postApi",
              {
                apiRoute: "belotti_salva_formulario",
                completeOrder: completeOrder,
                formType: formType,
              },
              {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
              }
            );
            //alert("Ordine salvato");
            console.info('Risposta:')
            console.info(response)
            setSelectedMenu("richieste");
          } catch (error) {
            alert("Errore nel salvataggio");
          }
        }, 0);
      }
      console.log(payload);
    } catch (error) {
      console.error("Order save error:", error);
      alert("Error saving the order.");
    }
  };

  useEffect(() => {
    if (!isDev && response && JSON.stringify(response) !== JSON.stringify(responseData)) {
      setResponseData(response);
    }
  }, [response, responseData]);

  return (
    <GenericComponent response={responseData} loading={loading} error={error}>
      {(response: ResponseInterface) => (
 <form className="w-full h-full flex flex-col overflow-hidden">
      <div className="bg-blue-800 text-white p-6">
        <h1 className="text-2xl font-bold text-center">{response.formName}</h1>
      </div>

      {/* Contenuto scrollabile */}
      <div className="flex-grow overflow-auto p-2">
        {response.categories.map((category, idx) => (
          <div key={idx} className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-blue-800 border-b-2 border-blue-800 p-2">
              {category.title}
            </h2>

            <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '15%' }}>Codice</th>
                    <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '30%' }}>Prodotto</th>
                    {formType === 'RIORDINO LAC' && (
                      <>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '15%' }}>Diottria</th>
                        <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '15%' }}>Colore</th>
                      </>
                    )}
                    <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: formType === 'RIORDINO LAC' ? '25%' : '40%' }}>Quantità</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {category.products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-2 py-4 text-sm font-medium text-blue-600" style={{ width: '15%' }}>{product.id}</td>
                      <td className="px-2 py-4 text-sm text-gray-900" style={{ width: '30%' }}>{product.name}</td>

                      {formType === 'RIORDINO LAC' && (
                        <>
                          <td className="px-2 py-4 text-sm" style={{ width: '15%' }}>
                            <input
                              type="text"
                              className="w-full border rounded-md p-1 text-sm"
                              value={diottrie[product.id] || ""}
                              onChange={(e) => handleDiottriaChange(product.id, e.target.value)}
                            />
                          </td>
                          <td className="px-2 py-4 text-sm" style={{ width: '15%' }}>
                            <select
                              className="w-full border rounded-md p-1 text-sm"
                              value={colori[product.id] || ""}
                              onChange={(e) => handleColoreChange(product.id, e.target.value)}
                            >
                              <option value="">--</option>
                              <option value="Green">Green</option>
                              <option value="Gray">Gray</option>
                              <option value="P.Hazel">P.Hazel</option>
                              <option value="Blue">Blue</option>
                              <option value="Honey">Honey</option>
                              <option value="Amethyst">Amethyst</option>
                              <option value="Turquoise">Turquoise</option>
                              <option value="T.Sapphire">T.Sapphire</option>
                              <option value="Sterl. Gray">Sterl. Gray</option>
                              <option value="Brown">Brown</option>
                              <option value="Gem. Green">Gem. Green</option>
                              <option value="Brl. Blue">Brl. Blue</option>
                            </select>
                          </td>
                        </>
                      )}

                      <td className="px-2 py-4 text-sm text-gray-500" style={{ width: formType === 'RIORDINO LAC' ? '25%' : '40%' }}>
                        <div className="flex items-center justify-end">
                          <button type="button" onClick={() => decrementQuantity(product.id)} className="text-gray-500 hover:text-red-500">
                            <MinusCircle size={20} />
                          </button>
                          <input
                            type="text"
                            className="mx-2 w-16 text-center border rounded-md p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={order[product.id] || ""}
                            onChange={(e) => handleChange(product.id, e.target.value)}
                          />
                          <button type="button" onClick={() => incrementQuantity(product.id)} className="text-gray-500 hover:text-green-500">
                            <PlusCircle size={20} />
                          </button>
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

      <div className="bg-gray-100 p-6 mb-16 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap gap-3">
            <button type='button'
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm"
              onClick={handleSaveOrder}>
              <Save size={20} />
              <span>AGGIUNGI ALLA RICHIESTA</span>
            </button>
          </div>
        </div>
      </div>
    </form>
      )}
    </GenericComponent>
  );
}
