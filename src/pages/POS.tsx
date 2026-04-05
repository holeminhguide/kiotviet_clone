import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { toast } from "sonner";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
}

interface CartItem {
  productId: Id<"products">;
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export default function POS() {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<Id<"customers"> | undefined>();
  const [selectedCustomerName, setSelectedCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [amountPaid, setAmountPaid] = useState("");
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  const products = useQuery(api.products.list, { search: search || undefined });
  const customers = useQuery(api.customers.list, {
    search: customerSearch || undefined,
  });
  const createOrder = useMutation(api.orders.create);

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const tax = 0;
  const total = subtotal - discount + tax;
  const paid = parseFloat(amountPaid) || 0;
  const change = paid - total;

  function addToCart(product: any) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product._id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product._id
            ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.price * (1 - i.discount / 100) }
            : i
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          productName: product.name,
          sku: product.sku,
          quantity: 1,
          price: product.price,
          discount: 0,
          total: product.price,
        },
      ];
    });
  }

  function updateQty(productId: Id<"products">, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setCart((prev) =>
        prev.map((i) =>
          i.productId === productId
            ? { ...i, quantity: qty, total: qty * i.price * (1 - i.discount / 100) }
            : i
        )
      );
    }
  }

  function removeFromCart(productId: Id<"products">) {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      toast.error("Giỏ hàng trống!");
      return;
    }
    if (paid < total) {
      toast.error("Số tiền thanh toán không đủ!");
      return;
    }
    try {
      await createOrder({
        customerId: selectedCustomerId,
        customerName: selectedCustomerName || undefined,
        items: cart,
        subtotal,
        discount,
        tax,
        total,
        amountPaid: paid,
        change,
        paymentMethod,
        note: note || undefined,
      });
      toast.success("Tạo hóa đơn thành công!");
      setCart([]);
      setAmountPaid("");
      setDiscount(0);
      setNote("");
      setSelectedCustomerId(undefined);
      setSelectedCustomerName("");
      setShowPayment(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div className="flex h-full">
      {/* Product Panel */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="mb-3">
          <input
            type="text"
            placeholder="🔍 Tìm hàng hóa theo tên, mã..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400 bg-white"
          />
        </div>
        <div className="flex-1 overflow-auto">
          {!products ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <div className="text-4xl mb-2">📦</div>
              <div>Không tìm thấy sản phẩm</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map((product) => (
                <button
                  key={product._id}
                  onClick={() => addToCart(product)}
                  disabled={product.stock === 0}
                  className="bg-white border border-gray-100 rounded-xl p-3 text-left hover:border-blue-300 hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-full h-20 bg-gray-100 rounded-lg mb-2 flex items-center justify-center text-3xl">
                    📦
                  </div>
                  <div className="text-xs text-gray-400 mb-0.5">{product.sku}</div>
                  <div className="text-sm font-medium text-gray-800 truncate">{product.name}</div>
                  <div className="text-blue-600 font-semibold text-sm mt-1">
                    {formatCurrency(product.price)}
                  </div>
                  <div className={`text-xs mt-1 ${product.stock <= 5 ? "text-red-500" : "text-gray-400"}`}>
                    Tồn: {product.stock} {product.unit}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Customer */}
        <div className="p-3 border-b border-gray-100">
          <div className="relative">
            <input
              type="text"
              placeholder="👤 Khách lẻ / Tìm khách hàng"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setSelectedCustomerName(e.target.value);
                setSelectedCustomerId(undefined);
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            />
            {customerSearch && customers && customers.length > 0 && !selectedCustomerId && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-40 overflow-auto">
                {customers.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => {
                      setSelectedCustomerId(c._id);
                      setSelectedCustomerName(c.name);
                      setCustomerSearch(c.name);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm"
                  >
                    <div className="font-medium">{c.name}</div>
                    <div className="text-gray-400 text-xs">{c.phone}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <div className="text-4xl mb-2">🛒</div>
              <div className="text-sm">Chưa có sản phẩm</div>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="bg-gray-50 rounded-lg p-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{item.productName}</div>
                    <div className="text-xs text-gray-400">{formatCurrency(item.price)}</div>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      className="w-6 h-6 bg-gray-200 rounded text-sm hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      className="w-6 h-6 bg-gray-200 rounded text-sm hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                  <div className="text-sm font-semibold text-blue-600">
                    {formatCurrency(item.total)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Summary */}
        <div className="border-t border-gray-100 p-3 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tạm tính</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 items-center">
            <span>Giảm giá</span>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              className="w-24 text-right border border-gray-200 rounded px-2 py-0.5 text-sm"
              min={0}
            />
          </div>
          <div className="flex justify-between font-bold text-base text-gray-800 border-t pt-2">
            <span>Tổng cộng</span>
            <span className="text-blue-600">{formatCurrency(total)}</span>
          </div>

          {/* Payment Method */}
          <div className="flex gap-1">
            {(["cash", "card", "transfer"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                  paymentMethod === m
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-200 text-gray-600 hover:border-blue-300"
                }`}
              >
                {m === "cash" ? "💵 Tiền mặt" : m === "card" ? "💳 Thẻ" : "🏦 CK"}
              </button>
            ))}
          </div>

          <div>
            <input
              type="number"
              placeholder="Tiền khách đưa"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
            />
            {paid > 0 && (
              <div className="flex justify-between text-sm mt-1 px-1">
                <span className="text-gray-500">Tiền thừa</span>
                <span className={change >= 0 ? "text-green-600 font-medium" : "text-red-500"}>
                  {formatCurrency(Math.max(0, change))}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Thanh toán {cart.length > 0 && `(${cart.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}
