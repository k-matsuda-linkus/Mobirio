import { ReportChart } from "@/components/admin/ReportChart";
import { AdminStatsCard } from "@/components/admin/AdminStatsCard";
export default function AnalyticsPage(){return(<div>
<h1 className="font-serif text-2xl font-light mb-[24px]">アクセス解析</h1>
<div className="bg-yellow-50 border border-yellow-200 p-[16px] mb-[24px]">
<p className="text-sm font-sans text-yellow-700">Google Analytics連携予定 — 現在はプレースホルダーデータを表示しています</p></div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] mb-[30px]">
<AdminStatsCard title="月間PV" value="45,230" change="+12.3%"/>
<AdminStatsCard title="ユニークユーザー" value="8,450" change="+8.7%"/>
<AdminStatsCard title="平均滞在時間" value="3:24" change="+0:15"/>
<AdminStatsCard title="直帰率" value="42.5%" change="-2.1%"/></div>
<div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px] mb-[24px]">
<ReportChart title="PV推移（月間）" type="line"/><ReportChart title="ページ別PV" type="bar"/></div>
<div className="grid grid-cols-1 lg:grid-cols-2 gap-[24px]">
<ReportChart title="デバイス別アクセス" type="pie" height={250}/><ReportChart title="地域別アクセス" type="bar" height={250}/></div></div>);}
