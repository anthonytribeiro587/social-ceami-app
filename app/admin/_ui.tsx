import React from "react";

export const styles = {
  page: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "0 16px",
  } as React.CSSProperties,

  card: {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,

    background: "rgba(255,255,255,0.88)",
    color: "#111",
    boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
  } as React.CSSProperties,

 h2: { fontSize: 15, marginTop: 0, marginBottom: 10, color: "inherit", letterSpacing: -0.1 } as React.CSSProperties,

  input: {
    width: "100%",
    marginTop: 6,
    padding: "10px 12px",
    borderRadius: 12,
    fontSize: 14,
    border: "1px solid rgba(0,0,0,0.16)",
    background: "rgba(255,255,255,0.96)",
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
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  btnPrimary: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.18)",
    background: "#111",
    color: "white",
    cursor: "pointer",
    fontWeight: 800,
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  tableWrap: {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 12,
    overflow: "hidden",
    background: "rgba(255,255,255,0.92)",
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
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  td: {
    textAlign: "left",
    padding: 12,
    fontSize: 13,
    borderTop: "1px solid rgba(0,0,0,0.08)",
    color: "inherit",
    verticalAlign: "top",
  } as React.CSSProperties,

  pill: {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 999,
    padding: "8px 12px",
    background: "rgba(255,255,255,0.75)",
    color: "#111",
  } as React.CSSProperties,

  // layout.tsx (navbar)
  navWrap: {
    position: "sticky",
    top: 0,
    zIndex: 50,
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "rgba(255,255,255,0.70)",
    backdropFilter: "blur(10px)",
  } as React.CSSProperties,

  navLeft: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "nowrap",
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  } as React.CSSProperties,

  navLink: {
    padding: "7px 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.14)",
    color: "#111",
    textDecoration: "none",
    fontSize: 13,
    background: "rgba(255,255,255,0.80)",
    whiteSpace: "nowrap",
    flex: "0 0 auto",
  } as React.CSSProperties,

  navLinkActive: {
    padding: "7px 12px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.18)",
    color: "white",
    textDecoration: "none",
    fontSize: 13,
    background: "#111",
    fontWeight: 800,
    whiteSpace: "nowrap",
    flex: "0 0 auto",
  } as React.CSSProperties,
};

function GlobalThemeCSS() {
  return (
    <style jsx global>{`
      :root {
        color-scheme: light dark;
      }

      body {
        background: #f3f4f6;
        color: #111;
      }

      /* select/option no claro */
      select option {
        background: #fff;
        color: #111;
      }

      /* dark mode automático */
      @media (prefers-color-scheme: dark) {
        body {
          background: #0b0f14;
          color: #fff;
        }

        .ui-card {
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          background: rgba(255, 255, 255, 0.04) !important;
          color: #fff !important;
          box-shadow: none !important;
        }

        .ui-input {
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          background: rgba(255, 255, 255, 0.05) !important;
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
          background: rgba(255, 255, 255, 0.03) !important;
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
          background: rgba(255, 255, 255, 0.03) !important;
          color: #fff !important;
        }

        .ui-navLink {
          border: 1px solid rgba(255, 255, 255, 0.15) !important;
          background: rgba(255, 255, 255, 0.03) !important;
          color: #fff !important;
        }

        .ui-navLinkActive {
          background: rgba(255, 255, 255, 0.10) !important;
          color: #fff !important;
          border: 1px solid rgba(255, 255, 255, 0.22) !important;
        }

        select option {
          background: #0b0f14;
          color: #fff;
        }
      }

      /* evita scrollbar feia no “tabs” da navbar */
      .ui-navScroll::-webkit-scrollbar {
        height: 6px;
      }
      .ui-navScroll::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.15);
        border-radius: 999px;
      }
      @media (prefers-color-scheme: dark) {
        .ui-navScroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
        }
      }
    `}</style>
  );
}

export function ThemeRoot() {
  return <GlobalThemeCSS />;
}

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="ui-card" style={{ ...styles.card, ...(style || {}) }}>
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

export function Table({ children, minWidth = 860 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="ui-tableWrap" style={styles.tableWrap}>
      <div style={{ width: "100%", overflowX: "auto" }}>
        <table style={{ ...styles.table, minWidth }}>{children}</table>
      </div>
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
        .ui-desktopOnly {
          display: block;
        }
        @media (max-width: 720px) {
          .ui-desktopOnly {
            display: none;
          }
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
        .ui-mobileOnly {
          display: none;
        }
        @media (max-width: 720px) {
          .ui-mobileOnly {
            display: block;
          }
        }
      `}</style>
    </div>
  );
}


  export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 22, margin: 0, letterSpacing: -0.2 }}>{title}</h1>
          {subtitle ? (
            <p style={{ margin: "6px 0 0", opacity: 0.78, fontSize: 14, lineHeight: 1.4 }}>
              {subtitle}
            </p>
          ) : null}
        </div>
        {right ? <div>{right}</div> : null}
      </div>
    </div>
  );
}
