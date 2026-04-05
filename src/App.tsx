import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { Toaster } from "sonner";
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import POS from "./pages/POS";
import Sidebar from "./components/Sidebar";

export type Page = "dashboard" | "pos" | "orders" | "products" | "customers";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Authenticated>
        <MainApp />
      </Authenticated>
      <Unauthenticated>
        <LoginPage />
      </Unauthenticated>
      <Toaster position="top-right" />
    </div>
  );
}

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">K</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">KiotViet</h1>
          </div>
          <p className="text-gray-500 text-sm">Phần mềm quản lý bán hàng</p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}

function MainApp() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1 overflow-auto bg-gray-50">
        {currentPage === "dashboard" && <Dashboard onNavigate={setCurrentPage} />}
        {currentPage === "pos" && <POS />}
        {currentPage === "orders" && <Orders />}
        {currentPage === "products" && <Products />}
        {currentPage === "customers" && <Customers />}
      </main>
    </div>
  );
}
