interface BookingSummaryProps {
  bikeName: string;
  vendorName: string;
  startDatetime: string;
  endDatetime: string;
  duration: string;
  basePrice: number;
  optionTotal: number;
  cdw: number;
  noc: number;
  total: number;
}

export function BookingSummary({ bikeName, vendorName, startDatetime, endDatetime, duration, basePrice, optionTotal, cdw, noc, total }: BookingSummaryProps) {
  return (
    <div className="border border-gray-100 p-[30px]">
      <h3 className="font-serif font-light text-xl mb-[24px]">予約内容</h3>
      <div className="grid md:grid-cols-2 gap-[30px]">
        <div className="space-y-[12px]">
          <div><span className="text-xs text-gray-400">バイク</span><p className="text-sm font-medium">{bikeName}</p></div>
          <div><span className="text-xs text-gray-400">店舗</span><p className="text-sm">{vendorName}</p></div>
          <div><span className="text-xs text-gray-400">利用開始</span><p className="text-sm">{startDatetime}</p></div>
          <div><span className="text-xs text-gray-400">返却</span><p className="text-sm">{endDatetime}</p></div>
          <div><span className="text-xs text-gray-400">期間</span><p className="text-sm">{duration}</p></div>
        </div>
        <div className="space-y-[8px]">
          <div className="flex justify-between text-sm"><span>基本料金</span><span>¥{basePrice.toLocaleString()}</span></div>
          {optionTotal > 0 && <div className="flex justify-between text-sm"><span>オプション</span><span>¥{optionTotal.toLocaleString()}</span></div>}
          {cdw > 0 && <div className="flex justify-between text-sm"><span>CDW</span><span>¥{cdw.toLocaleString()}</span></div>}
          {noc > 0 && <div className="flex justify-between text-sm"><span>NOC</span><span>¥{noc.toLocaleString()}</span></div>}
          <div className="flex justify-between text-2xl font-medium pt-[12px] border-t border-gray-100">
            <span>合計</span><span>¥{total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
