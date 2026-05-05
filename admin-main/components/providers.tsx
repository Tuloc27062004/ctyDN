"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

export function Providers(props: { children: React.ReactNode; session: any }) {
  return (
    <SessionProvider session={props.session}>
      <ToastProvider>
        {props.children}
        <Toaster />
      </ToastProvider>
    </SessionProvider>
  );
}
