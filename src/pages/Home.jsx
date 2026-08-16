const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

import { CATEGORIES, CATEGORY_GROUPS, groupLabel, categoryName } from "@/lib/categories";
import Header from "@/components/Header";
import BlankSheet from "@/components/BlankSheet";
import CategoryIcon from "@/components/CategoryIcon";
import { COUNTRIES } from "@/lib/locales";
import { Star, MapPin, ArrowRight, Search, PenLine, Sparkles, UserCheck } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, locale, country, currency, formatMoney } = useI18n();
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [executors, setExecutors] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const cats = await db.entities.Category.filter({ isArchived: false });
        setCategories(cats);
      } catch {}
      try {
        const ex = await db.entities.Executor.filter({ moderationStatus: "APPROVED", isActive: true }, "-ratingAvg", 6);
        setExecutors(ex);
      } catch {}
    })();
  }, []);

  const goOrder = () => navigate("/orders/new", { state: { description } });

  const today = new Date().toLocaleDateString(locale === "en" ? "en-US" : locale, { day: "2-digit", month: "long", year: "numeric" });

  // популярные города: по стране пользователя + пара из других
  const myCountry = COUNTRIES.find((c) => c.code === country) || COUNTRIES[0];
  const popularCities = [
    ...myCountry.cities.filter((c) => c !== "—").slice(0, 6),
    ...(country !== "RU" ? ["Москва", "Санкт-Петербург"] : []),
    ...(country !== "PL" ? ["Warszawa", "Kraków"] : []),
  ].slice(0, 8);

  const catsByGroup = CATEGORY_GROUPS.map((g) => ({
    group: g,
    items: categories.filter((c) => {
      const meta = CATEGORIES.find((x) => x.code === c.code);
      return meta && meta.group === g.code;
    }),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* HERO */}
        <BlankSheet className="paper-sheet--pad mb-6">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[hsl(var(--line))] pb-3 mb-4">
            <div>
              <div className="blank-title text-2xl font-bold">{t("home.brand")}</div>
              <div className="font-mono text-[11px] text-ink-faint uppercase tracking-wider">{t("home.tagline")}</div>
            </div>
            <div className="font-mono text-xs text-ink-faint text-right">
              <div>{today}</div>
              <div>№ ____________</div>
            </div>
          </div>

          <h1 className="font-heading text-xl sm:text-2xl font-bold leading-snug mb-2 max-w-3xl">{t("home.title")}</h1>
          <p className="font-body text-sm text-ink-faint max-w-2xl mb-4">{t("home.subtitle")}</p>

          <label className="block">
            <span className="font-heading uppercase tracking-wider text-sm inline-flex items-center gap-1">
              <PenLine className="w-3.5 h-3.5" /> {t("order.desc")}
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t("home.placeholder")}
              className="field-underline w-full text-lg py-1.5 mt-1"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <button onClick={goOrder} className="btn-ink px-5 py-2.5 text-sm inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> {t("home.cta")}
            </button>
            <span className="font-body text-sm text-ink-faint">{t("home.hint")}</span>
          </div>
        </BlankSheet>

        {/* HOW IT WORKS */}
        <section className="mb-8 grid sm:grid-cols-3 gap-3">
          {[
            { icon: PenLine, title: t("home.step1"), desc: t("home.step1d") },
            { icon: Search, title: t("home.step2"), desc: t("home.step2d") },
            { icon: UserCheck, title: t("home.step3"), desc: t("home.step3d") },
          ].map((s, i) => (
            <div key={i} className="paper-sheet paper-sheet--pad">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-ink-faint">0{i + 1}</span>
                <s.icon className="w-4 h-4" />
                <div className="font-heading font-bold text-sm">{s.title}</div>
              </div>
              <p className="font-body text-sm text-ink-faint">{s.desc}</p>
            </div>
          ))}
        </section>

        {/* CATEGORIES */}
        <section className="mb-8">
          <div className="flex items-baseline justify-between mb-3 border-b border-[hsl(var(--line))] pb-1">
            <h2 className="font-heading uppercase tracking-wider text-sm">{t("home.categoriesTitle")}</h2>
          </div>
          <div className="space-y-5">
            {catsByGroup.map(({ group, items }) => (
              <div key={group.code}>
                <div className="font-mono text-[11px] uppercase tracking-wider text-ink-faint mb-2">{groupLabel(group.code, locale)}</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {items.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => navigate("/orders/new", { state: { categoryCode: c.code, description } })}
                      className="paper-sheet paper-sheet--pad text-left hover:bg-[hsl(var(--muted))] transition-colors flex items-center gap-2"
                    >
                      <CategoryIcon code={c.code} className="w-4 h-4 shrink-0" />
                      <span className="font-body text-sm leading-tight">{categoryName(c.code, locale)}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* POPULAR CITIES */}
        <section className="mb-8">
          <div className="flex items-baseline justify-between mb-3 border-b border-[hsl(var(--line))] pb-1">
            <h2 className="font-heading uppercase tracking-wider text-sm">{t("home.citiesTitle")}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularCities.map((city) => (
              <button
                key={city}
                onClick={() => navigate("/board", { state: { city } })}
                className="paper-sheet px-3 py-1.5 text-sm font-body inline-flex items-center gap-1 hover:bg-[hsl(var(--muted))]"
              >
                <MapPin className="w-3.5 h-3.5" /> {city}
              </button>
            ))}
          </div>
        </section>

        {/* EXECUTORS */}
        {executors.length > 0 && (
          <section className="mb-4">
            <div className="flex items-baseline justify-between mb-3 border-b border-[hsl(var(--line))] pb-1">
              <h2 className="font-heading uppercase tracking-wider text-sm">{t("home.executorsTitle")}</h2>
              <Link to="/executors" className="link-ink text-sm font-body inline-flex items-center gap-1">
                {t("home.allCatalog")}
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              {executors.map((ex) => (
                <div key={ex.id} className="paper-sheet paper-sheet--pad">
                  <div className="font-heading font-bold">{ex.fullName || "—"}</div>
                  <div className="font-mono text-[11px] text-ink-faint uppercase mt-0.5 inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {ex.city || "—"}
                    <span className="inline-flex items-center gap-0.5 ml-1"><Star className="w-3 h-3" /> {(ex.ratingAvg || 0).toFixed(1)}</span>
                    · {ex.ordersCount || 0}
                  </div>
                  {ex.specialties?.length > 0 && (
                    <div className="font-body text-sm mt-1 text-ink-faint">{ex.specialties.join(" · ")}</div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <footer className="max-w-6xl mx-auto px-4 py-6 font-mono text-[11px] text-ink-faint uppercase tracking-wider">
        {t("home.brand")} · {t("home.tagline")} · {new Date().getFullYear()}
      </footer>
    </div>
  );
}