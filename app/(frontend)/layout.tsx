import type { Metadata } from "next";
import "../../src/styles.css";

export const metadata: Metadata = {
  title: "Jorge Manzur",
  description: "Portfolio de Jorge Manzur",
};

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
