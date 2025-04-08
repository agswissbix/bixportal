import React, { useMemo, useContext, useState, useEffect } from 'react';
import { useApi } from '@/utils/useApi';
import GenericComponent from './genericComponent';
import { AppContext } from '@/context/appContext';
import { GridStack } from 'gridstack';
import 'gridstack/dist/gridstack.min.css';
import BarChart from './charts/barChart';
import LineChart from './charts/lineChart';
import HorizontalBarChart from './charts/horizontalBarChart';
import PieChart from './charts/pieChart';
import DonutChart from './charts/donutChart';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
// FLAG PER LO SVILUPPO
const isDev = true;

// INTERFACCE
        // INTERFACCIA PROPS
        interface PropsInterface {
          propExampleValue?: string;
        }

        // INTERFACCIA RISPOSTA DAL BACKEND
        interface ResponseInterface {
            blockList: {
                id: number;
                name: string;
                dashboardid: number | null;
                reportid: number | null;
                userid: number;
                viewid: number;
                widgetid: number | null;
                calendarid: number | null;
                width: number | null;
                height: number | null;
                order: number | null;
                gsx: number | null;
                gsy: number | null;
                gsw: number | null;
                gsh: number | null;
            }[];

            blocks: {
                id: number;
                dashboardBlockId: number;
                type: string;
                gsx: number;
                gsy: number;
                gsw: number;
                gsh: number;
                viewid: number;
                widgetid: number | null;
                width: string;
                height: string;
            }[];
        }

export default function Dashboard({ propExampleValue }: PropsInterface) {
    
    
    return (
        <div></div>
    );
};
