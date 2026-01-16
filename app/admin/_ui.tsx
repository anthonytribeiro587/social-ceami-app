import React from "react";

export const styles = {
  page: { maxWidth: 1100, margin: "0 auto" } as React.CSSProperties,


  card: {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    background: "rgba(255,255,255,0.85)",
    color: "#111",
  } as React.CSSProperties,

  h2: { fontSize: 18, marginTop: 0, color: "inherit" } as React.CSSProperties,

  input: {
    width: "100%",
    marginTop: 6,
    padding: 10,
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.16)",
    background: "rgba(255,255,255,0.95)",
    color: "#111",
    outline: "none",
  } as React.CSSProperties,

  btn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "transparent",
    color: "#111",
    cursor: "pointer",
    fontWeight: 700,
  } as React.CSSProperties,

  btnPrimary: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "#111",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
  } as React.CSSProperties,

  tableWrap: {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 12,
    overflow: "hidden",
    background: "rgba(255,255,255,0.9)",
    color: "#111",
    width: "100%",
  } as React.CSSProperties,

  table: {
    width: "100%",
    borderCollapse: "collapse",
  } as React.CSSProperties,

  trHead: { background: "rgba(0,0,0,0.04)" } as React.CSSProperties,

  th: {
    textAlign: "left",
    padding: 12,
    fontWeight: 800,
    fontSize: 13,
    color: "inherit",
  } as React.CSSProperties,

td: {
  textAlign: "left",
  padding: 12,
  fontSize: 13,
  borderTop: "1px solid rgba(0,0,0,0.08)",
  color: "inherit",
  whiteSpace: "normal",
  wordBreak: "break-word",
} as React.CSSProperties,



  pill: {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 999,
    padding: "8px 12px",
    background: "rgba(255,255,255,0.75)",
    color: "#111",
  } as React.CSSProperties,

  // layout.tsx
  navWrap: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
    alignItems: "center",
    flexWrap: "wrap",
  } as React.CSSProperties,

  navLeft: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" } as React.CSSProperties,

  navLink: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.14)",
    color: "#111",
    textDecoration: "none",
    fontSize: 13,
    background: "rgba(255,255,255,0.75)",
  } as React.CSSProperties,

  navLinkActive: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    color: "white",
    textDecoration: "none",
    fontSize: 13,
    background: "#111",
    fontWeight: 800,
  } as React.CSSProperties,
};

function GlobalThemeCSS() {
  return (
    <style jsx global>{`
      /* fundo padrão da página no claro */
      body {
        background: #f3f4f6;
        color: #111;
      }

      /* Select/option no claro */
      select option {
        background: #fff;
        color: #111;
      }

      /* ==== DARK MODE (automático pelo sistema) ==== */
      @media (prefers-color-scheme: dark) {
        body {
          background: #0b0f14;
          color: #fff;
        }

        /* cards/inputs/bordas no dark */
        .ui-card {
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          background: rgba(255, 255, 255, 0.03) !important;
          color: #fff !important;
        }

        .ui-input {
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          background: rgba(255, 255, 255, 0.04) !important;
          color: #fff !important;
        }

        .ui-btn {
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          color: #fff !important;
        }

        .ui-btnPrimary {
          background: #fff !important;
          color: #000 !important;
        }

        .ui-tableWrap {
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          background: rgba(255, 255, 255, 0.02) !important;
          color: #fff !important;
        }

        .ui-trHead {
          background: rgba(255, 255, 255, 0.06) !important;
        }

        .ui-td {
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        }

        .ui-pill {
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          background: rgba(255, 255, 255, 0.02) !important;
          color: #fff !important;
        }

        .ui-navLink {
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          background: rgba(255, 255, 255, 0.02) !important;
          color: #fff !important;
        }

        .ui-navLinkActive {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #fff !important;
          border: 1px solid rgba(255, 255, 255, 0.22) !important;
        }

        /* Select/option no dark */
        select option {
          background: #0b0f14;
          color: #fff;
        }
      }
    `}</style>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="ui-card" style={{ ...styles.card, ...(style || {}) }}>
      <GlobalThemeCSS />
      {children}
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={styles.h2}>{children}</h2>;
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary";
};
export function Button({ variant = "default", style, ...props }: ButtonProps) {
  const base = variant === "primary" ? styles.btnPrimary : styles.btn;
  const cls = variant === "primary" ? "ui-btnPrimary" : "ui-btn";
  const disabledStyle: React.CSSProperties = props.disabled ? { opacity: 0.55, cursor: "not-allowed" } : {};
  return <button {...props} className={cls} style={{ ...base, ...disabledStyle, ...(style || {}) }} />;
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
export function Input({ style, ...props }: InputProps) {
  return <input {...props} className="ui-input" style={{ ...styles.input, ...(style || {}) }} />;
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;
export function Select({ style, children, ...props }: SelectProps) {
  return (
    <select {...props} className="ui-input" style={{ ...styles.input, ...(style || {}) }}>
      {children}
    </select>
  );
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="ui-tableWrap" style={styles.tableWrap}>
      <div className="ui-tableScroll" style={{ width: "100%", overflowX: "auto" }}>
        <table className="ui-table" style={styles.table}>
          {children}
        </table>
      </div>

      <style jsx global>{`
        /* Desktop: dá um “respiro” p/ tabela */
        @media (min-width: 721px) {
          .ui-table {
            min-width: 820px;
          }
        }

        /* Mobile: não força largura, e deixa as células quebrarem linha */
        @media (max-width: 720px) {
          .ui-table {
            min-width: 0;
          }
          .ui-tableScroll {
            overflow-x: hidden; /* evita “corte” feio */
          }
          .ui-td {
            white-space: normal !important;
            word-break: break-word !important;
          }
        }
      `}</style>
    </div>
  );
}



export const th = styles.th;
export const td = styles.td;

export const btn = styles.btn;
export const btnPrimary = styles.btnPrimary;
export const navWrap = styles.navWrap;
export const navLeft = styles.navLeft;
export const navLink = styles.navLink;
export const navLinkActive = styles.navLinkActive;

export function DesktopOnly({ children }: { children: React.ReactNode }) {
  return (
    <div className="ui-desktopOnly">
      {children}
      <style jsx global>{`
        .ui-desktopOnly { display: block; }
        @media (max-width: 720px) {
          .ui-desktopOnly { display: none; }
        }
      `}</style>
    </div>
  );
}

export function MobileOnly({ children }: { children: React.ReactNode }) {
  return (
    <div className="ui-mobileOnly">
      {children}
      <style jsx global>{`
        .ui-mobileOnly { display: none; }
        @media (max-width: 720px) {
          .ui-mobileOnly { display: block; }
        }
      `}</style>
    </div>
  );
}
