"use client";

import Image from "next/image";
import { useId, type ReactNode } from "react";
import styles from "./PodboundBadge.module.css";

export type PodboundBadgeVariant = "parchment" | "green" | "bronze" | "silver" | "gold" | "rare-green" | "locked-grey";
export type PodboundBadgeSize = "small" | "medium" | "large";

export type PodboundBadgeProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  variant?: PodboundBadgeVariant;
  size?: PodboundBadgeSize;
  locked?: boolean;
  rarity?: string;
  description?: string;
  className?: string;
};

function LockIcon() {
  return <svg className={styles.lockIcon} viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>;
}

export function PodboundBadge({
  title,
  subtitle,
  icon,
  variant = "parchment",
  size = "medium",
  locked = false,
  rarity,
  description,
  className = "",
}: PodboundBadgeProps) {
  const tooltipId = useId();
  const effectiveVariant = locked ? "locked-grey" : variant;
  const state = locked ? "Locked" : "Unlocked";
  const label = [title, subtitle, rarity ? `${rarity} tier` : null, state, description].filter(Boolean).join(". ");

  return <span className={`${styles.badgeWrap} ${className}`}>
    <span
      className={`${styles.badge} ${styles[effectiveVariant]} ${styles[size]}${locked ? ` ${styles.locked}` : ""}`}
      role="img"
      aria-label={label}
      aria-describedby={description ? tooltipId : undefined}
      tabIndex={description ? 0 : undefined}
      data-badge-state={locked ? "locked" : "unlocked"}
      data-badge-tier={rarity || undefined}
    >
      <span className={styles.colourField} aria-hidden="true" />
      <Image className={styles.frame} src="/badges/podbound-badge-frame.png" alt="" width={2400} height={452} sizes="(max-width: 600px) 92vw, 640px" />
      <span className={styles.content} aria-hidden="true">
        {rarity && <span className={styles.rarity}>{rarity}</span>}
        <span className={styles.titleRow}>{icon && <span className={styles.icon}>{icon}</span>}<span className={styles.title}>{title}</span>{locked && <LockIcon />}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </span>
    </span>
    {description && <span className={styles.tooltip} id={tooltipId} role="tooltip">{description}</span>}
  </span>;
}
