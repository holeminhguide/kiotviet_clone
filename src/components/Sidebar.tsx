import { Page } from "../App";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { id: Page; label: string; icon: string }[] = [
  { id: "dashboard", label: "Tổng quan", icon: "📊" },
  { id: "pos", label: "Bán hàng", icon: "🛒" },
  { id: "orders", label: "Hóa đơn", icon: "📋" },
  { id: "products", label: "Hàng hóa", icon: "📦" },
  { id: "customers", label: "Khách hàng", icon: "👥" },
];

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const user = useQuery(api.auth.loggedInUser);

  return (
    <aside className="w-56 bg-[#1a2332] flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">K</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm">KiotViet</div>
            <div className="text-gray-400 text-xs">Quản lý bán hàng</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
              currentPage === item.id
                ? "bg-blue-600 text-white"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">
              {user?.email ?? "User"}
            </div>
          </div>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}
