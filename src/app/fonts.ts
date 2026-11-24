import { Inter, JetBrains_Mono, Unbounded } from "next/font/google";

// Pesos usados no protótipo (docs/design/prototipo). next/font baixa as fontes no build:
// em produção nenhuma requisição sai para o Google.
export const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-unbounded",
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const fontVariables = `${unbounded.variable} ${jetbrainsMono.variable} ${inter.variable}`;
