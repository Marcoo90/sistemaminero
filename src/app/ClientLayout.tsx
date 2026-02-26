"use client";

import React from 'react';
import { AuthProvider } from "@/context/AuthContext";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { usePathname } from "next/navigation";

function InnerLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLoginPage = pathname === '/login';

    if (isLoginPage) {
        return (
            <main className="min-h-screen bg-background text-foreground">
                {children}
            </main>
        );
    }

    return (
        <div className="flex min-h-screen bg-background selection:bg-blue-100 selection:text-blue-900">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar relative bg-background">
                    <div className="mx-auto w-full max-w-[1700px] min-h-full flex flex-col">
                        <div className="p-3 md:p-8 lg:p-10 flex-1">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <InnerLayout>{children}</InnerLayout>
        </AuthProvider>
    );
}
