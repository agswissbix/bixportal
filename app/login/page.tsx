'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'sonner';
import Image from 'next/image';
import '../globals.css';
import { loginUserApi } from '@/utils/auth';
import LoadingComp from '@/components/loading';

export default function Login() {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    // Eseguiamo la chiamata al nostro proxy su /postApi
    const result = await loginUserApi(username, password);
    if (result.success) {

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
            router.push('/custom');
          
          }
      }
    } else {
      setIsLoading(false);
      toast.error(result.detail || 'Errore durante il login');
  }
  };

  return (
    <>
      <Toaster richColors position='top-center' />
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 bg-white">
        <div className="block sm:mx-auto sm:w-full sm:max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow-md dark:bg-white-800 dark:border-gray-200 mx-auto">
          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <Image
              src="/bixdata/logos/logo_tabellone3.png"
              alt="BixData"
              width={1000}
              height={1000}
              className="h-14 w-auto mx-auto bg-white"
              priority
            />
          </div>

          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm/6 font-medium text-gray-900"
                >
                  Username
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoComplete="on"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-bixcolor-light sm:text-sm/6 p-4"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-sm/6 font-medium text-gray-900"
                  >
                    Password
                  </label>
                  {/*
                  <div className="text-sm">
                    <a
                      href="#"
                      className="font-semibold text-bixcolor-default hover:text-bixcolor-light"
                    >
                      Password dimenticata?
                    </a>

                  </div>
                  */}
                </div>
                <div className="mt-2">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="on"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-bixcolor-light sm:text-sm/6 p-4"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-500 text-sm">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-bixcolor-default px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-bixcolor-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bixcolor-default"
                >
                  Accedi
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
