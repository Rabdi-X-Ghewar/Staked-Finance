// import { GeistMono } from "next/font/google"
import { ThemeProvider } from "../components/component/theme-provider"
import { Header } from "../components/component/header"
// import { Footer } from "../components/component/footer"
import "../index.css"

// const geistMono = GeistMono({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Header />
          <main>{children}</main>
          {/* <Footer /> */}
        </ThemeProvider>
      </body>
    </html>
  )
}

