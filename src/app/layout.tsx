import "./globals.css";
export const metadata = { title: "Onboard AI", description: "Hire smarter. Welcome better. Grow faster." };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>{children}</body></html>);
}
