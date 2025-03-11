import React, { useState } from 'react';
import axios from 'axios';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { motion } from 'framer-motion';
import axiosInstanceClient from '@/utils/axiosInstanceClient';

export default function QuadroBarcodeComponent() {
  const [barcodeLotto, setBarcodeLotto] = useState("");
  const [barcodeWip, setBarcodeWip] = useState("");
  const [barcodeWipList, setBarcodeWipList] = useState<string[]>([]);

  // Modali di caricamento, successo, errore
  const [showSavingModal, setShowSavingModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Gestisce l'inserimento del barcode wip all'Enter
interface BarcodeWipKeyDownEvent extends React.KeyboardEvent<HTMLInputElement> {}

const handleBarcodeWipKeyDown = (e: BarcodeWipKeyDownEvent): void => {
    if (e.key === 'Enter' && barcodeWip.trim() !== "") {
        e.preventDefault();
        setBarcodeWipList((prev) => [barcodeWip.trim(), ...prev]);
        setBarcodeWip("");
    }
};

  // Rimuove un barcode dalla lista
const removeBarcodeWip = (index: number): void => {
    setBarcodeWipList((prev) => prev.filter((_, i) => i !== index));
};

  // Chiude il modale di errore
  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  // Salvataggio (con simulazione di 2 secondi)
  const handleSave = () => {
    if (!barcodeLotto.trim()) {
      alert('Inserisci il barcode lotto prima di salvare');
      return;
    }


    setShowSavingModal(true);

    // Simuliamo un caricamento di 2 secondi prima della chiamata
    setTimeout(async () => {
        try {
          const response = await axiosInstanceClient.post(
            "/postApi",
            {
              apiRoute: "winteler_wip_barcode_scan",
              barcodeLotto: barcodeLotto,
              barcodeWipList: barcodeWipList
            },
            {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            }
          );
          setShowSavingModal(false);
          setShowSuccessModal(true);
          console.info('Risposta:')
          console.info(response)
        } catch (error) {
          setShowSavingModal(false);
          setErrorMessage('Errore durante il salvataggio.');
          setShowErrorModal(true);
        }
      }, 0);
  };

  return (
    <div className="w-full h-auto flex justify-center items-center p-4">
      <Card className="w-full max-w-xl shadow-md border rounded-2xl">
        <CardHeader>
          <CardTitle>Registrazione Barcode</CardTitle>
          <CardDescription>
            Gestisci il barcode lotto e la lista di barcode WIP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barcode Lotto */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="barcode-lotto" className="block text-sm font-medium text-gray-700">Barcode Lotto</label>
            <Input
              id="barcode-lotto"
              placeholder="Inserisci barcode lotto"
              value={barcodeLotto}
              onChange={(e) => setBarcodeLotto(e.target.value)}
            />
          </div>

          {/* Barcode WIP */}
          <div className="flex flex-col space-y-2">
            <label htmlFor="barcode-wip" className="block text-sm font-medium text-gray-700">Barcode WIP</label>
            <Input
              id="barcode-wip"
              placeholder="Scansiona o inserisci barcode WIP"
              value={barcodeWip}
              onChange={(e) => setBarcodeWip(e.target.value)}
              onKeyDown={handleBarcodeWipKeyDown}
            />
          </div>

          {/* Lista Barcode WIP */}
          <div className="max-h-60 overflow-y-auto border p-2 rounded-md">
            {barcodeWipList.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between py-1"
              >
                <span>{item}</span>
                <Button className="bg-black text-white" onClick={() => removeBarcodeWip(index)}>
                  Elimina
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <Button className="bg-black text-white" onClick={handleSave}>
            Salva
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
