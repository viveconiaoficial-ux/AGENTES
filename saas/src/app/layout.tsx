import type { Metadata } from "next";
import "./critical.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vive · Agentes IA",
  description:
    "Asistente de IA y agendamiento por WhatsApp y web para tu negocio.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" style={{ minHeight: "100%" }}>
      <head>
        <style
          id="vive-critical-inline"
          dangerouslySetInnerHTML={{
            __html: `
            html { background-color:#050507 !important; min-height:100%; }
            body { margin:0 !important; min-height:100vh !important; background-color:#050507 !important; color:#ffffff !important; }
          `,
          }}
        />
      </head>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#050507",
          color: "#ffffff",
        }}
      >
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{document.documentElement.style.background='#050507';document.body.style.background='#050507';document.body.style.color='#ffffff';}catch(e){}",
          }}
        />
        {children}
      </body>
    </html>
  );
}
