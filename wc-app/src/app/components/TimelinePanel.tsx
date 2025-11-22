export default function TimelinePanel() {
  const items = [
    { label: "AFC Qualifier Round 1", date: "2001-12-19" },
    { label: "Test 2", date: "2001-12-19" },
  ];

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-6 text-left shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Timeline
      </p>

      <div className="relative mt-6 pl-2">
        <div className="absolute top-0 bottom-0 w-px bg-border -translate-x-1/2" />

        <div className="space-y-10">
          {items.map((item, index) => (
            <div key={index} className="flex gap-4">
              <div className="h-3 w-3 rounded-full bg-emerald-500 -translate-x-1/2 translate-y-1/2" />
              <div className="">
                <p className="font-semibold text-foreground text-base">
                  {item.label}
                </p>
                <p className="text-muted-foreground text-sm">
                  {new Date(item.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
