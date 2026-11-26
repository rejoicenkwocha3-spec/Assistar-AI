"use client";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const GRID = "#E5EAE4", AXIS = "#718078", FOREST = "#123D32", SAGE = "#A8BFA8";

export function TrendChart({ data }: { data: { day: string; conversations: number; escalated: number }[] }) {
  return (
    <div className="h-64 w-full" role="img" aria-label="Conversations per day">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="day" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${GRID}`, fontSize: 12 }} />
          <Line type="monotone" dataKey="conversations" name="Conversations" stroke={FOREST} strokeWidth={2.5} dot={false} />
          <Line type="monotone" dataKey="escalated" name="Escalated" stroke="#B45309" strokeWidth={2} dot={false} strokeDasharray="4 3" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChannelChart({ data }: { data: { channel: string; total: number; resolved: number }[] }) {
  return (
    <div className="h-56 w-full" role="img" aria-label="Conversations by channel">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="channel" stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke={AXIS} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${GRID}`, fontSize: 12 }} />
          <Bar dataKey="total" name="Total" fill={FOREST} radius={[4, 4, 0, 0]} />
          <Bar dataKey="resolved" name="Resolved" fill={SAGE} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
