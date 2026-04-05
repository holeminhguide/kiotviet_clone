import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

const STATUS_OPTIONS = [
  { value: undefined, label: "Tất cả" },
  { value: "completed", label: "Hoàn thành" },
  { value: "pending", label: "Chờ xử lý" },
  { value: "cancelled", label: "Đã hủy" },
  { value: "refunded", label: "Hoàn trả" },
] as const;

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  completed: { label: "Hoàn thành", cls: "bg-green-100 text-green-700" },
  pending: { label: "Chờ xử lý", cls: "bg-yellow-100 text-yellow-700" },
  cancelled: { label: "Đã hủy", cls: "bg-red-100 text-red-700" },
  refunded: { label: "Hoàn trả", cls: "bg-gray-100 text-gray-700" },
};

const PAYMENT_MAP: Record<string, string> = {
  cash: "💵 Tiền mặt",
  card: "💳 Thẻ",
  transfer: "🏦 Chuyển khoản",
};

export default function Orders() {
  const [statusFilter, setStatusFilter] = useState<any>(undefined);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const orders = useQuery(api.orders.list, { status: statusFilter });
  const updateStatus = useMutation(api.orders.updateStatus);

  async function handleStatusChange(id: Id<"orders">, status: any) {
    try {
      await updateStatus({ id, status });
      toast.success("Cập nhật trạng thái thành công!");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Hóa đơn</h1>
        <div className="text-sm text-gray-500">{orders?.length ?? 0} hóa đơn</div>
      </div>

      {/* Status Filter */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                statusFilter === opt.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Mã hóa đơn</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Khách hàng</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Thời gian</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">Tổng tiền</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Thanh toán</th>
              <th className="text-center px-4 py-3 text-gray-600 font-medium">Trạng thái</th>
              <th className="text-center px-4 py-3 text-gray-600 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {!orders ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">📋</div>
                  <div>Chưa có hóa đơn nào</div>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const s = STATUS_MAP[order.status];
                return (
                  <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-blue-600 font-medium">{order.orderCode}</td>
                    <td className="px-4 py-3 text-gray-700">{order.customerName ?? "Khách lẻ"}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(order._creationTime).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {PAYMENT_MAP[order.paymentMethod]}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-1 rounded-full ${s?.cls}`}>{s?.label}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-50"
                        >
                          Chi tiết
                        </button>
                        {order.status === "completed" && (
                          <button
                            onClick={() => handleStatusChange(order._id, "cancelled")}
                            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{selectedOrder.orderCode}</h2>
                <p className="text-sm text-gray-500">
                  {new Date(selectedOrder._creationTime).toLocaleString("vi-VN")}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Khách hàng</span>
                <span className="font-medium">{selectedOrder.customerName ?? "Khách lẻ"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Thanh toán</span>
                <span>{PAYMENT_MAP[selectedOrder.paymentMethod]}</span>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Sản phẩm</div>
                <div className="space-y-2">
                  {selectedOrder.items.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm bg-gray-50 rounded-lg p-2">
                      <div>
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-gray-400 text-xs">
                          {formatCurrency(item.price)} × {item.quantity}
                        </div>
                      </div>
                      <div className="font-semibold text-blue-600">{formatCurrency(item.total)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tạm tính</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Giảm giá</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base">
                  <span>Tổng cộng</span>
                  <span className="text-blue-600">{formatCurrency(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tiền khách đưa</span>
                  <span>{formatCurrency(selectedOrder.amountPaid)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tiền thừa</span>
                  <span>{formatCurrency(selectedOrder.change)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
