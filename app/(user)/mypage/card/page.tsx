"use client";

import { useState } from "react";
import { CreditCard, Plus, Trash2 } from "lucide-react";

interface Card {
  id: string;
  brand: string;
  last4: string;
  expiry: string;
  isDefault: boolean;
}

const MOCK_CARDS: Card[] = [
  { id: "card-001", brand: "VISA", last4: "4242", expiry: "12/26", isDefault: true },
];

export default function CardPage() {
  const [cards, setCards] = useState<Card[]>(MOCK_CARDS);
  const [showForm, setShowForm] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardName, setCardName] = useState("");

  const removeCard = (id: string) => {
    if (confirm("このカードを削除しますか？")) {
      setCards((prev) => prev.filter((c) => c.id !== id));
    }
  };

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingCard(true);
    try {
      const res = await fetch("/api/square/register-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: `sandbox-${Date.now()}`, cardholderName: cardName }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (data.success) {
        const last4 = cardNumber.replace(/\s/g, "").slice(-4) || "0000";
        setCards((prev) => [
          ...prev,
          {
            id: data.cardId || `card-${Date.now()}`,
            brand: "VISA",
            last4,
            expiry: expiry || "00/00",
            isDefault: prev.length === 0,
          },
        ]);
        setShowForm(false);
        setCardNumber("");
        setExpiry("");
        setCvc("");
        setCardName("");
      } else {
        alert(data.message || "カードの登録に失敗しました");
      }
    } catch {
      alert("カードの登録に失敗しました");
    } finally {
      setAddingCard(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-[24px]">
        <div>
          <h1 className="font-serif text-2xl font-light text-black mb-[8px]">カード管理</h1>
          <p className="text-sm font-sans text-gray-500">お支払いに使用するカード</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-[8px] px-[16px] py-[10px] bg-black text-white text-sm font-sans font-medium hover:bg-gray-900 transition-colors"
        >
          <Plus className="w-[16px] h-[16px]" />
          カードを追加
        </button>
      </div>

      {/* Card List */}
      {cards.length === 0 ? (
        <div className="text-center py-[80px]">
          <CreditCard className="w-[40px] h-[40px] text-gray-200 mx-auto mb-[16px]" />
          <p className="text-sm font-sans text-gray-400 mb-[8px]">カードが登録されていません</p>
          <button
            onClick={() => setShowForm(true)}
            className="text-sm font-sans text-accent hover:underline"
          >
            カードを追加する
          </button>
        </div>
      ) : (
        <div className="space-y-[12px]">
          {cards.map((card) => (
            <div key={card.id} className="bg-white border border-gray-100 p-[24px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[16px]">
                  {/* Card visual */}
                  <div className="w-[80px] h-[50px] bg-gradient-to-br from-gray-800 to-gray-900 p-[8px] flex flex-col justify-between">
                    <span className="text-[8px] font-sans text-gray-400">{card.brand}</span>
                    <span className="text-[10px] font-sans text-white tracking-widest">•••• {card.last4}</span>
                  </div>
                  <div>
                    <p className="text-sm font-sans font-medium text-black">
                      {card.brand} •••• {card.last4}
                    </p>
                    <p className="text-xs font-sans text-gray-500 mt-[2px]">有効期限：{card.expiry}</p>
                    {card.isDefault && (
                      <span className="inline-block mt-[4px] text-xs font-sans text-accent bg-accent/10 px-[8px] py-[2px]">
                        デフォルト
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => removeCard(card.id)}
                  className="p-[8px] text-gray-400 hover:text-red-500 transition-colors"
                  aria-label="カードを削除"
                >
                  <Trash2 className="w-[16px] h-[16px]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Card Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowForm(false)}>
          <div className="bg-white w-full max-w-[420px] p-[32px] mx-[20px]" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-xl font-light text-black mb-[24px]">カードを追加</h2>
            <form className="space-y-[16px]" onSubmit={handleAddCard}>
              <div>
                <label className="block text-sm font-sans text-gray-600 mb-[6px]">カード番号</label>
                <input
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-[14px] py-[12px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-[12px]">
                <div>
                  <label className="block text-sm font-sans text-gray-600 mb-[6px]">有効期限</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-[14px] py-[12px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-sans text-gray-600 mb-[6px]">CVC</label>
                  <input
                    type="text"
                    placeholder="000"
                    maxLength={4}
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value)}
                    className="w-full px-[14px] py-[12px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-sans text-gray-600 mb-[6px]">カード名義</label>
                <input
                  type="text"
                  placeholder="TARO TANAKA"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full px-[14px] py-[12px] border border-gray-200 text-sm font-sans text-black placeholder:text-gray-400 focus:outline-none focus:border-black transition-colors"
                />
              </div>
              <div className="flex gap-[12px] pt-[8px]">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-gray-200 py-[12px] text-sm font-sans text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={addingCard}
                  className="flex-1 bg-black text-white py-[12px] text-sm font-sans font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  {addingCard ? "登録中..." : "追加する"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
