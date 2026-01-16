"use client";

import React from "react";

export function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...styles.card, ...style }}>{children}</div>;
}

export function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={styles.h2}>{children}</h2>;
}

export function Button({
  children,
  onClick,
  disabled,
  variant = "default",
  style,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  variant?: "default" | "primary";
  style?: React.CSSProperties;
  type?: "button" | "submit";
}) {
  const base = variant === "primary" ? styles.primaryBtn : styles.btn;
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...style }}>
      {children}
    </button>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...styles.input, ...(props.style || {}) }} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...styles.input, ...(props.style || {}) }} />;
}

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>{children}</table>
    </div>
  );
}

export const th: React.CSSProperties = {
  textAlign: "left",
  padding: 12,
  fontWeight: 600,
  fontSize: 13,
  background: "rgba(255,255,255,0.06)",
};

export const td: React.CSSProperties = {
  textAlign: "left",
  padding: 12,
  fontSize: 13,
  borderTop: "1px solid rgba(255,255,255,0.10)",
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    background: "rgba(255,255,255,0.03)",
  },
  h2: { fontSize: 18, marginTop: 0 },
  input: {
    width: "100%",
    marginTop: 6,
    padding: 10,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.02)",
    color: "white",
    outline: "none",
  },
  btn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "white",
    cursor: "pointer",
  },
  primaryBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "white",
    color: "black",
    cursor: "pointer",
    fontWeight: 800,
  },
  tableWrap: {
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: 12,
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
};
