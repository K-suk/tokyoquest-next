'use client';

import { usePathname } from 'next/navigation';
import Appbar from './Appbar';

export default function ConditionalHeader() {
    const pathname = usePathname();

    // Don't show header on login page
    if (pathname === '/login') {
        return null;
    }

    return <Appbar />;
} 