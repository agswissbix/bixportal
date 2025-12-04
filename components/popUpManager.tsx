import React, { use, useMemo, useState } from 'react';
import { useRecordsStore } from './records/recordsStore';
import PopupEmail from './popupContent/popupEmail';
import PopupReportGasolio from './popupContent/popupReportGasolio';
import PopupContractHours from './popupContent/popupContractHours';
import PopupStartDate from './popupContent/popupStartDate';
import { CircleX } from 'lucide-react';
import PopupInvoiceNo from './popupContent/popupInvoiceNo';
import { TemplateSelectionDialog } from './templateProjectDialog';
import SignatureDialogWrapper from './dialogs/signatureTimesheetDialog';


// INTERFACCIA PROPS
interface PropsInterface {
    isOpen: boolean;
    onClose: () => void;
    type: string;
    tableid?: string;
    recordid?: string;
}

export default function PopUpManager({isOpen, onClose, type, tableid, recordid }: PropsInterface) {

    if (!isOpen) return null;
    const [popupContent, setPopupContent] = useState<React.ReactNode>(null);

    return (
        <>
        {type === 'templateProject' ? 
            <TemplateSelectionDialog onClose={onClose} open={isOpen} recordid={recordid} />
        : type === 'signatureTimesheet' ?
            <SignatureDialogWrapper recordid={recordid} openSignatureDialog={isOpen} setOpenSignatureDialog={onClose}/>
            : (
        <div className="fixed inset-0 flex h-fix items-center justify-center bg-black bg-opacity-50 z-[1000]">
            <div className="bg-white p-6 rounded-lg shadow-lg w-fix h-fix flex flex-col">
            <CircleX
                    className="w-6 h-6 text-gray-500 relative mb-2 float-start  cursor-pointer"
                    onClick={onClose}
                    />
                {type === 'emailLavanderia' && <PopupEmail tableid={tableid} recordid={recordid} onClose={onClose} type='emailLavanderia' />}
                {type === 'emailGasolio' && <PopupEmail tableid={tableid} recordid={recordid} onClose={onClose} type='emailGasolio' />}
                {type === 'reportGasolio' && <PopupReportGasolio tableid={tableid} recordid={recordid} />}
                {type === 'contracthours' && <PopupContractHours tableid={tableid} recordid={recordid} onClose={onClose} />}
                {type === 'startDate' && <PopupStartDate tableid={tableid} recordid={recordid} onClose={onClose} />}
                {type === 'invoiceno' && <PopupInvoiceNo tableid={tableid} recordid={recordid} onClose={onClose} />}

            </div>
        </div>
        )}
        </>
    );
};

