"use client";

import React from "react";
import { Search, Mail, Phone, Briefcase, Clock, UserCheck, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";

interface PersonalTableProps {
  personalFiltrado: any[];
  busqueda: string;
  setBusqueda: (val: string) => void;
  filtroRol: string;
  setFiltroRol: (val: string) => void;
  onToggleEstado: (id: string, nombres: string) => void;
  onEdit: (user: any) => void;
  onDelete: (id: string) => void;
}

export function PersonalTable({
  personalFiltrado,
  busqueda,
  setBusqueda,
  filtroRol,
  setFiltroRol,
  onToggleEstado,
  onEdit,
  onDelete,
}: PersonalTableProps) {
  return (
    <Card className="rounded-3xl border-border/50 shadow-md overflow-hidden">
      <CardHeader className="bg-muted/20 border-b border-border/30 pb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar personal por nombre o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
          <Select value={filtroRol} onValueChange={setFiltroRol}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los roles</SelectItem>
              <SelectItem value="Administrador">Administradores</SelectItem>
              <SelectItem value="Veterinario">Veterinarios</SelectItem>
              <SelectItem value="Cajero">Cajeros</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-muted/20">
            <TableRow>
              <TableHead className="py-4 px-6 font-semibold">Profesional</TableHead>
              <TableHead className="font-semibold">Contacto</TableHead>
              <TableHead className="font-semibold">Rol</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {personalFiltrado.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No se encontró personal registrado.
                </TableCell>
              </TableRow>
            ) : (
              personalFiltrado.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/30 transition-colors border-b-border/30">
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {p.rawUser?.avatar_url && <AvatarImage src={p.rawUser.avatar_url} alt={p.nombres} />}
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {p.nombres.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-foreground">{p.nombres}</p>
                        <span className="text-xs text-muted-foreground font-mono">{p.id}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="space-y-1">
                      <p className="flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {p.email}</p>
                      <p className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {p.celular}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.rol === "Administrador" ? "default" : p.rol === "Veterinario" ? "secondary" : "outline"} className="rounded-full">
                      {p.rol}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <button onClick={() => onToggleEstado(p.id, p.nombres)}>
                      {p.activo ? (
                        <Badge className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-1 cursor-pointer">
                          <UserCheck className="h-3 w-3" /> Activo
                        </Badge>
                      ) : (
                        <Badge className="bg-zinc-500 hover:bg-zinc-600 text-white flex items-center gap-1 cursor-pointer">
                          Inactivo
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(p.rawUser)} className="rounded-xl"><Edit2 className="h-4 w-4 text-muted-foreground" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => onDelete(p.id)} className="rounded-xl text-destructive hover:text-destructive/80"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
