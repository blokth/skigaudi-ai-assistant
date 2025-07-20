import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import ChatWidget from "@/components/ChatWidget";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "SkiGaudi – The Student Winter Festival",
	description:
		"4 days of skiing, 5 stages, 100 % good vibes. Log-in and join the party!",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`pt-16 ${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<AuthProvider>
					<Header />
					{children}
					<Footer />
					<ChatWidget />
				</AuthProvider>
			</body>
		</html>
	);
}
