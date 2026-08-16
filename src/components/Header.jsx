const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

import { Bell, LogOut, Plus } from "lucide-react";
import LocaleSwitcher from "@/components/LocaleSwitcher";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  const loadUnread = async () => {
    if (!user) return;
    try {
      const list = await db.entities.Notification.filter({ userId: user.id, read: false }, "-created_date", 50);
      setUnread(list.length);
    } catch (e) {}
  };

  useEffect(() => {
    loadUnread();
    const timer = setInterval(loadUnread, 15000);
    return () => clearInterval(timer);
  }, [user]);

  const accountType = user?.data?.accountType || (user?.role === "admin" ? "admin" : "client");
  const handleLogout = () => logout(false);

  return (
    <header className="paper-sheet border-b sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3 sm:gap-4">
        <Link to="/" className="blank-title text-lg font-bold tracking-widest shrink-0">
          {t("home.brand")}
        </Link>
        <span className="hidden md:inline font-mono text-[10px] text-ink-faint uppercase tracking-wider">
          {t("home.tagline")}
        </span>

        <nav className="ml-auto flex items-center gap-1 sm:gap-2 text-sm">
          <Link to="/executors" className="px-2 py-1 hover:underline underline-offset-4">{t("nav.catalog")}</Link>
          <Link to="/board" className="px-2 py-1 hover:underline underline-offset-4">{t("nav.board")}</Link>

          {isAuthenticated && accountType === "client" && (
            <Link to="/client" className="px-2 py-1 hover:underline underline-offset-4 hidden sm:inline">{t("nav.myOrders")}</Link>
          )}
          {isAuthenticated && accountType === "executor" && (
            <Link to="/executor" className="px-2 py-1 hover:underline underline-offset-4 hidden sm:inline">{t("nav.cabinet")}</Link>
          )}
          {isAuthenticated && user?.role === "admin" && (
            <Link to="/admin" className="px-2 py-1 hover:underline underline-offset-4">{t("nav.admin")}</Link>
          )}

          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>

          {isAuthenticated && (
            <>
              <Link to="/orders/new" className="btn-ink px-3 py-1.5 text-xs inline-flex items-center gap-1" title={t("nav.newOrder")}>
                <Plus className="w-3.5 h-3.5" /> {t("nav.newOrder")}
              </Link>
              <button className="relative p-1.5" title={t("nav.notifications")} onClick={loadUnread}>
                <Bell className="w-4 h-4" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[hsl(var(--stamp-red))] text-white text-[9px] font-mono rounded-full w-4 h-4 flex items-center justify-center">
                    {unread > 9 ? "9" : unread}
                  </span>
                )}
              </button>
              <button onClick={handleLogout} className="p-1.5" title={t("nav.logout")}>
                <LogOut className="w-4 h-4" />
              </button>
            </>
          )}
          {!isAuthenticated && (
            <Link to="/login" className="btn-outline-ink px-3 py-1.5 text-xs">{t("nav.login")}</Link>
          )}
        </nav>
      </div>
      <div className="sm:hidden border-t border-[hsl(var(--line))]">
        <div className="max-w-6xl mx-auto px-4 py-1 flex justify-end">
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}