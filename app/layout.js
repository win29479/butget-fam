import "./globals.css";

export const metadata = {
  title: "Family Budget",
  description: "ตั้งงบแบบ 50 - 30 - 20 พร้อมจัดการรายจ่ายตามหมวด",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        {children}
        <div id="confettiRoot" />
      </body>
    </html>
  );
}
