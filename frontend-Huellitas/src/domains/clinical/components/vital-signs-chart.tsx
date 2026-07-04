"use client";

import React from "react";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/shared/components/ui/chart";

interface VitalSignsChartProps {
  data: any[] | undefined;
  chartConfig: any;
}

export function VitalSignsChart({ data, chartConfig }: VitalSignsChartProps) {
  return (
    <Card className="rounded-3xl border-border/50 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> Curva de Constantes
        </CardTitle>
        <CardDescription>Monitoreo de signos vitales hoy.</CardDescription>
      </CardHeader>
      <CardContent className="h-[250px] w-full">
        {data && data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="fc" name="Frec. Cardíaca" stroke="var(--color-fc)" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="temp" name="Temperatura" stroke="var(--color-temp)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-12">No hay registros hoy para este paciente.</p>
        )}
      </CardContent>
    </Card>
  );
}
