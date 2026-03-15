import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "REINFO API | Professional Mining Intelligence",
  description: "Acceso profesional al padrón minero de Perú con estadísticas en tiempo real y cuotas de consumo.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased custom-scrollbar`}>
        {children}
      </body>
    </html>
  );
}
