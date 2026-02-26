"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { HardHat, Lock, User } from 'lucide-react';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const success = await login(username, password);
        if (success) {
            router.push('/');
        } else {
            setError('Credenciales incorrectas');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-50">
            {/* Professional Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-40"></div>
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-50 rounded-full blur-[100px] opacity-40"></div>

            {/* Login Card */}
            <div className="bg-white p-8 md:p-10 w-full max-w-md relative z-10 animate-fade-in shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200">
                <div className="text-center mb-10">
                    <div className="inline-flex p-4 rounded-xl bg-primary mb-6 shadow-lg shadow-primary/10 transition-transform hover:-translate-y-1 duration-300">
                        <HardHat size={40} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                        MINER<span className="text-primary">APP</span>
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">Gestión Administrativa Integral</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold animate-shake">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label htmlFor="username" className="text-sm font-bold text-slate-700 ml-0.5">Usuario</label>
                        <div className="relative group">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all duration-200"
                                placeholder="Nombre de usuario"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-bold text-slate-700 ml-0.5">Contraseña</label>
                        <div className="relative group">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary focus:bg-white transition-all duration-200"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-lg shadow-primary/10 transition-all duration-300 active:scale-[0.98] mt-4"
                    >
                        Acceder al Sistema
                    </button>

                    <div className="text-center mt-8 pt-4 border-t border-slate-50">
                        <p className="text-xs text-slate-400 font-medium">© {new Date().getFullYear()} MinerApp - Petroleum Blue Edition</p>
                    </div>
                </form>
            </div>
        </div>
    );
}
