import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Page } from "../App";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

interface DashboardProps {
  onNavigate: (page: Page) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const stats = useQuery(api.orders.getDashboardStats);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Doanh thu hôm nay",
      value: formatCurrency(stats.todayRevenue),
      sub: `${stats.todayOrders} hóa đơn`,
      color: "bg-blue-500",
      icon: "💰",
    },
    {
      label: "Tổng doanh thu",
      value: formatCurrency(stats.totalRevenue),
      sub: `${stats.totalOrders} hóa đơn`,
      color: "bg-green-500",
      icon: "📈",
    },
    {
      label: "Sản phẩm",
      value: stats.totalProducts.toString(),
      sub: `${stats.lowStockCount} sắp hết hàng`,
      color: "bg-orange-500",
      icon: "📦",
    },
    {
      label: "Khách hàng",
      value: stats.totalCustomers.toString(),
      sub: "Tổng khách hàng",
      color: "bg-purple-500",
      icon: "👥",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Tổng quan</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{card.icon}</span>
              <span className={`${card.color} text-white text-xs px-2 py-1 rounded-full`}>
                {card.sub}
              </span>
            </div>
            <div className="text-xl font-bold text-gray-800">{card.value}</div>
            <div className="text-gray-500 text-sm mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-700 mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate("pos")}
              className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <span className="text-2xl">🛒</span>
              <span className="text-sm font-medium text-blue-700">Bán hàng</span>
            </button>
            <button
              onClick={() => onNavigate("products")}
              className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <span className="text-2xl">➕</span>
              <span className="text-sm font-medium text-green-700">Thêm hàng hóa</span>
            </button>
            <button
              onClick={() => onNavigate("customers")}
              className="flex flex-col items-center gap-2 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
            >
              <span className="text-2xl">👤</span>
              <span className="text-sm font-medium text-purple-700">Thêm khách hàng</span>
            </button>
            <button
              onClick={() => onNavigate("orders")}
              className="flex flex-col items-center gap-2 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <span className="text-2xl">📋</span>
              <span className="text-sm font-medium text-orange-700">Xem hóa đơn</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-700 mb-4">Hóa đơn gần đây</h2>
          {stats.recentOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-8">Chưa có hóa đơn nào</div>
          ) : (
            <div className="space-y-2">
              {stats.recentOrders.map((order: any) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-700">{order.orderCode}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(order._creationTime).toLocaleTimeString("vi-VN")}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-blue-600">
                      {formatCurrency(order.total)}
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    completed: { label: "Hoàn thành", cls: "bg-green-100 text-green-700" },
    pending: { label: "Chờ xử lý", cls: "bg-yellow-100 text-yellow-700" },
    cancelled: { label: "Đã hủy", cls: "bg-red-100 text-red-700" },
    refunded: { label: "Hoàn trả", cls: "bg-gray-100 text-gray-700" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-700" };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
  );
}
