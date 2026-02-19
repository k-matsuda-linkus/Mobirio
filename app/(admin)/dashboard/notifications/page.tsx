"use client";
import { useState } from "react";
import { AdminTable } from "@/components/admin/AdminTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
const templates=[
{id:1,name:"キャンペーン通知",target:"全ユーザー",content:"期間限定キャンペーン実施中！"},
{id:2,name:"メンテナンス通知",target:"全ユーザー",content:"システムメンテナンスのお知らせ"},
{id:3,name:"ベンダー向け通知",target:"ベンダー",content:"新機能リリースのお知らせ"},
];
const history=[
{id:"N-001",title:"年末年始キャンペーン",target:"全ユーザー（856人）",sentAt:"2025-01-28 10:00",status:"送信済"},
{id:"N-002",title:"システムメンテナンス",target:"全ユーザー（856人）",sentAt:"2025-01-20 09:00",status:"送信済"},
{id:"N-003",title:"新ベンダー機能",target:"ベンダー（12社）",sentAt:"2025-01-15 14:00",status:"送信済"},
{id:"N-004",title:"冬季料金改定",target:"全ユーザー（840人）",sentAt:"2025-01-10 11:00",status:"送信済"},
];
export default function NotificationsPage(){
const[show,setShow]=useState(false);
return(<div><div className="flex items-center justify-between mb-[24px]">
<h1 className="font-serif text-2xl font-light">通知管理</h1>
<button onClick={()=>setShow(!show)} className="bg-accent text-white px-[20px] py-[10px] text-sm font-sans hover:opacity-90">一斉通知を送信</button></div>
{show&&(<div className="bg-white border border-gray-200 p-[24px] mb-[24px]">
<h3 className="font-serif text-lg font-light mb-[16px]">通知作成</h3>
<div className="space-y-[16px]"><div><label className="block text-sm font-sans text-gray-700 mb-[6px]">タイトル</label>
<input type="text" className="w-full border border-gray-300 px-[12px] py-[8px] text-sm font-sans" placeholder="通知タイトル"/></div>
<div><label className="block text-sm font-sans text-gray-700 mb-[6px]">対象</label>
<select className="border border-gray-300 px-[12px] py-[8px] text-sm font-sans"><option>全ユーザー</option><option>ベンダーのみ</option><option>一般ユーザーのみ</option></select></div>
<div><label className="block text-sm font-sans text-gray-700 mb-[6px]">本文</label>
<textarea rows={4} className="w-full border border-gray-300 px-[12px] py-[8px] text-sm font-sans" placeholder="通知内容を入力..."/></div>
<div className="flex gap-[8px]"><button className="bg-accent text-white px-[20px] py-[8px] text-sm font-sans hover:opacity-90">送信</button>
<button onClick={()=>setShow(false)} className="border border-gray-300 px-[20px] py-[8px] text-sm font-sans hover:bg-gray-50">キャンセル</button></div></div></div>)}
<div className="mb-[40px]"><h2 className="font-serif text-lg font-light mb-[16px]">テンプレート</h2>
<div className="bg-white border border-gray-200">{templates.map((t)=>(<div key={t.id} className="flex items-center justify-between px-[20px] py-[14px] border-b border-gray-100 last:border-0">
<div><p className="text-sm font-sans font-medium">{t.name}</p><p className="text-xs text-gray-400">{t.target} ・ {t.content}</p></div>
<button className="text-sm text-accent hover:underline">使用</button></div>))}</div></div>
<div><h2 className="font-serif text-lg font-light mb-[16px]">送信履歴</h2>
<AdminTable columns={[{key:"id",label:"ID"},{key:"title",label:"タイトル"},{key:"target",label:"対象"},{key:"sentAt",label:"送信日時"},
{key:"status",label:"ステータス",render:()=><StatusBadge status="送信済" variant="success"/>}]} data={history}/></div></div>);}
