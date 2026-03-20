"use client"

import { useEffect, useState } from 'react';
import axiosInstanceClient from '@/utils/axiosInstanceClient';
import { toast } from 'sonner';

interface JobStatus {
  recordid_: string;
  title: string | null;
  description: string | null;
  status: string | null;
  creationdate: string | null;
  closedate: string | null;
  type: string | null;
  duration: number | null;
  context: string | null;
}

const STATUS_COLORS: Record<string, { dot: string; label: string }> = {
  'Completato':   { dot: '#16a34a', label: '#dcfce7' },
  'In Corso':     { dot: '#2563eb', label: '#dbeafe' },
  'In Attesa':    { dot: '#d97706', label: '#fef3c7' },
  'Annullato':    { dot: '#dc2626', label: '#fee2e2' },
  'Altro':        { dot: '#6b7280', label: '#f3f4f6' },
};

function getStatusStyle(status: string) {
  return STATUS_COLORS[status] ?? STATUS_COLORS['Altro'];
}

export default function JobStatusSummary() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<JobStatus[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstanceClient.post('/postApi', {
          apiRoute: 'get_job_status_summary_api'
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }
        });

        if (response.data.success) {
          setData(response.data.data);
        } else {
          toast.error(response.data.error || 'Errore nel recupero dei dati');
        }
      } catch (error: any) {
        toast.error('Errore di connessione al server: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('it-IT', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const groupedData = data.reduce((acc, curr) => {
    const status = curr.status || 'Altro';
    if (!acc[status]) acc[status] = [];
    acc[status].push(curr);
    return acc;
  }, {} as Record<string, JobStatus[]>);

  const totalJobs = data.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-700" />
          <p className="text-sm text-slate-400 tracking-wide">Caricamento dati…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print + screen styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@400;500;600&display=swap');

        :root {
          --font-display: 'Lora', Georgia, serif;
          --font-body: 'DM Sans', sans-serif;
          --color-ink: #1a1a2e;
          --color-muted: #64748b;
          --color-rule: #e2e8f0;
          --color-bg: #f8f7f4;
          --color-surface: #ffffff;
          --color-accent: #1a1a2e;
        }

        .report-root {
          font-family: var(--font-body);
          background: var(--color-bg);
          color: var(--color-ink);
          min-height: 100vh;
          padding: 2.5rem 1.5rem 4rem;
        }

        .report-page {
          max-width: 680px;
          margin: 0 auto;
        }

        /* ── Header ── */
        .report-header {
          border-bottom: 2px solid var(--color-ink);
          padding-bottom: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .report-eyebrow {
          font-family: var(--font-body);
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--color-muted);
          margin-bottom: 0.5rem;
        }

        .report-title {
          font-family: var(--font-display);
          font-size: 2.25rem;
          font-weight: 600;
          line-height: 1.15;
          color: var(--color-ink);
          margin: 0 0 0.75rem;
        }

        .report-meta {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          font-size: 0.8rem;
          color: var(--color-muted);
        }

        .report-meta-sep {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--color-rule);
          display: inline-block;
        }

        .print-btn {
          margin-left: auto;
          padding: 0.45rem 1.1rem;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.04em;
          border: 1.5px solid var(--color-ink);
          border-radius: 4px;
          background: transparent;
          color: var(--color-ink);
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .print-btn:hover {
          background: var(--color-ink);
          color: #fff;
        }

        /* ── Status Section ── */
        .status-section {
          margin-bottom: 2.5rem;
        }

        .status-heading {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1rem;
        }

        .status-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-label {
          font-family: var(--font-body);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color-muted);
        }

        .status-count {
          margin-left: auto;
          font-size: 0.72rem;
          font-weight: 500;
          color: var(--color-muted);
        }

        /* ── Job Card ── */
        .job-card {
          border-top: 1px solid var(--color-rule);
          padding: 1.25rem 0;
        }

        .job-card:last-child {
          border-bottom: 1px solid var(--color-rule);
        }

        .job-card-top {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          margin-bottom: 0.6rem;
        }

        .job-title {
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 600;
          color: var(--color-ink);
          line-height: 1.3;
          flex: 1;
        }

        .job-context-badge {
          flex-shrink: 0;
          font-size: 0.68rem;
          font-weight: 500;
          letter-spacing: 0.06em;
          padding: 0.2rem 0.65rem;
          border-radius: 2px;
          border: 1px solid var(--color-rule);
          color: var(--color-muted);
          background: var(--color-bg);
          white-space: nowrap;
        }

        .job-description {
          font-size: 0.875rem;
          line-height: 1.7;
          color: #374151;
          white-space: pre-wrap;
          margin-bottom: 0.75rem;
        }

        .job-dates {
          display: flex;
          gap: 1.5rem;
          font-size: 0.75rem;
          color: var(--color-muted);
        }

        .job-dates span {
          font-weight: 600;
          color: #94a3b8;
          margin-right: 0.3rem;
        }

        /* ── Empty states ── */
        .empty-section {
          padding: 0.75rem 0;
          font-size: 0.825rem;
          color: #cbd5e1;
          font-style: italic;
        }

        .empty-page {
          text-align: center;
          padding: 5rem 0;
          font-family: var(--font-display);
          font-style: italic;
          color: var(--color-muted);
          font-size: 1.1rem;
        }

        /* ── Summary bar ── */
        .summary-bar {
          display: flex;
          gap: 1.5rem;
          flex-wrap: wrap;
          margin-bottom: 2.5rem;
          padding: 1rem 1.25rem;
          background: var(--color-surface);
          border: 1px solid var(--color-rule);
          border-radius: 6px;
        }

        .summary-stat {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .summary-stat-value {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1;
          color: var(--color-ink);
        }

        .summary-stat-label {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color-muted);
        }

        /* ── Print ── */
        @media print {
          @page {
            margin: 1.8cm 2cm;
            size: A4 portrait;
          }

          body, html {
            background: #fff !important;
          }

          .report-root {
            background: #fff !important;
            padding: 0 !important;
            /* Rimuove scroll e altezza fissa in stampa */
            max-height: none !important;
            overflow: visible !important;
          }

          .print-btn {
            display: none !important;
          }

          .job-card {
            break-inside: avoid;
          }

          .status-section {
            break-inside: avoid;
          }

          .summary-bar {
            break-inside: avoid;
            border: 1px solid #ddd !important;
          }

          .job-context-badge {
            border: 1px solid #ccc !important;
            background: #f9f9f9 !important;
          }
        }
      `}</style>

      <div className="report-root overflow-auto max-h-screen print:overflow-visible print:max-h-none">
        <div className="report-page">

          {/* ── Header ── */}
          <header className="report-header">
            <p className="report-eyebrow">Report Implementazioni</p>
            <h1 className="report-title">Sommario<br /><em>Implementazioni</em></h1>
            <div className="report-meta">
              <span>
                Generato il{' '}
                {new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
              <span className="report-meta-sep" />
              <span>{totalJobs} voc{totalJobs === 1 ? 'e' : 'i'} totali</span>
              <button className="print-btn" onClick={() => window.print()}>
                Stampa PDF
              </button>
            </div>
          </header>

          {/* ── Summary bar ── */}
          {Object.keys(groupedData).length > 0 && (
            <div className="summary-bar">
              {Object.entries(groupedData).map(([status, jobs]) => {
                const style = getStatusStyle(status);
                return (
                  <div className="summary-stat" key={status}>
                    <span className="summary-stat-value" style={{ color: style.dot }}>
                      {jobs.length}
                    </span>
                    <span className="summary-stat-label">{status}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Content ── */}
          {Object.keys(groupedData).length === 0 ? (
            <div className="empty-page">Nessuna implementazione trovata.</div>
          ) : (
            Object.entries(groupedData).map(([status, jobs]) => {
              const style = getStatusStyle(status);
              return (
                <section className="status-section" key={status}>
                  <div className="status-heading">
                    <span className="status-dot" style={{ background: style.dot }} />
                    <span className="status-label">{status}</span>
                    <span className="status-count">{jobs.length} voce{jobs.length !== 1 ? 'i' : ''}</span>
                  </div>

                  <div>
                    {jobs.length === 0 ? (
                      <p className="empty-section">Nessuna implementazione.</p>
                    ) : (
                      jobs.map((job) => (
                        <article className="job-card" key={job.recordid_}>
                          <div className="job-card-top">
                            <h3 className="job-title">{job.title || 'Senza Titolo'}</h3>
                            {job.context && (
                              <span className="job-context-badge">{job.context}</span>
                            )}
                          </div>

                          {job.description && (
                            <p className="job-description">{job.description}</p>
                          )}

                          {(job.creationdate || job.closedate) && (
                            <div className="job-dates">
                              {job.creationdate && (
                                <div><span>Creazione</span>{formatDate(job.creationdate)}</div>
                              )}
                              {job.closedate && (
                                <div><span>Chiusura</span>{formatDate(job.closedate)}</div>
                              )}
                            </div>
                          )}
                        </article>
                      ))
                    )}
                  </div>
                </section>
              );
            })
          )}

        </div>
      </div>
    </>
  );
}