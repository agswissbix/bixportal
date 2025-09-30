import React, { useState } from 'react';
import BelottiFormulario from './belottiFormulario';
import axios from 'axios';
// Rimuovo l'istanza duplicata, assumendo che tu abbia una configurazione centralizzata
// import axiosInstanceClient from '@/utils/axiosInstanceClient'; 
import { toast } from 'sonner';
import { useRecordsStore } from './records/recordsStore';

// You can configure your axios instance as needed
const axiosInstanceClient = axios.create({
  // baseURL: 'https://your-api-url.com', // Uncomment and set your API base URL
  // headers: { ... } // Add any custom headers if needed
});

export default function OrdinePage() {
  const [selectedFormType, setSelectedFormType] = useState<'MERCE BELOTTI' | 'LIFESTYLE BELOTTI' | 'LAC BELOTTI' | 'LAC COLORATE BELOTTI' | 'LIQUIDI LAC BELOTTI' | 'UDITO BELOTTI' | 'MERCE BLITZ' | 'LAC BLITZ' | 'LAC COLORATE BLITZ' | 'LIQUIDI LAC BLITZ' | 'UDITO BLITZ' | 'MERCE OAKLEY'>('MERCE BELOTTI');
  const [cartItems, setCartItems] = useState<any[]>([]);
  const { setSelectedMenu } = useRecordsStore();

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + (Number(item.quantity) || 0), 0);
  };

  // Funzione per aggiungere prodotti al carrello
  const handleAddToCart = (completeOrder) => {
    const productsToAdd = completeOrder.flatMap(category =>
      category.products.filter(p => p.quantity > 0)
    );

    console.log("Prodotti da aggiungere (quantità > 0):", productsToAdd);

    setCartItems((prevItems) => {
      console.log("Carrello prima dell'aggiornamento:", prevItems);

      const newCart = [...prevItems];
      productsToAdd.forEach(item => {
        // Logica di ricerca aggiornata per includere i campi Oakley
        const existingIndex = newCart.findIndex(ci =>
          ci.id === item.id &&
          ci.formType === item.formType &&
          // Campi generici (se presenti)
          ci.diottria === item.diottria &&
          // Se il formType NON è Oakley, il colore viene da una select.
          // Se è Oakley, viene da un input text. La logica di confronto rimane la stessa.
          ci.colore === item.colore &&
          // Campi specifici per MERCE OAKLEY
          // Questi saranno undefined per altri tipi di form, quindi il confronto `undefined === undefined` funzionerà correttamente
          ci.boxDl === item.boxDl &&
          ci.referenza === item.referenza &&
          ci.raggio === item.raggio &&
          ci.sph === item.sph &&
          ci.diametro === item.diametro
        );

        if (existingIndex >= 0) {
          // Se l'articolo esiste già, aggiorna solo la quantità
          newCart[existingIndex].quantity = item.quantity || 0;
        } else {
          // Altrimenti, aggiungi il nuovo articolo completo
          newCart.push({ ...item });
        }
      });
      
      // Filtra gli articoli con quantità zero, nel caso un articolo esistente venga impostato a 0
      const finalCart = newCart.filter(item => item.quantity > 0);

      console.log("Carrello dopo l'aggiornamento:", finalCart);
      return finalCart;
    });
  };


  const inviaRichiesta = async () => {
    // Controllo se il carrello è vuoto o tutte le quantità sono zero
    if (cartItems.length === 0 || getTotalItems() === 0) {
      toast.error('Il carrello è vuoto. Aggiungi almeno un prodotto prima di inviare la richiesta.');
      return; // Esce senza fare la chiamata API
    }

    try {
      const response = await axiosInstanceClient.post(
        "/postApi",
        {
          apiRoute: "send_order",
          formType: selectedFormType,
          items: cartItems,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success('Richiesta inviata con successo');
      setCartItems([]);

      // Qui vai sulla pagina "richieste" senza cambiare URL
      setSelectedMenu("richieste");
    } catch (error) {
      console.error("Errore durante l'invio della richiesta", error);
      toast.error("Errore durante l'invio della richiesta");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* SINISTRA - Lista scrollabile */}
      <div className="w-2/3 flex flex-col border-r border-gray-300">
        <div className="p-4 flex gap-2 flex-wrap"> {/* Aggiunto flex-wrap per gestire il responsive */}
          <button onClick={() => setSelectedFormType('MERCE BELOTTI')} className={`px-4 py-2 rounded ${selectedFormType === 'MERCE BELOTTI' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            MERCE BELOTTI
          </button>
          <button onClick={() => setSelectedFormType('LIFESTYLE BELOTTI')} className={`px-4 py-2 rounded ${selectedFormType === 'LIFESTYLE BELOTTI' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            LIFESTYLE BELOTTI
          </button>
          <button onClick={() => setSelectedFormType('LAC BELOTTI')} className={`px-4 py-2 rounded ${selectedFormType === 'LAC BELOTTI' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            LAC BELOTTI
          </button>
          <button onClick={() => setSelectedFormType('LAC COLORATE BELOTTI')} className={`px-4 py-2 rounded ${selectedFormType === 'LAC COLORATE BELOTTI' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            LAC COLORATE BELOTTI
          </button>
          <button onClick={() => setSelectedFormType('LIQUIDI LAC BELOTTI')} className={`px-4 py-2 rounded ${selectedFormType === 'LIQUIDI LAC BELOTTI' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            LIQUIDI LAC BELOTTI
          </button>
          <button onClick={() => setSelectedFormType('UDITO BELOTTI')} className={`px-4 py-2 rounded ${selectedFormType === 'UDITO BELOTTI' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            UDITO BELOTTI
          </button>
          <button onClick={() => setSelectedFormType('MERCE BLITZ')} className={`px-4 py-2 rounded ${selectedFormType === 'MERCE BLITZ' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            MERCE BLITZ
          </button>
          <button onClick={() => setSelectedFormType('LAC BLITZ')} className={`px-4 py-2 rounded ${selectedFormType === 'LAC BLITZ' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            LAC BLITZ
          </button>
          <button onClick={() => setSelectedFormType('LAC COLORATE BLITZ')} className={`px-4 py-2 rounded ${selectedFormType === 'LAC COLORATE BLITZ' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            LAC COLORATE BLITZ
          </button>
          <button onClick={() => setSelectedFormType('UDITO BLITZ')} className={`px-4 py-2 rounded ${selectedFormType === 'UDITO BLITZ' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            UDITO BLITZ
          </button>
          <button onClick={() => setSelectedFormType('MERCE OAKLEY')} className={`px-4 py-2 rounded ${selectedFormType === 'MERCE OAKLEY' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
            MERCE OAKLEY
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <BelottiFormulario formType={selectedFormType} onSaveOrder={handleAddToCart} />
        </div>
      </div>

      {/* DESTRA - Carrello scrollabile con bottone fisso */}
      <div className="w-1/3 flex flex-col bg-gray-100 relative">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Carrello</h2>
        </div>

        {/* Lista scrollabile */}
        <div className="flex-1 overflow-y-auto p-4 pb-24">
          {cartItems.length === 0 ? (
            <p>Il carrello è vuoto.</p>
          ) : (
            <ul className="space-y-3">
              {cartItems.map((item, index) => (
                <li key={index} className="bg-white p-3 rounded-lg shadow border">
                  <div className="font-semibold text-blue-800">{item.name} ({item.id})</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Da: <span className="font-medium bg-gray-100 px-2 py-0.5 rounded-full">{item.formType}</span>
                  </div>
                  <div className="text-sm text-gray-700 mt-2">
                    Quantità: <span className='font-bold'>{Number(item.quantity) || 0}</span>
                  </div>

                  {/* Mostra campi specifici del form */}
                  {item.diottria && <div className="text-sm text-gray-700">Diottria: {item.diottria}</div>}
                  
                  {/* Per 'MERCE BELOTTI' e altri, mostra il colore se c'è */}
                  {item.colore && item.formType !== 'MERCE OAKLEY' && <div className="text-sm text-gray-700">Colore: {item.colore}</div>}

                  {/* Blocco specifico per visualizzare i dettagli di MERCE OAKLEY */}
                  {item.formType === 'MERCE OAKLEY' && (
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                      {item.boxDl && <div className="text-sm text-gray-700">Box/DL: <span className='font-medium'>{item.boxDl}</span></div>}
                      {item.referenza && <div className="text-sm text-gray-700">Referenza: <span className='font-medium'>{item.referenza}</span></div>}
                      {item.colore && <div className="text-sm text-gray-700">Colore: <span className='font-medium'>{item.colore}</span></div>}
                      {item.raggio && <div className="text-sm text-gray-700">Raggio: <span className='font-medium'>{item.raggio}</span></div>}
                      {item.sph && <div className="text-sm text-gray-700">SPH: <span className='font-medium'>{item.sph}</span></div>}
                      {item.diametro && <div className="text-sm text-gray-700">Diametro: <span className='font-medium'>{item.diametro}</span></div>}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bottone fisso in fondo */}
        <div className="absolute bottom-0 left-0 w-full bg-gray-100 p-5 border-t flex justify-between items-center gap-4">
          <div className="text-gray-700 text-lg">
            <span className="font-medium">Totale articoli: </span>
            <span className="font-bold text-blue-800">{getTotalItems()}</span>
          </div>
          <button
            type="button"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md shadow disabled:bg-gray-400"
            onClick={inviaRichiesta}
            disabled={getTotalItems() === 0}
          >
            Invia richiesta
          </button>
        </div>
      </div>
    </div>
  );
}