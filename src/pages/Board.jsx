const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

import { CATEGORIES, categoryName } from "@/lib/categories";
import { COUNTRIES } from "@/lib/locales";
import Header from "@/components/Header";
import BlankSheet from "@/components/BlankSheet";
import CategoryIcon from "@/components/CategoryIcon";
import StatusStamp from "@/components/StatusStamp";
import { MapPin, ExternalLink, Search, RefreshCw } from "lucide-react";

export default function Board() {
  const location = useLocation();
  const { user } = useAuth();
  const { t, locale, country, currency, formatMoney } = useI18n();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [fCountry, setFCountry] = useState(location.state?.country || country);
  const [fCity, setFCity] = useState(location.state?.city || "");
  const [fCat, setFCat] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const q = { status: "ACTIVE" };
      const data = await db.entities.BoardListing.filter(q, "-created_date", 200);
      setListings(data);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const importFromWeb = async () => {
    setImporting(true);
    setImportMsg("");
    try {
      const res = await db.functions.invoke("generateBoardListings", {
        country: fCountry || country,
        city: fCity,
        categoryCode: fCat,
        currency,
        count: 8,
      });
      if (res?.data?.ok === false) throw new Error(res.data.error);
      const n = res?.data?.created ?? 0;
      setImportMsg(t("board.importDone").replace("{{n}}", n));
      await load();
    } catch (e) {
      setImportMsg(e.message || "Ошибка импорта");
    } finally {
      setImporting(false);
    }
  };

  const cities = useMemo(() => {
    const c = COUNTRIES.find((x) => x.code === fCountry);
    return c ? c.cities.filter((s) => s !== "—") : [];
  }, [fCountry]);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (fCountry && l.country !== fCountry) return false;
      if (fCity && l.city !== fCity) return false;
      if (fCat && l.categoryCode !== fCat) return false;
      return true;
    });
  }, [listings, fCountry, fCity, fCat]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <div className="mb-4 border-b border-[hsl(var(--line))] pb-2 flex items-end justify-between">
          <div>
            <h1 className="blank-title text-xl font-bold">{t("board.title")}</h1>
            <div className="font-mono text-[11px] text-ink-faint uppercase tracking-wider">{t("board.subtitle")}</div>
          </div>
          <div className="font-mono text-xs text-ink-faint">{filtered.length}</div>
        </div>

        {/* FILTERS */}
        <BlankSheet className="paper-sheet--pad mb-4">
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="font-heading uppercase tracking-wider text-xs">{t("order.country")}</label>
              <select value={fCountry} onChange={(e) => { setFCountry(e.target.value); setFCity(""); }} className="field-underline w-full py-1 text-sm">
                <option value="">{t("board.allCountries")}</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name[locale] || c.name.ru}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-heading uppercase tracking-wider text-xs">{t("order.city")}</label>
              <select value={fCity} onChange={(e) => setFCity(e.target.value)} className="field-underline w-full py-1 text-sm">
                <option value="">{t("board.allCities")}</option>
                {cities.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="font-heading uppercase tracking-wider text-xs">{t("order.category")}</label>
              <select value={fCat} onChange={(e) => setFCat(e.target.value)} className="field-underline w-full py-1 text-sm">
                <option value="">{t("board.allCategories")}</option>
                {CATEGORIES.map((c) => <option key={c.code} value={c.code}>{categoryName(c.code, locale)}</option>)}
              </select>
            </div>
          </div>
        </BlankSheet>

        {/* ADMIN IMPORT BAR */}
        {user?.role === "admin" && (
          <div className="mb-4 paper-sheet paper-sheet--pad flex flex-wrap items-center gap-3">
            <RefreshCw className={`w-4 h-4 ${importing ? "animate-spin" : ""}`} />
            <div className="flex-1 min-w-[200px]">
              <div className="font-heading uppercase tracking-wider text-sm">{t("board.import")}</div>
              <div className="font-body text-xs text-ink-faint">{t("board.importHint")}</div>
            </div>
            <button onClick={importFromWeb} disabled={importing} className="btn-outline-ink px-4 py-2 text-xs">
              {importing ? t("board.importing") : t("board.import")}
            </button>
            {importMsg && <span className="font-mono text-xs text-ink-faint">{importMsg}</span>}
          </div>
        )}

        {/* LIST */}
        {loading ? (
          <div className="font-mono text-sm text-ink-faint py-8 text-center">{t("common.loading")}</div>
        ) : filtered.length === 0 ? (
          <BlankSheet className="paper-sheet--pad text-center py-12">
            <div className="font-heading uppercase tracking-wider text-sm text-ink-faint mb-2">{t("board.empty")}</div>
            <button onClick={() => { setFCountry(""); setFCity(""); setFCat(""); }} className="btn-outline-ink px-4 py-2 text-xs inline-flex items-center gap-1">
              <Search className="w-3.5 h-3.5" /> {t("board.allCities")}
            </button>
          </BlankSheet>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((l) => (
              <div key={l.id} className="paper-sheet paper-sheet--pad flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-heading font-bold leading-tight">{l.title}</div>
                  <StatusStamp status="SEARCHING" size="xs" />
                </div>
                {l.description && <p className="font-body text-sm text-ink-faint mb-2 line-clamp-3">{l.description}</p>}
                <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-[hsl(var(--line))]">
                  <div className="font-mono text-xs text-ink-faint inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {l.city || "—"}
                  </div>
                  <div className="font-heading font-bold text-sm">
                    {l.price != null ? formatMoney(l.price) : ""}
                    {l.priceMax != null ? "–" + formatMoney(l.priceMax) : ""}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="font-mono text-[10px] uppercase text-ink-faint inline-flex items-center gap-1">
                    <CategoryIcon code={l.categoryCode} className="w-3 h-3" /> {categoryName(l.categoryCode, locale)}
                  </div>
                  <div className="font-mono text-[10px] uppercase text-ink-faint">«{l.sourceName}»</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}