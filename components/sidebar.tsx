import React, {useEffect} from 'react';
import {useState} from "react";
import { Home, Package, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import LoadingComp from './loading';
import ReactDOM from 'react-dom';
import axiosInstance from '../utils/axiosInstance';
import SidebarMenu from './sidebarMenu';
import GenericComponent from './genericComponent';


// INTERFACCIA PROPS
interface PropsInterface {
}

export default function SideBar({  }: PropsInterface) {
  return (
        <div className="h-full xl:w-1/12 2xl:w-2/12 3xl:w-1/12"> 
           <SidebarMenu ></SidebarMenu>
        </div>
  );
};


