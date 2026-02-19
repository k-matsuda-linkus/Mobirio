"use client";
interface FilterOption{value:string;label:string;}
interface AdminFilterBarProps{searchPlaceholder?:string;filters?:{label:string;options:FilterOption[];value:string;onChange:(v:string)=>void}[];onSearch?:(q:string)=>void;}
export function AdminFilterBar({searchPlaceholder="検索...",filters,onSearch}:AdminFilterBarProps){
return(<div className="bg-white border border-gray-200 p-[16px] flex flex-wrap gap-[12px] items-center mb-[24px]">
<input type="text" placeholder={searchPlaceholder} onChange={(e)=>onSearch?.(e.target.value)} className="flex-1 min-w-[200px] border border-gray-300 px-[12px] py-[8px] text-sm font-sans focus:outline-none focus:border-accent"/>
{filters?.map((f,i)=>(<select key={i} value={f.value} onChange={(e)=>f.onChange(e.target.value)} className="border border-gray-300 px-[12px] py-[8px] text-sm font-sans">
<option value="">{f.label}</option>{f.options.map((o)=>(<option key={o.value} value={o.value}>{o.label}</option>))}</select>))}</div>);}
