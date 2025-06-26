import React, { useRef, useState } from 'react';
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type Event = {
  id: number;
  title: string;
  description: string;
  date: string;
  color: string;
};

const COLOR_OPTIONS = [
  '#3B82F6', '#22C55E', '#A855F7',
  '#EF4444', '#EAB308', '#6366F1',
  '#EC4899', '#6B7280',
];

const initialEvents: Event[] = [
  { id: 1, title: 'Inizio progetto', description: 'Analisi requisiti e pianificazione', date: '2025-06-26', color: '#3B82F6' },
  { id: 2, title: 'Sviluppo frontend', description: 'Realizzazione interfaccia utente', date: '2025-07-10', color: '#22C55E' },
  { id: 3, title: 'Testing', description: 'Test funzionali e QA', date: '2025-07-20', color: '#A855F7' },
];

export default function Timeline() {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const changeColor = (id: number, newColor: string) => {
    setEvents(events.map(ev => (ev.id === id ? { ...ev, color: newColor } : ev)));
    setEditingId(null);
  };

  const handleDownloadPdf = async () => {
    if (!timelineRef.current) return;
    setLoading(true);

    try {
      const canvas = await html2canvas(timelineRef.current, {
        scale: 2, // maggiore qualità
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save('timeline.pdf');
    } catch (error) {
      console.error('Errore nella generazione PDF:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f0f0f0', padding: 20 }}>
      <button
        onClick={handleDownloadPdf}
        disabled={loading}
        style={{
          marginBottom: 20,
          padding: '10px 16px',
          backgroundColor: '#3B82F6',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
          fontSize: 16,
        }}
      >
        {loading ? 'Generando PDF...' : 'Scarica Timeline PDF'}
      </button>

      <div ref={timelineRef}>
        <VerticalTimeline>
          {events.map(({ id, title, description, date, color }) => (
            <VerticalTimelineElement
              key={id}
              date={date}
              contentStyle={{
                border: `3px solid ${color}`,
                borderRadius: 10,
                background: '#fff',
                color: '#333',
              }}
              contentArrowStyle={{ borderRight: `7px solid ${color}` }}
              iconStyle={{ background: color, color: '#fff', cursor: 'pointer' }}
              iconOnClick={() => setEditingId(editingId === id ? null : id)}
            >
              <h3 style={{ fontWeight: 'bold', fontSize: '1.3rem', marginBottom: 8 }}>
                {title}
              </h3>
              <p>{description}</p>

              {editingId === id && (
                <div
                  style={{
                    marginTop: 10,
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      onClick={() => changeColor(id, c)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: '2px solid #ccc',
                        backgroundColor: c,
                        cursor: 'pointer',
                      }}
                      aria-label={`Scegli colore ${c}`}
                      type="button"
                    />
                  ))}
                  <button
                    onClick={() => setEditingId(null)}
                    style={{
                      marginLeft: 8,
                      cursor: 'pointer',
                      border: 'none',
                      background: 'transparent',
                      color: '#999',
                    }}
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              )}
            </VerticalTimelineElement>
          ))}
        </VerticalTimeline>
      </div>
    </div>
  );
}
