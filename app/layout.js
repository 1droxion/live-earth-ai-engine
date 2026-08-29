import './styles.css';

export const metadata = {
  title: 'Live Earth',
  description: 'A persistent autonomous digital civilization observer.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
