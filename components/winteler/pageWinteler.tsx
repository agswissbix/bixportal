import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import CheckList from './components/checkList/checkList';
import NoteSpese from './components/noteSpese/pageNoteSpese';
import NuovaAuto from './components/nuovaAuto/nuovaAuto';
import PreventivoCarrozzeria from './components/preventivoCarrozzeria/preventivoCarrozzeria';
import MenuProveAuto from './components/proveAuto/menuProveAuto';
import NuovaProvaAuto from './components/proveAuto/nuovaProvaAuto';
import ProveAuto from './components/proveAuto/proveAuto';
import SchedaAuto from './components/schedaAuto/schedaAuto';
import SchedaDettagliAuto from './components/schedaAuto/schedaDettagliAuto';
import MenuServiceman from './components/serviceman/menuServiceman';
import NuovaServiceman from './components/serviceman/nuovaServiceman';
import Serviceman from './components/serviceman/serviceman';
import Login from './components/login/login';
import Menu from './components/menu/pageMenu';
import { checkAuth, logoutUser } from '@/utils/auth';
import { toast } from 'sonner';

const MappedComponents = {
    "login": Login,
    "menu": Menu,
    "scheda-auto": SchedaAuto,
    "scheda-dettagli-auto": SchedaDettagliAuto,
    "note-spese": NoteSpese,
    "menu-prove-auto": MenuProveAuto,
    "prove-auto": ProveAuto,
    "nuova-prova-auto": NuovaProvaAuto,
    "menu-serviceman": MenuServiceman,
    "nuova-serviceman": NuovaServiceman,
    "serviceman": Serviceman,
    "preventivo-carrozzeria": PreventivoCarrozzeria,
    "nuova-auto": NuovaAuto,
    "check-list": CheckList
};

const PUBLIC_VIEWS = ['login'];

const AuthGuard = ({ viewName, onChangeView, children }) => {
    const [isChecking, setIsChecking] = useState(true);

    const logout = async () => {
        try {
            const status = await logoutUser();
            if (!status.success) {
                toast.error("Errore durante il logout: " + (status.detail || ""));
                return;
            }
            onChangeView('login');
            toast.success("Logout effettuato con successo");
        } catch (error) {
            console.error("Errore durante il logout", error);
            toast.error("Errore durante il logout");
        }
    }

    useEffect(() => {
        let isMounted = true;

        const verify = async () => {
            if (PUBLIC_VIEWS.includes(viewName)) {
                if (isMounted) setIsChecking(false);
                return;
            }

            try {
                setIsChecking(true);
                const result = await checkAuth();
                
                if (isMounted) {
                    if (!result.isAuthenticated) {
                        console.warn("Accesso negato: Utente non autenticato.");
                        logout();
                    } else {
                        setIsChecking(false);
                    }
                }
            } catch (error) {
                console.error("Errore durante la verifica auth:", error);
                if (isMounted) onChangeView('login');
            }
        };
        verify();

        return () => { isMounted = false; };
    }, [viewName, onChangeView]);

    return children;
};

export default function PageWinteler() {
    const [viewState, setViewState] = useState({
        currentView: 'login',
        data: null
    });

    const changeView = (newView, data = null) => {
        if (newView === viewState.currentView) return;
        setViewState({
            currentView: newView,
            data: data
        });
    }

    useEffect(() => {
        const initialCheck = async () => {
            const result = await checkAuth();
            if (result.isAuthenticated) {
                changeView('menu');
            }
        };
        initialCheck();
    }, []); 

    const CurrentComponent = MappedComponents[viewState.currentView];

    return (
        <div className="flex items-start justify-center p-0 sm:p-4 overflow-y-auto max-h-screen">
            <div className="overflow-hidden bg-white shadow-md border border-gray-200">
                <div className="w-full flex flex-col justify-center items-center p-4">
                    <Image
                        src="/bixdata/logos/winteler.png"
                        alt="Logo Winteler"
                        width={400}
                        height={200}
                        className="w-full h-auto"
                        priority
                    />
                </div>

                <div className="p-2 sm:p-0">
                    <AuthGuard 
                        viewName={viewState.currentView} 
                        onChangeView={changeView}
                    >
                        {CurrentComponent ? (
                            <CurrentComponent
                                onChangeView={changeView}
                                data={viewState.data}
                            />
                        ) : (
                            <div className="p-8 text-center text-red-500">
                                <p>Errore 404: Vista non trovata!</p>
                            </div>
                        )}
                    </AuthGuard>
                </div>

            </div>
        </div>
    );
};