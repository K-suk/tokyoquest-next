"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Button, CloseButton, Drawer, Portal } from "@chakra-ui/react";
import Link from "next/link";
import { signOut } from "next-auth/react";


const Appbar = () => {
    const [open, setOpen] = useState(false)
    return (
        <header className="bg-red-500 text-white flex justify-between items-center p-2">
            <div className="flex items-center">
                <Link href="/">
                    <Image src="/images/tokyoquest_logo.png" alt="Tokyo QUEST Logo" width={100} height={100} />
                </Link>
            </div>
            {/* <button className="text-3xl"></button> */}
            <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
                <Drawer.Trigger asChild>
                    <Button variant="outline" size="xl" className="text-5xl">
                        ☰
                    </Button>
                </Drawer.Trigger>
                <Portal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content>
                            <Drawer.Body className="bg-red-500 text-white">
                                <li className="text-2xl my-8">
                                    <Link href="/profile" onClick={() => setOpen(false)}>Profile</Link>
                                </li>
                                <li className="text-2xl">
                                    <button onClick={() => signOut({ callbackUrl: "/login" })}>
                                        Sign Out
                                    </button>
                                </li>
                            </Drawer.Body>
                            <Drawer.CloseTrigger asChild>
                                <CloseButton size="xl" className="text-white" />
                            </Drawer.CloseTrigger>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </Portal>
            </Drawer.Root>
        </header>
    );
};

export default Appbar;