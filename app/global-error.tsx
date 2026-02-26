"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "30px", fontFamily: "sans-serif" }}>
          <div style={{ textAlign: "center", maxWidth: "480px" }}>
            <p style={{ fontSize: "120px", fontWeight: 300, lineHeight: 1, color: "#e5e7eb", margin: 0 }}>
              500
            </p>
            <h1 style={{ marginTop: "20px", fontWeight: 300, fontSize: "24px" }}>
              エラーが発生しました
            </h1>
            <p style={{ marginTop: "12px", color: "#6b7280", fontSize: "14px" }}>
              予期しないエラーが発生しました。ページを再読み込みしてください。
            </p>
            <button
              onClick={reset}
              style={{ marginTop: "30px", padding: "14px 32px", backgroundColor: "#000", color: "#fff", border: "none", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}
            >
              再試行
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
