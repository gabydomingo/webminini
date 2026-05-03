"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    const [mounted, setMounted] = React.useState(false);

    // useEffect solo se ejecuta en el cliente después del primer renderizado.
    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Si no estamos montados (es decir, estamos en el servidor), 
    // devolvemos los hijos envueltos en un fragmento para que no se rompa el layout,
    // pero sin el Provider que inyecta el script problemático.
    if (!mounted) {
        return <>{children}</>;
    }

    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}