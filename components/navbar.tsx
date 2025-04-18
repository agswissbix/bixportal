import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image';
import { LogOut, Settings, User } from 'lucide-react';
import { useRecordsStore } from './records/recordsStore';
import { set } from 'lodash';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const isDev = false;
//INTERFACCE
    interface PropsInterface {
    }

    interface ResponseInterface {
      responseExampleValue: string;
    }




export default function NavBar() {
    //DATI
                    // DATI RESPONSE PER LO SVILUPPO 
                    const responseDataDEV: ResponseInterface = {
                    responseExampleValue: "Example"
                    };

                    // DATI RESPONSE DI DEFAULT
                    const responseDataDEFAULT: ResponseInterface = {
                    responseExampleValue: "Default"
                    };

                    // DATI DEL CONTESTO
                    const { user, handleLogout, activeServer } = useContext(AppContext);

                    interface NavigationItem {
                        name: string;
                        href: string;
                        current: boolean;
                    }
                    
                    const navigation: NavigationItem[] = [
                        //{ name: 'Dashboard', href: '#', current: true },
                        //{ name: 'Team', href: '#', current: false },
                        //{ name: 'Projects', href: '#', current: false },
                        //{ name: 'Calendar', href: '#', current: false },
                    ]
                    
                    function classNames(...classes: string[]) {
                        return classes.filter(Boolean).join(' ')
                    }

                    

    // IMPOSTAZIONE DELLA RESPONSE
    const [responseData, setResponseData] = useState<ResponseInterface>(isDev ? responseDataDEV : responseDataDEFAULT);



    // CHIAMATA AL BACKEND (solo se non in sviluppo)
    const { response, loading, error } = { response: null, loading: false, error: null };

    const{setSelectedMenu} = useRecordsStore()

   







    return (
        <GenericComponent response={responseData} loading={loading} error={error}> 
            {(data: ResponseInterface) => (
                <div>
                    
        <Disclosure id="navbar" as="nav" className="bg-navbar shadow-black w-full h-16" data-headless-ui-state="">
            <div className="mx-auto w-full px-2 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center justify-between">
                    <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
                        {/* Mobile menu button*/}
                        <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Open main menu</span>
                            <Bars3Icon aria-hidden="true" className="block h-6 w-6 group-data-[open]:hidden" />
                            <XMarkIcon aria-hidden="true" className="hidden h-6 w-6 group-data-[open]:block" />
                        </DisclosureButton>
                    </div>
                    <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                        <div className="hidden sm:ml-6 sm:block">
                            <div className="flex space-x-4">
                                {navigation.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        aria-current={item.current ? 'page' : undefined}
                                        className={classNames(
                                            item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                            'rounded-md px-3 py-2 text-sm font-medium',
                                        )}
                                    >
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                        <button
                            type="button"
                            className="relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
                        >
                            <span className="absolute -inset-1.5" />
                            <span className="sr-only">View notifications</span>
                            <BellIcon aria-hidden="true" className="h-6 w-6" />
                        </button>





                        {/* Profile dropdown */}
                        <Menu as="div" className="relative ml-3">
                            <div>
                                <MenuButton className="relative flex rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800">
                                    <span className="absolute -inset-1.5" />
                                    <span className="sr-only">Open user menu</span>
                                    <User className="w-8 h-8 text-gray-700" />
                                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-gradient-to-br from-indigo-200 to-green-500 rounded-full border-2 border-gray-800 shadow-lg"></div>
                                </MenuButton>
                            </div>
                            <MenuItems
                                transition
                                className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in"
                            >
                                <MenuItem>
                                    <div className="px-4 py-3 border-b border-gray-700/50">
                                        <p className="text-sm font-medium text-black">{user}</p>
                                        <p className="text-xs text-gray-7000">Utente attivo</p>
                                    </div>
                                </MenuItem>
                                <MenuItem>
                                    <a
                                        href="#"
                                        className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                                        onClick={() => setSelectedMenu('userSettings')}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Settings className="w-4 h-4" />
                                            <span>Settings</span>
                                        </div>
                                    </a>
                                </MenuItem>
                                <MenuItem>
                                    <a
                                        onClick={handleLogout}
                                        href="#"
                                        className="block px-4 py-2 text-sm text-gray-700 data-[focus]:bg-gray-100 data-[focus]:outline-none"
                                    >
                                        <div className="flex items-center gap-2">
                                            <LogOut className="w-4 h-4" />
                                            <span>Logout</span>
                                        </div>
                                    </a>
                                </MenuItem>
                            </MenuItems>
                        </Menu>
                        
                    </div>
                </div>
            </div>

            <DisclosurePanel className="sm:hidden">
                <div className="space-y-1 px-2 pb-3 pt-2">
                    {navigation.map((item) => (
                        <DisclosureButton
                            key={item.name}
                            as="a"
                            href={item.href}
                            aria-current={item.current ? 'page' : undefined}
                            className={classNames(
                                item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                                'block rounded-md px-3 py-2 text-base font-medium',
                            )}
                        >
                            {item.name}
                        </DisclosureButton>
                    ))}
                </div>
            </DisclosurePanel>
        </Disclosure>
                    
                </div>
            )}
        </GenericComponent>
    );
};


