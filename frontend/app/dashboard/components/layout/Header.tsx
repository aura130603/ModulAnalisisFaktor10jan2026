"use client";

import React from 'react';
import Navbar from './Navbar'; // Desktop Menubar
import Toolbar from '../../data/components/Toolbar';
import HamburgerMenu from './HamburgerMenu'; // Mobile Drawer Menu
import { usePathname } from 'next/navigation';
import { useMetaStore } from '@/stores/useMetaStore';

/**
 * Header component untuk dashboard
 * Menampilkan navbar hanya ketika ada data yang dimuat
 * Menyembunyikan navbar di dashboard landing page
 */
export default function Header() {
    const pathname = usePathname();
    const { meta, isLoaded } = useMetaStore();
    
    // Tentukan apakah navbar harus ditampilkan
    // Navbar tidak ditampilkan jika:
    // 1. Berada di halaman dashboard utama (/dashboard) DAN
    // 2. Belum ada data yang dimuat (meta.name kosong)
    const shouldShowNavbar = !(pathname === '/dashboard' && (!meta.name || !isLoaded));
    
    // Toolbar hanya tampil di halaman data
    const showToolbar = pathname === '/dashboard/data';

    return (
        <header className="w-full bg-background flex flex-col flex-shrink-0" data-testid="dashboard-header">
            {/* Desktop Navbar - hanya tampil jika ada data */}
            {shouldShowNavbar && (
                <div className="hidden md:block" data-testid="desktop-navbar">
                    <Navbar />
                </div>
            )}

            {/* Mobile Hamburger Menu - hanya tampil jika ada data */}
            {shouldShowNavbar && (
                <div className="block md:hidden" data-testid="mobile-navbar">
                    <HamburgerMenu />
                </div>
            )}

            {/* Toolbar hanya tampil di halaman data */}
            {showToolbar && (
                <div className="border-t border-border" data-testid="data-toolbar">
                    <Toolbar />
                </div>
            )}
        </header>
    );
}