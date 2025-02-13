import React, {useEffect} from 'react';
import {useState} from "react";
import { Home, Package, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import LoadingComp from './loading';
import ReactDOM from 'react-dom';
import axiosInstance from '../utils/axiosInstance';
import SidebarMenu from './sidebarMenu';


// INTERFACCIA PROPS
interface PropsInterface {
    setSelectedMenu: (item: string) => void;
}

export default function SideBar({ setSelectedMenu }: PropsInterface) {
  return (
    <div className="w-1/12 h-full"> 
           <SidebarMenu ></SidebarMenu>
    </div>
  );
};


