import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type StatCardItem = {
  title: string;
  value: number | string;
  subtitle?: string;
};

type StatCardsProps = {
  items: StatCardItem[];
  columns?: 2 | 3 | 4;
};

export function StatCards({ items, columns = 4 }: StatCardsProps) {
  const gridClass =
    columns === 2
      ? "grid gap-4 md:grid-cols-2"
      : columns === 3
      ? "grid gap-4 md:grid-cols-3"
      : "grid gap-4 md:grid-cols-2 xl:grid-cols-4";

  return (
    <div className={gridClass}>
      {items.map((item) => (
        <Card key={item.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              {item.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{item.value}</div>
            {item.subtitle ? (
              <p className="mt-1 text-xs text-zinc-500">{item.subtitle}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}