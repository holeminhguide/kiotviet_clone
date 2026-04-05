import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

const CATEGORIES = ["Tất cả", "Thực phẩm", "Đồ uống", "Điện tử", "Quần áo", "Mỹ phẩm", "Khác"];
const UNITS = ["Cái", "Hộp", "Kg", "Lít", "Gói", "Chai", "Bộ"];

interface ProductForm {
  name: string;
  sku: string;
  category: string;
  price: string;
  costPrice: string;
  stock: string;
  unit: string;
  isActive: boolean;
}

const defaultForm: ProductForm = {
  name: "",
  sku: "",
  category: "Khác",
  price: "",
  costPrice: "",
  stock: "",
  unit: "Cái",
  isActive: true,
};

export default function Products() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Tất cả");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<Id<"products"> | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);

  const products = useQuery(api.products.list, {
    search: search || undefined,
    category: categoryFilter !== "Tất cả" ? categoryFilter : undefined,
  });
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const removeProduct = useMutation(api.products.remove);

  function openCreate() {
    setEditId(null);
    setForm({ ...defaultForm, sku: `SP${Date.now().toString().slice(-6)}` });
    setShowModal(true);
  }

  function openEdit(product: any) {
    setEditId(product._id);
    setForm({
      name: product.name,
      sku: product.sku,
      category: product.category,
      price: product.price.toString(),
      costPrice: product.costPrice.toString(),
      stock: product.stock.toString(),
      unit: product.unit,
      isActive: product.isActive,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      price: parseFloat(form.price),
      costPrice: parseFloat(form.costPrice),
      stock: parseInt(form.stock),
      unit: form.unit,
      isActive: form.isActive,
    };
    try {
      if (editId) {
        await updateProduct({ id: editId, ...data });
        toast.success("Cập nhật sản phẩm thành công!");
      } else {
        await createProduct(data);
        toast.success("Thêm sản phẩm thành công!");
      }
      setShowModal(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleDelete(id: Id<"products">) {
    if (!confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;
    try {
      await removeProduct({ id });
      toast.success("Đã xóa sản phẩm!");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Hàng hóa</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Thêm hàng hóa
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="🔍 Tìm theo tên, mã..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
          />
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  categoryFilter === cat
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Mã SP</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Tên hàng hóa</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Danh mục</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">Giá bán</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">Giá vốn</th>
              <th className="text-right px-4 py-3 text-gray-600 font-medium">Tồn kho</th>
              <th className="text-center px-4 py-3 text-gray-600 font-medium">Trạng thái</th>
              <th className="text-center px-4 py-3 text-gray-600 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {!products ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-2">📦</div>
                  <div>Chưa có sản phẩm nào</div>
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{product.sku}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                  <td className="px-4 py-3 text-gray-500">{product.category}</td>
                  <td className="px-4 py-3 text-right text-blue-600 font-semibold">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {formatCurrency(product.costPrice)}
                  </td>
                  <td className={`px-4 py-3 text-right font-medium ${product.stock <= 5 ? "text-red-500" : "text-gray-700"}`}>
                    {product.stock} {product.unit}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        product.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {product.isActive ? "Đang bán" : "Ngừng bán"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(product)}
                        className="text-blue-500 hover:text-blue-700 text-xs px-2 py-1 rounded hover:bg-blue-50"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-800">
                {editId ? "Cập nhật hàng hóa" : "Thêm hàng hóa mới"}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên hàng hóa *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã hàng *</label>
                  <input
                    required
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  >
                    {CATEGORIES.filter((c) => c !== "Tất cả").map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  >
                    {UNITS.map((u) => (
                      <option key={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán *</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Giá vốn</label>
                  <input
                    type="number"
                    min={0}
                    value={form.costPrice}
                    onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tồn kho</label>
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">Đang bán</label>
                </div>
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
