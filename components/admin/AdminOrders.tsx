import React, { useEffect, useState } from 'react';
import { menuService } from '../../services/menuService';
import { Order, MenuItem } from '../../types';

interface AdminOrdersProps {
  menuItems: MenuItem[];
}

const AdminOrders: React.FC<AdminOrdersProps> = ({ menuItems }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => {
    const unsub = menuService.subscribeToOrders((o: any[]) => setOrders(o));
    return () => unsub();
  }, []);

  const updateStatus = async (id: string, status: Order['status']) => {
    if (!confirm('Update status?')) return;
    await menuService.updateOrder(id, { status });
    alert('Status updated.');
  };

  const resolveName = (id: number) => {
    const item = menuItems.find(i => i.id === id);
    return item ? item.translations?.en?.name || item.translations?.ku?.name || `#${id}` : `#${id}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h2 className="text-3xl font-black">Orders</h2>
      {orders.length === 0 ? (
        <div className="text-gray-400">No orders yet.</div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="bg-white p-4 rounded-xl shadow-sm border flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">{o.deviceId}</div>
                <div className="text-sm text-gray-400">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''}</div>
              </div>

              <div className="flex gap-3 flex-wrap">
                {o.items.map(it => (
                  <div key={it.id} className="text-sm bg-gray-50 px-3 py-1 rounded-md border">{resolveName(it.id)} × {it.quantity}</div>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="font-black text-lg">{o.total.toLocaleString()} IQD</div>
                <div className="flex gap-2 items-center">
                  <div className={`px-3 py-1 rounded ${o.status === 'new' ? 'bg-yellow-100 text-yellow-800' : o.status === 'processing' ? 'bg-blue-100 text-blue-800' : o.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{o.status}</div>
                  <button onClick={() => updateStatus(o.id!, 'processing')} className="px-3 py-1 bg-[#231f20] text-[#c68a53] rounded">Processing</button>
                  <button onClick={() => updateStatus(o.id!, 'completed')} className="px-3 py-1 bg-green-100 text-green-800 rounded">Complete</button>
                  <button onClick={() => updateStatus(o.id!, 'cancelled')} className="px-3 py-1 bg-red-100 text-red-800 rounded">Cancel</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;