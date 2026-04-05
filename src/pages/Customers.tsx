import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

interface CustomerForm {
  name: string;
  phone: string;
  email: string;
  address: string;
}

const defaultForm: CustomerForm = { name: "", phone: "", email: "", address: "" };

export default function Customers() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<Id<"customers"> | null>(null);
  const [form, setForm] = useState<CustomerForm>(defaultForm);

  const customers = useQuery(api.customers.list, { search: search || undefined });
  const createCustomer = useMutation(api.customers.create);
  const updateCustomer = useMutation(api.customers.update);
  const removeCustomer = useMutation(api.customers.remove);

  function openCreate() {
    setEditId(null);
    setForm(defaultForm);
    setShowModal(true);
  }

  function openEdit(customer: any) {
    setEditId(customer._id);
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? "",
      address: customer.address ?? "",
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      address: form.address || undefined,
    };
    try {
      if (editId) {
        await updateCustomer({ id: editId, ...data });
        toast.success("Cập nhật khách hàng thành công!");
      } else {
        await createCustomer(data);
        toast.success("Thêm khách hàng thành công!");
      }
      setShowModal(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleDelete(id: Id<"customers">) {
    if (!confirm("Bạn có chắc muốn xóa khách hàng này?")) return;
    try {
      await removeCustomer({ id });
      toast.success("Đã xóa khách hàng!");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Khách hàng</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Thêm khách hàng
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <input
          type="text"
          placeholder="🔍 Tìm theo tên, số điện thoại..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Tên khách hàng</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Số điện thoại</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Địa chỉ</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">Tổng mua</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">Số đơn</th>
              <th className="text-center px-4 py-3 text-gray-600 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {!customers ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">👥</div>
                  <div>Chưa có khách hàng nào</div>
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                        {customer.name[0]?.toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{customer.phone}</td>
                  <td className="px-4 py-3 text-gray-500">{customer.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-32 truncate">{customer.address ?? "—"}</td>
                  <td className="px-4 py-3 text-right font-semibold text-blue-600">
                    {formatCurrency(customer.totalSpent)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{customer.totalOrders}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(customer)}
                        className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-50"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(customer._id)}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                {editId ? "Cập nhật khách hàng" : "Thêm khách hàng mới"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  {editId ? "Cập nhật" : "Thêm mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
