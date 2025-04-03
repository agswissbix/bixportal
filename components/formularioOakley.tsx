import React, { useState } from 'react';
import { PlusCircle, MinusCircle, Save, Printer, ShoppingCart, FileSpreadsheet, Download } from 'lucide-react';

const FormularioOakley = () => {
  const [ordine, setOrdine] = useState({});
  const [negozio, setNegozio] = useState("");
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState("Tutte");
  
  const handleChange = (prodottoId, valore) => {
    if (valore === "" || parseInt(valore) >= 0) {
      setOrdine({
        ...ordine,
        [prodottoId]: valore
      });
    }
  };
  
  const incrementQuantity = (prodottoId) => {
    const currentValue = ordine[prodottoId] ? parseInt(ordine[prodottoId]) : 0;
    handleChange(prodottoId, (currentValue + 1).toString());
  };
  
  const decrementQuantity = (prodottoId) => {
    const currentValue = ordine[prodottoId] ? parseInt(ordine[prodottoId]) : 0;
    if (currentValue > 0) {
      handleChange(prodottoId, (currentValue - 1).toString());
    }
  };
  
  const getTotalItems = () => {
    return Object.values(ordine).reduce((total, val) => {
      return total + (val ? parseInt(val) : 0);
    }, 0);
  };
  
  const categorie = [
    {
      titolo: "Custodie Piccole",
      prodotti: [
        { id: "20.1069", nome: "Rosa" },
        { id: "17.0070", nome: "Elettro" },
        { id: "13.0469", nome: "Viola" },
        { id: "23.2442", nome: "Brown" },
        { id: "13.0467", nome: "Verde" }
      ]
    },
    {
      titolo: "Custodie Grandi",
      prodotti: [
        { id: "20.1070", nome: "Rosa" },
        { id: "17.0071", nome: "Elettro" },
        { id: "14.0067", nome: "Viola" },
        { id: "23.2443", nome: "Brown" },
        { id: "14.0065", nome: "Verde" }
      ]
    },
    {
      titolo: "Spray / Microfibre",
      prodotti: [
        { id: "24.4657", nome: "Amsterdam" },
        { id: "24.4658", nome: "Cannes" },
        { id: "24.4659", nome: "Varenna" }
      ]
    },
    {
      titolo: "Microfibre",
      prodotti: [
        { id: "24.4653", nome: "Amsterdam" },
        { id: "24.4654", nome: "Cannes" },
        { id: "24.4655", nome: "Varenna" }
      ]
    },
    {
      titolo: "Ambiente",
      prodotti: [
        { id: "23.3208", nome: "Diffusore ambiente 200ml" },
        { id: "23.3209", nome: "Spray ambiente 250ml" },
        { id: "21.1299", nome: "Candele Belotti" }
      ]
    },
    {
      titolo: "Tatto",
      prodotti: [
        { id: "19.0780", nome: "Pochette asfalto" },
        { id: "19.0778", nome: "Pochette elettro" },
        { id: "19.0779", nome: "Pochette nude" },
        { id: "19.0783", nome: "Portafogli asfalto" },
        { id: "19.0781", nome: "Portafogli elettro" },
        { id: "19.0782", nome: "Portafogli nude" },
        { id: "15.0021", nome: "Portacards Nero" },
        { id: "15.0016", nome: "Portachiavi Nero" }
      ]
    },
    {
      titolo: "Cancelleria",
      prodotti: [
        { id: "23.2457", nome: "Scotch trasparente" },
        { id: "23.2456", nome: "Scotch x pacchi" },
        { id: "23.3599", nome: "Evidenziatore verde" },
        { id: "23.2459", nome: "Evidenziatore giallo" },
        { id: "23.2460", nome: "Ricarica grafettatrice" },
        { id: "15.557", nome: "Penna Zeiss" },
        { id: "15.0528", nome: "Pennarello centratura Zeiss" }
      ]
    }
  ];

  // Filtra le categorie in base alla tab attiva
  const categorieFiltrate = activeTab === "Tutte" 
    ? categorie 
    : categorie.filter(cat => cat.titolo === activeTab);

  return (
    <div className="w-full h-full mx-auto bg-white shadow-lg rounded-lg overflow-scroll">
      {/* Header */}
      <div className="bg-blue-800 text-white p-6">
        <h1 className="text-2xl font-bold text-center">FORMULARIO ORDINE LIFESTYLE 2024/2025</h1>
        <div className="flex flex-col md:flex-row justify-between mt-4 gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Centro Ottico Belotti di</label>
            <input 
              type="text" 
              className="w-full px-3 py-2 bg-blue-700 text-white rounded border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={negozio}
              onChange={(e) => setNegozio(e.target.value)}
              placeholder="Inserisci nome negozio"
            />
          </div>
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium mb-1">Data</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 bg-blue-700 text-white rounded border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="bg-gray-100 px-4 py-2 overflow-x-auto">
        <div className="flex space-x-2">
          <button 
            className={`px-4 py-2 rounded-t-lg font-medium ${activeTab === "Tutte" ? "bg-white text-blue-800 shadow" : "text-gray-600 hover:bg-gray-200"}`}
            onClick={() => setActiveTab("Tutte")}
          >
            Tutte le categorie
          </button>
          {categorie.map(cat => (
            <button 
              key={cat.titolo}
              className={`px-4 py-2 rounded-t-lg font-medium whitespace-nowrap ${activeTab === cat.titolo ? "bg-white text-blue-800 shadow" : "text-gray-600 hover:bg-gray-200"}`}
              onClick={() => setActiveTab(cat.titolo)}
            >
              {cat.titolo}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {categorieFiltrate.map((categoria, idx) => (
          <div key={idx} className="mb-8">
            <h2 className="text-xl font-bold mb-4 text-blue-800 border-b-2 border-blue-800 pb-2">
              {categoria.titolo}
            </h2>
            
            <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Codice
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prodotto
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-40">
                      Quantità
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoria.prodotti.map((prodotto) => (
                    <tr key={prodotto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {prodotto.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {prodotto.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center justify-end">
                          <button 
                            onClick={() => decrementQuantity(prodotto.id)}
                            className="text-gray-500 hover:text-red-500 focus:outline-none"
                          >
                            <MinusCircle size={20} />
                          </button>
                          
                          <input
                            type="text"
                            className="mx-2 w-16 text-center border rounded-md p-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            value={ordine[prodotto.id] || ""}
                            onChange={(e) => handleChange(prodotto.id, e.target.value)}
                          />
                          
                          <button 
                            onClick={() => incrementQuantity(prodotto.id)}
                            className="text-gray-500 hover:text-green-500 focus:outline-none"
                          >
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
      
      {/* Footer Actions */}
      <div className="bg-gray-100 p-6 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-700">
            <span className="font-medium">Totale articoli: </span>
            <span className="font-bold text-lg text-blue-800">{getTotalItems()}</span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-sm">
              <Save size={20} />
              <span>Salva</span>
            </button>
            
            <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md shadow-sm">
              <Printer size={20} />
              <span>Stampa</span>
            </button>
            
            <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md shadow-sm">
              <ShoppingCart size={20} />
              <span>Invia Ordine</span>
            </button>
            
            <button className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md shadow-sm">
              <FileSpreadsheet size={20} />
              <span>Esporta</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormularioOakley;