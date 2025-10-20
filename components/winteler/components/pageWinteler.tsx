import React, { useMemo, useContext, useState, useEffect } from 'react';
import Image from 'next/image';
import Login from './login/login';
import Menu from './menu/pageMenu';
import SchedaAuto from './schedaAuto/schedaAuto';
import SchedaDettagliAuto from './schedaAuto/schedaDettagliAuto';
import NoteSpese from './noteSpese/pageNoteSpese';
import MenuProveAuto from './proveAuto/menuProveAuto';
import ProveAuto from './proveAuto/proveAuto';
import NuovaProvaAuto from './proveAuto/nuovaProvaAuto';
import MenuServiceman from './serviceman/menuServiceman';
import NuovaServiceman from './serviceman/nuovaServiceman';
import Serviceman from './serviceman/serviceman';
import PreventivoCarrozzeria from './preventivoCarrozzeria/preventivoCarrozzeria';
import NuovaAuto from './nuovaAuto/nuovaAuto';
import CheckList from './checkList/checkList';

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

export default function PageWinteler() {
    const [viewState, setViewState] = useState(
        {
            currentView: 'login',
            data: null
        }
    );

    const changeView = (newView, data = null) => {
        setViewState({
            currentView: newView,
            data: data
        });
    }

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
                    />
                </div>

                {CurrentComponent ? (
                    <CurrentComponent
                        onChangeView={changeView}
                        data={viewState.data}
                    />
                ) : (
                    <p>Page not found!</p>
                )}
            </div>
        </div>
    );
};


