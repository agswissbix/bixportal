import React, { useState } from 'react';
import BelottiFormulario from './belottiFormulario';
import axios from 'axios';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { toast } from 'sonner';

// You can configure your axios instance as needed
const axiosInstanceClient = axios.create({
  // baseURL: 'https://your-api-url.com', // Uncomment and set your API base URL
  // headers: { ... } // Add any custom headers if needed
});

export default function OrdinePage() {
  const [selectedFormType, setSelectedFormType] = useState<'LIFESTYLE' | 'RIORDINO LAC'>('LIFESTYLE');
  const [cartItems, setCartItems] = useState<any[]>([]);

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
        const existingIndex = newCart.findIndex(ci =>
          ci.id === item.id &&
          ci.diottria === item.diottria &&
          ci.colore === item.colore
        );

        if (existingIndex >= 0) {
          newCart[existingIndex].quantity = item.quantity || 0;
        } else {
          newCart.push({ ...item });
        }
      });

      console.log("Carrello dopo l'aggiornamento:", newCart);
      return newCart;
    });

  };

  const inviaRichiesta = async () => {
     try {
            const response = await axiosInstanceClient.post(
                "/postApi",
                {
                    apiRoute: "send_order",
                    items: cartItems,
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                    },
                }
            )
            toast.success('Richiesta inviata con successo');
            setCartItems([]); // Pulisce il carrello dopo l'invio
        } catch (error) {
            console.error('Errore durante l\'invio della richiesta', error);
            toast.error('Errore durante l\'invio della richiesta');
        }

  };

  return (

   <div className="flex h-screen overflow-hidden">
      {/* SINISTRA - Lista scrollabile */}
      <div className="w-2/3 flex flex-col border-r border-gray-300">
        <div className="p-4 flex gap-2">
          <button
            onClick={() => setSelectedFormType('LIFESTYLE')}
            className={`px-4 py-2 rounded ${selectedFormType === 'LIFESTYLE' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
          >
            LIFESTYLE
          </button>
          <button
            onClick={() => setSelectedFormType('RIORDINO LAC')}
            className={`px-4 py-2 rounded ${selectedFormType === 'RIORDINO LAC' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}
          >
            RIORDINO LAC
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
        <div className="flex-1 overflow-y-auto px-4 pb-24">
          {cartItems.length === 0 ? (
            <p className="mt-7">Il carrello è vuoto.</p>
          ) : (
            <ul className="space-y-3 mt-4">
              {cartItems.map((item, index) => (
                <li key={index} className="bg-white p-3 rounded-lg shadow border">
                  <div className="font-semibold text-blue-800">{item.name} ({item.id})</div>
                  <div className="text-sm text-gray-700">
                    Quantità: {Number(item.quantity) || 0}
                  </div>
                  {item.diottria && <div className="text-sm text-gray-700">Diottria: {item.diottria}</div>}
                  {item.colore && <div className="text-sm text-gray-700">Colore: {item.colore}</div>}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bottone fisso in fondo */}
        <div className="absolute bottom-100 left-100 w-full bg-gray-100 p-5 border-t flex justify-between items-center gap-4">
          <div className="text-gray-700 text-lg">
            <span className="font-medium">Totale articoli: </span>
            <span className="font-bold text-blue-800">{getTotalItems()}</span>
          </div>
          <button
            type="button"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md shadow"
            onClick={() => {
              inviaRichiesta();
            }}
          >
            Invia richiesta
          </button>
        </div>
      </div>
    </div>


  );
}
