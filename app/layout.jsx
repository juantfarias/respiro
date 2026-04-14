import { Geist } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const geist = Geist({ subsets: ["latin"] })

export const metadata = {
  title: 'Respiro - Gerencie suas pausas',
  description: 'Ajude a gerenciar pausas e hobbies para evitar procrastinação e excesso de trabalho',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body className={`${geist.className} antialiased`}>
        {children}
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  )
}
