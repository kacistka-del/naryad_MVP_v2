import React, { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getCurrency, CURRENCIES } from "@/lib/locales";

export default function LocaleSwitcher() {
  const { locale, setLocale, country, setCountry, currency, setCurrency, countries, languages } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const curLang = languages.find((l) => l.code === locale);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 px-2 py-1 font-mono text-[11px] uppercase tracking-wider hover:bg-[hsl(var(--muted))]"
        title="Язык и валюта"
      >
        <Globe className="w-3.5 h-3.5" />
        {curLang?.code.toUpperCase()}
        <span className="opacity-50">/</span>
        {getCurrency(currency).symbol}
      </button>

      {open && (
        <div className="absolute right-0 mt-1 paper-sheet paper-sheet--pad z-50 w-60">
          <div className="font-heading uppercase tracking-wider text-[11px] mb-1 text-ink-faint">Язык · Language</div>
          <div className="grid grid-cols-2 gap-1 mb-3">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => setLocale(l.code)}
                className={`text-left px-2 py-1 text-xs font-body ${l.code === locale ? "bg-[hsl(var(--ink))] text-[hsl(var(--paper))]" : "hover:bg-[hsl(var(--muted))]"}`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="font-heading uppercase tracking-wider text-[11px] mb-1 text-ink-faint">Страна · Country</div>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="field-underline w-full py-1 text-sm mb-3 bg-transparent"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name[locale] || c.name.ru} ({c.currency})</option>
            ))}
          </select>

          <div className="font-heading uppercase tracking-wider text-[11px] mb-1 text-ink-faint">Валюта · Currency</div>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="field-underline w-full py-1 text-sm bg-transparent"
          >
            {Object.values(CURRENCIES).map((c) => (
              <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}