import React from "react";
import Link from "next/link";
import { Button } from "@/shared/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/shared/components/ui/card";
import { ShieldAlert, Home, LogIn } from "lucide-react";

export default function AccesoDenegadoPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="max-w-md w-full text-center border-destructive/20 shadow-lg">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-foreground">Acceso Restringido</CardTitle>
          <CardDescription className="text-base mt-2">
            Error 401 / 403
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <p className="text-muted-foreground">
            Parece que intentaste ingresar a una zona privada de la clínica. Si eres parte de nuestro equipo o un cliente registrado, por favor inicia sesión.
          </p>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Ir al Inicio
            </Link>
          </Button>
          <Button className="w-full sm:w-auto" asChild>
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Iniciar Sesión
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}