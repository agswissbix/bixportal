import React, { useState, useEffect } from 'react';

const InventarioOtticaBelotti = () => {
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });
  const [inventoryData, setInventoryData] = useState<{ [key: string]: string }>({});

  // Struttura dei dati dell'inventario
  const inventorySections = [
    {
      title: 'Custodie Piccole',
      items: [
        { code: '20.1069', description: 'Rosa' },
        { code: '17.0070', description: 'Elettro' },
        { code: '13.0469', description: 'Viola' },
        { code: '23.2442', description: 'Brown' },
        { code: '13.0467', description: 'Verde' }
      ]
    },
    {
      title: 'Custodie Grandi',
      items: [
        { code: '20.1070', description: 'Rosa' },
        { code: '17.0071', description: 'Elettro' },
        { code: '14.0067', description: 'Viola' },
        { code: '23.2443', description: 'Brown' },
        { code: '14.0065', description: 'Verde' }
      ]
    },
    {
      title: 'Spray / Microfibre',
      items: [
        { code: '24.4657', description: 'Amsterdam' },
        { code: '24.4658', description: 'Cannes' },
        { code: '24.4659', description: 'Varenna' }
      ]
    },
    {
      title: 'Microfibre',
      items: [
        { code: '24.4653', description: 'Amsterdam' },
        { code: '24.4654', description: 'Cannes' },
        { code: '24.4655', description: 'Varenna' }
      ]
    },
    {
      title: 'Ambiente',
      items: [
        { code: '23.3208', description: 'Diffusore ambiente 200ml' },
        { code: '23.3209', description: 'Spray ambiente 250ml' },
        { code: '21.1299', description: 'Candele Belotti' }
      ]
    },
    {
      title: 'Tatto',
      items: [
        { code: '19.0780', description: 'Pochette asfalto' },
        { code: '19.0778', description: 'Pochette elettro' },
        { code: '19.0779', description: 'Pochette nude' },
        { code: '19.0783', description: 'Portafogli asfalto' },
        { code: '19.0781', description: 'Portafogli elettro' },
        { code: '19.0782', description: 'Portafogli nude' },
        { code: '15.0021', description: 'Portacards Nero' },
        { code: '15.0016', description: 'Portachiavi Nero' }
      ]
    },
    {
      title: 'Cancelleria',
      items: [
        { code: '23.2457', description: 'Scotch trasparente' },
        { code: '23.2456', description: 'Scotch x pacchi' },
        { code: '23.3599', description: 'Evidenziatore verde' },
        { code: '23.2459', description: 'Evidenziatore giallo' },
        { code: '23.2460', description: 'Ricarica grafite/trice' },
        { code: '15.557', description: 'Penna Zeiss' },
        { code: '15.0528', description: 'Pennarello centratura Zeiss' }
      ]
    }
  ];

  // Inizializza l'oggetto dati dell'inventario
  useEffect(() => {
    const initialData: { [key: string]: string } = {};
    inventorySections.forEach(section => {
      section.items.forEach(item => {
        initialData[item.code] = '';
      });
    });
    setInventoryData(initialData);
  }, []);

  // Gestisce il cambio di quantità
  const handleQuantityChange = (code: string, value: string) => {
    setInventoryData(prev => ({
      ...prev,
      [code]: value
    }));
  };

  // Gestisce il reset del form
  const handleReset = () => {
    const resetData: { [key: string]: string } = {};
    Object.keys(inventoryData).forEach(key => {
      resetData[key] = '';
    });
    setInventoryData(resetData);
    setStatusMessage({ text: '', type: '' });
  };

  // Gestisce l'invio del form
  interface InventoryItem {
    code: string;
    description: string;
    category: string;
    quantity: number;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit: { date: string; items: InventoryItem[] } = {
      date: data,
      items: []
    };
    
    // Aggiungi solo gli articoli con quantità specificate
    Object.entries(inventoryData).forEach(([code, quantity]) => {
      if (quantity !== '') {
        // Trova la sezione e la descrizione per questo codice
        let itemDescription = '';
        let itemCategory = '';
        
        for (const section of inventorySections) {
          const item = section.items.find(item => item.code === code);
          if (item) {
            itemDescription = item.description;
            itemCategory = section.title;
            break;
          }
        }
        
        dataToSubmit.items.push({
          code,
          description: itemDescription,
          category: itemCategory,
          quantity: parseInt(quantity as string, 10)
        });
      }
    });
    
    // Simula l'invio dei dati al backend
    console.log('Dati inviati:', dataToSubmit);
    
    // Mostra il messaggio di successo
    setStatusMessage({
      text: 'Dati inviati con successo al database!',
      type: 'success'
    });
    
    // Nascondi il messaggio dopo 5 secondi
    setTimeout(() => {
      setStatusMessage({ text: '', type: '' });
    }, 5000);
  };

  // Ottieni la data formattata per l'intestazione
  const formattedDate = new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-blue-800 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Centro Ottico Belotti di</h1>
          <div>{formattedDate}</div>
        </div>
      </header>
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit}>
          <div className="bg-white p-4 rounded-md shadow mb-6 flex items-center">
            <label htmlFor="inventory-date" className="font-bold mr-3">Data:</label>
            <input 
              type="date" 
              id="inventory-date" 
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="border rounded px-3 py-2"
              required
            />
          </div>
          
          {inventorySections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
              <div className="bg-blue-800 text-white px-4 py-3 font-semibold">
                {section.title}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left px-4 py-3 border-b">Codice</th>
                      <th className="text-left px-4 py-3 border-b">Descrizione</th>
                      <th className="text-left px-4 py-3 border-b">Quantità</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.items.map((item, itemIndex) => (
                      <tr key={itemIndex} className="hover:bg-gray-50">
                        <td className="px-4 py-3 border-b">{item.code}</td>
                        <td className="px-4 py-3 border-b">{item.description}</td>
                        <td className="px-4 py-3 border-b">
                          <input
                            type="number"
                            min="0"
                            value={inventoryData[item.code]}
                            onChange={(e) => handleQuantityChange(item.code, e.target.value)}
                            className="border rounded w-20 px-3 py-2 text-center"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
          
          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={handleReset}
              className="bg-red-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-red-600 transition-transform hover:-translate-y-1 shadow-md"
            >
              Cancella Tutto
            </button>
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-green-700 transition-transform hover:-translate-y-1 shadow-md"
            >
              Invia Dati
            </button>
          </div>
          
          {statusMessage.text && (
            <div className={`mt-6 p-4 rounded-md ${statusMessage.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
              {statusMessage.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default InventarioOtticaBelotti;