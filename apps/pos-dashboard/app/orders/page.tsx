export default function OrdersPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Orders</h2>
      <p className="text-slate-600">
        Placeholder for incoming order queue, status updates, and fulfillment actions.
      </p>
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <p className="font-medium">Order Table (Placeholder)</p>
        <p className="mt-2 text-sm text-slate-500">
          Columns to be implemented: order id, customer, total, status, created at.
        </p>
      </div>
    </div>
  );
}
