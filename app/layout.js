import "./globals.css";

export const metadata = {
  title: "BAT Consulting — LMS",
  description: "Платформа обучения BAT Consulting",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
