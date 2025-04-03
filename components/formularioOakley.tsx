import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus } from "lucide-react";

const categories = [
  {
    title: "Cartoteca",
    items: [
      { code: "22.2115", name: "Carta Intestata" },
      { code: "22.2116", name: "Buste finestra per lettere" },
      { code: "15.0603", name: "Risma di carta bianca per stampante" },
      { code: "22.2117", name: "Etichette Oakley per pacchi" },
      { code: "15.0640", name: "Etichette per montature" },
      { code: "23.3758", name: "Gift Card" },
      { code: "23.3759", name: "Porta Gift Card" },
    ],
  },
  {
    title: "Materiale di pulizia",
    items: [
      { code: "20.467", name: "Carta Laboratorio" },
      { code: "15.605", name: "Sacchi per i rifiuti da 35 litri" },
      { code: "15.604", name: "Sacchi per i rifiuti da 110 litri" },
      { code: "24.244", name: "Carta Igienica" },
      { code: "24.725", name: "Salviette sala refrazione" },
      { code: "24.29", name: "Detergente pavimenti" },
      { code: "23.3615", name: "Spray per vetri" },
      { code: "24.30", name: "WC net" },
    ],
  },
  {
    title: "Vari",
    items: [
      { code: "23.2082", name: "Sacchetti Oakley Small" },
      { code: "22.2104", name: "Sacchetti Oakley Medium" },
      { code: "22.2105", name: "Sacchetti Oakley Large" },
      { code: "15.0527", name: "Rotoli scontrini cassa" },
      { code: "15.0526", name: "Rotoli Autorefrattometro" },
      { code: "24.2818", name: "Pila 9V per cassaforte" },
      { code: "24.2816", name: "Pila stilo (AA)" },
      { code: "24.2817", name: "Pila ministilo (AAA)" },
    ],
  },
  {
    title: "Merce Varia",
    items: [
      { code: "21.1407", name: "Antibeschlag Tücher 20x" },
      { code: "22.591", name: "Antibeschlag set Zeiss 15ml" },
      { code: "22.592", name: "Antibeschlag set Zeiss 240ml" },
    ],
  },
  {
    title: "Cancelleria",
    items: [
      { code: "23.2457", name: "Scotch trasparente" },
      { code: "23.2456", name: "Scotch x pacchi" },
      { code: "23.3599", name: "Evidenziatore verde" },
      { code: "23.3599", name: "Evidenziatore giallo" },
      { code: "23.2460", name: "Ricarica graffettatrice" },
    ],
  },
];

export default function FormularioOakley() {
  const [quantities, setQuantities] = useState({});

  const handleChange = (code, value) => {
    setQuantities((prev) => ({ ...prev, [code]: value }));
  };

  const increment = (code) => {
    setQuantities((prev) => ({ ...prev, [code]: (prev[code] || 0) + 1 }));
  };

  const decrement = (code) => {
    setQuantities((prev) => ({ ...prev, [code]: Math.max((prev[code] || 0) - 1, 0) }));
  };

  return (
    <div className="p-4">
      <div className="bg-blue-800 text-white p-4 rounded-md mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">FORMULARIO ORDINE OAKLEY 2024/2025</h1>
        <Input type="date" className="w-40 bg-white text-black" />
      </div>

      <Input placeholder="Oakley Store di" className="mb-6 w-full" />

      {categories.map((category) => (
        <div key={category.title} className="mb-6">
          <h2 className="text-lg font-semibold text-blue-800 border-b border-blue-800 mb-2">
            {category.title}
          </h2>
          <Card>
            <CardContent className="p-0">
              {category.items.map((item, idx) => (
                <div
                  key={item.code}
                  className={`grid grid-cols-12 items-center px-4 py-2 border-b ${
                    idx % 2 === 0 ? "bg-gray-50" : "bg-white"
                  }`}
                >
                  <div className="col-span-2 text-blue-800 font-medium">{item.code}</div>
                  <div className="col-span-7">{item.name}</div>
                  <div className="col-span-3 flex justify-center items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => decrement(item.code)}
                    >
                      <Minus size={16} />
                    </Button>
                    <Input
                      type="number"
                      value={quantities[item.code] || ""}
                      onChange={(e) => handleChange(item.code, parseInt(e.target.value) || 0)}
                      className="w-16 text-center"
                      min="0"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => increment(item.code)}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
      <Button className="w-full mt-4">Invia Ordine</Button>
    </div>
  );
}
