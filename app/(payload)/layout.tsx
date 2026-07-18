import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payload Admin",
};

export default function PayloadLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
