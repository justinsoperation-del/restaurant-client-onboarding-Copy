import type { Metadata } from 'next';import './globals.css';
export const metadata:Metadata={title:"Justin's Operation | Restaurant Website Setup",description:'Review restaurant website setup and monthly support. Preview portal; payments currently disabled.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
