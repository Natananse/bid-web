#!/bin/bash

# Setup lib/api.ts
mkdir -p frontend/src/lib
cat << 'EOF' > frontend/src/lib/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
EOF

# Setup Providers
mkdir -p frontend/src/components/providers
cat << 'EOF' > frontend/src/components/providers/QueryProvider.tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
EOF

# Home Page
cat << 'EOF' > frontend/src/app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-blue-700 text-white p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">BidNest</h1>
        <nav className="flex gap-4">
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
        </nav>
      </header>
      <main className="flex-grow container mx-auto p-4">
        <div className="bg-blue-50 p-8 rounded-xl text-center mb-8">
          <h2 className="text-4xl font-bold text-blue-900 mb-4">Find your next treasure</h2>
          <p className="text-gray-600 mb-6">Fair, transparent auctions with provable randomness.</p>
          <Link href="/browse" className="bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700">
            Browse Auctions
          </Link>
        </div>
      </main>
    </div>
  );
}
EOF

# Layout update
cat << 'EOF' > frontend/src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/QueryProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BidNest',
  description: 'Provably fair online bidding platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
EOF

# Install axios
cd frontend && npm i axios
EOF
