"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard,Store,Users,CalendarDays,Bike,CreditCard,BarChart3,Star,MessageSquare,TrendingUp,Bell,Settings } from "lucide-react";
import { NavItem } from "@/lib/constants";
import { useState } from "react";
const iconMap:Record<string,React.ElementType>={LayoutDashboard,Store,Users,CalendarDays,Bike,CreditCard,BarChart3,Star,MessageSquare,TrendingUp,Bell,Settings};
interface SidebarProps{items:NavItem[];currentPath:string;title:string;}
export function Sidebar({items,title}:SidebarProps){
const pathname=usePathname();
const[isOpen,setIsOpen]=useState(false);
const asideCls="fixed top-[70px] left-0 bottom-0 w-[260px] bg-white border-r border-gray-200 z-40 overflow-y-auto transition-transform ";
return(<>
<button onClick={()=>setIsOpen(!isOpen)} className="fixed top-[80px] left-[10px] z-40 md:hidden bg-white border border-gray-200 p-[8px]"><LayoutDashboard className="w-[20px] h-[20px]"/></button>
{isOpen&&<div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={()=>setIsOpen(false)}/>}
<aside className={asideCls+(isOpen?"translate-x-0":"-translate-x-full md:translate-x-0")}>
<div className="p-[20px] border-b border-gray-200"><h2 className="font-serif text-lg font-light">{title}</h2></div>
<nav className="p-[12px]">{items.map((item)=>{
const act=pathname===item.href||(item.href!=="/dashboard"&&pathname.startsWith(item.href));
const Icon=item.icon?iconMap[item.icon]:null;
const cls="flex items-center gap-[12px] px-[16px] py-[10px] text-sm font-sans mb-[2px] "+(act?"bg-accent/10 text-accent border-l-[3px] border-accent":"text-gray-600 hover:bg-gray-50");
return(<Link key={item.href} href={item.href} onClick={()=>setIsOpen(false)} className={cls}>
{Icon&&<Icon className="w-[18px] h-[18px]"/>}<span>{item.label}</span></Link>);})}</nav></aside></>);}
