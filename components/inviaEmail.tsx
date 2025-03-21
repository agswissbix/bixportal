import React, { useState } from 'react';
import InputEditor from './inputEditor';
import InputWord from './inputWord';
import { Input } from 'postcss';


// Componente Popup
interface SimplePopupProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

const SimplePopup: React.FC<SimplePopupProps> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '1000px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
      }}>
        <p>{message}</p>
        <div style={{ textAlign: 'right', marginTop: '15px' }}>
        
        <div>
        <div className="">
            <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
            <input
                name="word"
                type="text"
                value=""
                placeholder="CC"
                className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
            />
            </div>
        </div>
        </div>
        <br></br>

        <div>
        <div className="">
            <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
            <input
                name="word"
                type="text"
                value=""
                placeholder="BCC"
                className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
            />
            </div>
        </div>
        </div>
        <br></br>

        <div>
        <div className="">
            <div className="flex items-center rounded-md bg-white pl-3 outline outline-1 -outline-offset-1 outline-gray-300 has-[input:focus-within]:outline has-[input:focus-within]:outline-2 has-[input:focus-within]:-outline-offset-2 has-[input:focus-within]:outline-indigo-600">
            <input
                name="word"
                type="text"
                value=""
                placeholder="Oggetto"
                className="block min-w-0 grow py-1.5 pl-1 pr-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline focus:outline-0 sm:text-sm/6"
            />
            </div>
        </div>
        </div>
        <br></br>

        <InputEditor />

          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Invia
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimplePopup;