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
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
