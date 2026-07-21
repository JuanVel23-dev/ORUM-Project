import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ORUM · Portal de Administración",
  description: "Plataforma del club de beneficios ORUM.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable}`}>
      {/*
        suppressHydrationWarning: algunas extensiones del navegador (p. ej.
        Bitdefender con `bis_register`) inyectan atributos en <body> antes de
        que React cargue, lo que provoca un aviso de hydration. Esto le indica a
        React que ignore esas diferencias de atributos solo en esta etiqueta.
      */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
