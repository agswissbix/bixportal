'use client';

import React, { useState } from 'react';
import axios from 'axios';

export default function CSRFTest() {
  const [msg, setMsg] = useState<string>('');

  const fetchCsrf = async () => {
    try {
      const resp = await axios.get('/getCsrf');
      setMsg(JSON.stringify(resp.data));
    } catch (error) {
      setMsg('Errore nel recupero CSRF');
      console.error(error);
    }
  };

  return (
    <div>
      <button onClick={fetchCsrf}>Ottieni CSRF</button>
      <p>{msg}</p>
    </div>
  );
}
