import React, { useState } from "react";
import axios from "axios";
import { saveAs } from "file-saver";

const TrasfertaForm = () => {
  const utenti = [
    { id: 1, nome: "Mario", cognome: "Rossi", indirizzo: "Via Roma 10, Milano, Italia" },
    { id: 2, nome: "Luca", cognome: "Bianchi", indirizzo: "Piazza Navona 5, Roma, Italia" },
    { id: 3, nome: "Giulia", cognome: "Verdi", indirizzo: "Corso Vittorio Emanuele II, Torino, Italia" }
  ];

  const reparti = ["Vendite", "Marketing", "IT", "Produzione"];

  const [formData, setFormData] = useState({
    utente: "",
    reparto: "",
    data: "",
    motivo: "",
    indirizzo: "",
    chilometri: "",
    altriCosti: "",
    durata: "",
    durataAltro: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [dateWarning, setDateWarning] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Controllo per il campo data
    if (name === "data") {
      const now = new Date();
      const inputDate = new Date(value);
      const diffHours = (inputDate - now) / (1000 * 60 * 60);
      setDateWarning(diffHours < 48);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (dateWarning) return; // Non invia se c'è il warning
    setLoading(true);
    setSubmitMessage("");

    try {
      const utenteSelezionato = utenti.find(u => u.id.toString() === formData.utente);
      const payload = {
        ...formData,
        nome: utenteSelezionato?.nome,
        cognome: utenteSelezionato?.cognome
      };

      const response = await axios.post(
        "http://localhost:8000/commonapp/trasferta_pdf/",
        payload,
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const filename = `trasferta_${formData.utente}_${formData.data}.docx`;
      saveAs(response.data, filename);

      setSubmitMessage("Documento scaricato con successo!");
      setFormData({
        utente: "",
        reparto: "",
        data: "",
        motivo: "",
        indirizzo: "",
        chilometri: "",
        altriCosti: "",
        durata: "",
        durataAltro: "",
      });
      setDateWarning(false);
    } catch (error) {
      setSubmitMessage("Errore durante l'invio o il download.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="max-w-md mx-auto p-6 bg-white rounded-md shadow-md space-y-4"
    >
      <select
        name="utente"
        value={formData.utente}
        onChange={handleChange}
        required
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Seleziona utente</option>
        {utenti.map((u) => (
          <option key={u.id} value={u.id}>
            {u.nome} {u.cognome}
          </option>
        ))}
      </select>

      <select
        name="reparto"
        value={formData.reparto}
        onChange={handleChange}
        required
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Seleziona reparto</option>
        {reparti.map((rep, idx) => (
          <option key={idx} value={rep}>{rep}</option>
        ))}
      </select>

      <div>
        <input
          type="date"
          name="data"
          value={formData.data}
          onChange={handleChange}
          required
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {dateWarning && (
          <p className="text-red-600 text-sm mt-1">
            La data della trasferta è entro le 48 ore. Contatta l'amministratore.
          </p>
        )}
      </div>

      <input
        type="text"
        name="motivo"
        placeholder="Motivo trasferta"
        value={formData.motivo}
        onChange={handleChange}
        required
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="text"
        name="indirizzo"
        placeholder="Indirizzo destinazione"
        value={formData.indirizzo}
        onChange={handleChange}
        required
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="number"
        name="chilometri"
        placeholder="Chilometri (opzionale)"
        value={formData.chilometri}
        onChange={handleChange}
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <input
        type="text"
        name="altriCosti"
        placeholder="Altri costi previsti"
        value={formData.altriCosti}
        onChange={handleChange}
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <select
        name="durata"
        value={formData.durata}
        onChange={handleChange}
        required
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Durata</option>
        <option value="1/2G">1/2 Giornata</option>
        <option value="1G">1 Giornata</option>
        <option value="Altro">Altro</option>
      </select>

      {formData.durata === "Altro" && (
        <input
          type="number"
          name="durataAltro"
          placeholder="Durata (in giorni)"
          value={formData.durataAltro}
          onChange={handleChange}
          min="1"
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}

      <button
        type="submit"
        disabled={loading || dateWarning}
        className={`w-full py-2 rounded text-white font-semibold ${
          loading || dateWarning
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Invio in corso..." : "Invia"}
      </button>

      {submitMessage && (
        <p
          className={`mt-2 text-center ${
            submitMessage.includes("Errore") ? "text-red-600" : "text-green-600"
          }`}
        >
          {submitMessage}
        </p>
      )}
    </form>
  );
};

export default TrasfertaForm;
