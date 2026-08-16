const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useI18n } from "@/lib/i18n";

import { CATEGORIES, categoryName } from "@/lib/categories";
import { COUNTRIES, getCountry } from "@/lib/locales";
import Header from "@/components/Header";
import BlankSheet from "@/components/BlankSheet";
import CategoryIcon from "@/components/CategoryIcon";
import { makeOrderNumber } from "@/lib/orders";
import { Sparkles, Wand2 } from "lucide-react";

const COMPLEXITY = { low: "low", medium: "medium", high: "high" };

export default function OrderNew() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t, locale, country, setCountry, currency, phonePrefix, formatMoney } = useI18n();
  const preset = location.state || {};

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    description: preset.description || "",
    categoryCode: preset.categoryCode || "",
    country,
    city: "",
    budget: "",
    desiredDate: "",
    address: "",
    contactName: user?.full_name || "",
    contactPhone: user?.data?.phone || "",
  });
  const [suggestion, setSuggestion] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    db.entities.Category.filter({ isArchived: false }).then(setCategories).catch(() => {});
  }, []);

  const cities = useMemo(() => getCountry(form.country).cities.filter((c) => c !== "—"), [form.country]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const runAi = async () => {
    if (form.description.trim().length < 5) {
      setAiError(t("order.desc"));
      return;
    }
    setAiLoading(true);
    setAiError("");
    setSuggestion(null);
    try {
      const res = await db.functions.invoke("structureOrder", {
        description: form.description,
        currency,
        language: locale,
      });
      if (res?.data?.ok === false) throw new Error(res.data.error);
      setSuggestion(res.data?.suggestion || null);
      if (res.data?.suggestion?.categoryId) {
        setForm((f) => ({ ...f, categoryCode: f.categoryCode || res.data.suggestion.categoryId }));
      }
    } catch (e) {
      setAiError(e.message || t("order.ai"));
    } finally {
      setAiLoading(false);
    }
  };

  // авто-запуск AI после паузы
  useEffect(() => {
    if (form.description.trim().length < 12) return;
    const timer = setTimeout(() => { if (!suggestion && !aiLoading) runAi(); }, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.description]);

  const applyCategory = (code) => setForm((f) => ({ ...f, categoryCode: code }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.description || !form.categoryCode || !form.country || !form.city || !form.contactName || !form.contactPhone) {
      setError(t("order.required"));
      return;
    }
    setSubmitting(true);
    try {
      const orderNumber = makeOrderNumber(Date.now() % 1000000);
      const created = await db.entities.Order.create({
        orderNumber,
        description: form.description,
        categoryCode: form.categoryCode,
        city: form.city,
        budget: form.budget ? Number(form.budget) : null,
        desiredDate: form.desiredDate || null,
        address: form.address || null,
        contactName: form.contactName,
        contactPhone: form.contactPhone,
        status: "NEW",
        clientId: user.id,
        autoCompleted: false,
      });
      await db.entities.OrderStatusHistory.create({
        orderId: created.id,
        status: "NEW",
        authorRole: "CLIENT",
        authorId: user.id,
        comment: "Наряд оформлен клиентом",
      });
      navigate(`/orders/${created.id}`);
    } catch (e) {
      setError(e.message || "Не удалось создать наряд");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toLocaleDateString(locale === "en" ? "en-US" : locale, { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
        <BlankSheet className="paper-sheet--pad">
          <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[hsl(var(--line))] pb-3 mb-5">
            <div>
              <div className="blank-title text-xl font-bold">{t("order.title")}</div>
              <div className="font-mono text-[11px] text-ink-faint uppercase tracking-wider">{t("order.subtitle")}</div>
            </div>
            <div className="font-mono text-xs text-ink-faint">{today}</div>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="font-heading uppercase tracking-wider text-sm">{t("order.desc")} *</label>
              <textarea
                value={form.description}
                onChange={set("description")}
                rows={3}
                className="field-underline w-full mt-1 py-1.5"
                placeholder={t("order.descPlaceholder")}
              />
              <div className="mt-2 flex items-center gap-3">
                <button type="button" onClick={runAi} disabled={aiLoading} className="btn-outline-ink px-3 py-1.5 text-xs inline-flex items-center gap-1">
                  <Wand2 className="w-3.5 h-3.5" /> {aiLoading ? t("order.aiLoading") : t("order.ai")}
                </button>
                <span className="font-body text-xs text-ink-faint">{t("order.aiHint")}</span>
              </div>
              {aiError && <p className="text-sm text-[hsl(var(--stamp-red))] mt-1">{aiError}</p>}
            </div>

            {suggestion && (
              <div className="paper-sheet paper-sheet--pad bg-[hsl(var(--muted)/0.4)]">
                <div className="font-heading uppercase tracking-wider text-xs mb-2 inline-flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> {t("order.suggestion")}
                </div>
                <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 font-body text-sm">
                  <div>{t("order.category")}:{" "}
                    <button type="button" onClick={() => applyCategory(suggestion.categoryId)} className="link-ink inline-flex items-center gap-1">
                      <CategoryIcon code={suggestion.categoryId} className="w-3 h-3" /> {categoryName(suggestion.categoryId, locale)}
                    </button>
                  </div>
                  <div>{t("order.complexity")}: <span className="font-mono">{suggestion.estimatedComplexity}</span></div>
                  <div>{t("order.price")}:{" "}
                    <span className="font-mono">
                      {suggestion.estimatedCost?.min != null ? formatMoney(suggestion.estimatedCost.min) : ""}
                      {suggestion.estimatedCost?.max != null ? "–" + formatMoney(suggestion.estimatedCost.max) : ""}
                    </span>
                  </div>
                  <div>{t("order.duration")}: <span className="font-mono">{suggestion.estimatedDurationDays}</span></div>
                </div>
                {suggestion.specialties?.length > 0 && (
                  <div className="font-body text-sm mt-2">{t("order.specialties")}: {suggestion.specialties.join(", ")}</div>
                )}
                {suggestion.clarifyingQuestions?.length > 0 && (
                  <div className="mt-2">
                    <div className="font-body text-sm font-bold">{t("order.questions")}:</div>
                    <ul className="list-disc list-inside font-body text-sm">
                      {suggestion.clarifyingQuestions.map((q, i) => <li key={i}>{q}</li>)}
                    </ul>
                  </div>
                )}
                <div className="font-mono text-[11px] text-ink-faint mt-2">confidence: {suggestion.confidence}</div>
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="font-heading uppercase tracking-wider text-sm">{t("order.category")} *</label>
                <select value={form.categoryCode} onChange={set("categoryCode")} className="field-underline w-full mt-1 py-1.5">
                  <option value="">—</option>
                  {CATEGORIES.map((c) => <option key={c.code} value={c.code}>{categoryName(c.code, locale)}</option>)}
                </select>
              </div>
              <div>
                <label className="font-heading uppercase tracking-wider text-sm">{t("order.country")} *</label>
                <select
                  value={form.country}
                  onChange={(e) => { setForm((f) => ({ ...f, country: e.target.value, city: "" })); setCountry(e.target.value); }}
                  className="field-underline w-full mt-1 py-1.5"
                >
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name[locale] || c.name.ru} ({c.currency})</option>)}
                </select>
              </div>
              <div>
                <label className="font-heading uppercase tracking-wider text-sm">{t("order.city")} *</label>
                <select value={form.city} onChange={set("city")} className="field-underline w-full mt-1 py-1.5">
                  <option value="">—</option>
                  {cities.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="font-heading uppercase tracking-wider text-sm">{t("order.budget")}, {currency}</label>
                <input type="number" value={form.budget} onChange={set("budget")} className="field-underline w-full mt-1 py-1.5" placeholder="—" />
              </div>
              <div>
                <label className="font-heading uppercase tracking-wider text-sm">{t("order.date")}</label>
                <input type="date" value={form.desiredDate} onChange={set("desiredDate")} className="field-underline w-full mt-1 py-1.5" />
              </div>
              <div className="sm:col-span-2">
                <label className="font-heading uppercase tracking-wider text-sm">{t("order.address")}</label>
                <input value={form.address} onChange={set("address")} className="field-underline w-full mt-1 py-1.5" placeholder="—" />
              </div>
              <div>
                <label className="font-heading uppercase tracking-wider text-sm">{t("order.contact")} *</label>
                <input value={form.contactName} onChange={set("contactName")} className="field-underline w-full mt-1 py-1.5" />
              </div>
              <div>
                <label className="font-heading uppercase tracking-wider text-sm">{t("order.phone")} *</label>
                <input value={form.contactPhone} onChange={set("contactPhone")} className="field-underline w-full mt-1 py-1.5" placeholder={`${phonePrefix} ...`} />
              </div>
            </div>

            {error && <p className="text-sm text-[hsl(var(--stamp-red))]">{error}</p>}

            <div className="flex gap-3 pt-2 border-t border-[hsl(var(--line))]">
              <button type="submit" disabled={submitting} className="btn-ink px-5 py-2.5 text-sm">
                {submitting ? "…" : t("order.submit")}
              </button>
              <button type="button" onClick={() => navigate("/")} className="btn-outline-ink px-4 py-2.5 text-sm">{t("order.cancel")}</button>
            </div>
          </form>
        </BlankSheet>
      </main>
    </div>
  );
}