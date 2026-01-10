// app/layout.tsx
import type { Metadata } from "next";
import "@/app/globals.css";
import "quill/dist/quill.core.css";
import "quill/dist/quill.snow.css";
import React from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
    title: "Statify",
    description: "Statistical analysis application",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head />
            <body className="h-full w-full m-0 p-0 grid grid-rows-[auto_1fr_auto] overflow-y-auto">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="light"
                    enableSystem
                    disableTransitionOnChange
                >
                    <div className="min-h-screen flex flex-col">
                        <main className="flex-grow">{children}</main>
                    </div>
                </ThemeProvider>
                <Toaster position="bottom-right" richColors closeButton />
            </body>
        </html>
    );
}
