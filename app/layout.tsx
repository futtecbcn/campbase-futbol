import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampBase | Gestió de futbol base",
  description: "Plataforma de gestió esportiva per a entrenadors de futbol base"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
