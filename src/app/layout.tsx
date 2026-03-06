import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Political Crossroads',
    description: 'An interactive visual novel for political education',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    )
}
