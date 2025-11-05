import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Construtor de Prompts Inteligente',
  description: 'Assistente dinâmico para elaborar prompts complexos e completos.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
