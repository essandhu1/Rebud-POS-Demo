export default function Home() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold">POS Dashboard Home</h2>
        <p className="mt-2 text-slate-600">
          Simplified internal dashboard for demoing order and inventory workflows.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Open Orders</p>
          <p className="mt-2 text-2xl font-semibold">12</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Low Stock SKUs</p>
          <p className="mt-2 text-2xl font-semibold">7</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Compliance Flags</p>
          <p className="mt-2 text-2xl font-semibold">2</p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-slate-500">Active Rewards Members</p>
          <p className="mt-2 text-2xl font-semibold">184</p>
        </div>
      </section>
    </div>
  );
}
