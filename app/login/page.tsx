'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import Image from 'next/image';
import '../globals.css';
import { loginUserApi, getActiveServer } from '@/utils/auth';
import LoadingComp from '@/components/loading';
import { useRecordsStore } from '@/components/records/recordsStore';
import { Eye, EyeClosed } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [activeServer, setActiveServer] = useState<string>('');
  
  useEffect(() => {
    const fetchActiveServer = async () => {
      const server = await getActiveServer();
      setActiveServer(server.activeServer);
    };
    fetchActiveServer();
  }, []);

  useEffect(() => {
    document.documentElement.classList.add('default');
}, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // Eseguiamo la chiamata al nostro proxy su /postApi
    const result = await loginUserApi(username, password);
    if (result.success) {
    
      if (activeServer === 'telefonoamico') {
        // Routing in base allo user
        if (password === 'BixTA25!') {
          router.push('/change-password');
          setTimeout(() => {
            toast.warning('Password scaduta, si prega di cambiarla');
          }, 400);
        } else {
          if (username === 'mariangela' || username === 'jacqueline' || username === 'marsal') {
            router.push('/verify-2fa');
            //router.push('/testcomponent/scheduleCalendar');
            } else {
              router.push('/custom/ta');
            }
        }
      } else {

          router.push('/home');
        
      }

    } else {
      setIsLoading(false);
      console.log(result)
      setError("Username e/o passowrd incorretti.")
      // toast.error(result.detail || 'Errore durante il login');
  }
  };

  return (
    <>
      <Toaster richColors position='top-center' />
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-card">
        <div className="block sm:mx-auto sm:w-full sm:max-w-sm p-8 bg-card rounded-lg shadow-lg shadow-primary mx-auto">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm bg-primary p-4 rounded-md mb-6">
            <Image
              src={`/bixdata/logos/_default.png`}
              alt={activeServer}
              width={1000}
              height={1000}
              className="h-14 w-auto mx-auto"
              priority
            />
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm/6 font-medium text-primary"
                >
                  Username
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    placeholder='Inserisci il tuo username'
                    autoComplete="on"
                    tabIndex={1}
                    className="block w-full rounded-md py-3 px-4 text-primary bg-transparent border shadow-sm ring-1 ring-inset ring-border placeholder:text-badge focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm/6 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm/6 font-medium text-primary"
                  >
                    Password
                  </label>
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={() => router.push('/forgot-password')}
                      disabled={isLoading}
                      tabIndex={5}
                      className="font-semibold text-primary hover:text-primary-hover transition-colors duration-200 disabled:opacity-50"
                    >
                      Password dimenticata?
                    </button>
                  </div>
                </div>
                <div className="relative mt-2">
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder='Inserisci la tua password'
                    autoComplete="on"
                    tabIndex={2}
                    className="block w-full rounded-md py-3 px-4 text-primary bg-transparent border shadow-sm ring-1 ring-inset ring-border placeholder:text-badge focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm/6 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    title={show ? "Nascondi password" : "Mostra password"}
                    tabIndex={3}
                    className="absolute inset-y-0 right-3 flex items-center text-primary hover:text-primary-hover transition-colors duration-200"
                    >
                    {show ? <EyeClosed size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                // <div className="text-accent-foreground bg-accent text-sm p-3 rounded-md border border-accent">
                <div className="text-red-700 bg-red-100 text-sm p-3 rounded-md border border-red-700">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  tabIndex={4}
                  className="flex w-full justify-center rounded-md bg-primary px-4 py-3 text-sm/6 font-semibold text-primary-foreground shadow-sm hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all duration-200 hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? 'Accesso in corso...' : 'Accedi'}
                </button>
              </div>
            </form>
            <div>
            </div>
          </div>
        </div>
        <div className="mt-6">
        {isLoading && <LoadingComp />}
        </div>
      </div>
    </>
  );
}