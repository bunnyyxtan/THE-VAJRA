import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import Button from "./Button";
import { C, F, R, S, softShadow } from "@/src/theme";

type Tone = "error" | "warning" | "info" | "success";

const TONES: Record<Tone, { bg: string; fg: string; border: string }> = {
  error: { bg: C.errorBg, fg: C.error, border: C.errorBright },
  warning: { bg: C.warningBg, fg: C.warning, border: C.warningBright },
  info: { bg: C.infoBg, fg: C.info, border: C.infoBright },
  success: { bg: C.successBg, fg: C.success, border: C.successBright },
};

/**
 * Solid, high-contrast error/status card. Always explains:
 * what happened (title), whether money moved (moneyLine), what to do (body + actions).
 */
export function ErrorCard({
  tone = "error",
  icon = "alert-circle",
  title,
  moneyLine,
  body,
  actionLabel,
  onAction,
  actionLoading,
  secondaryLabel,
  onSecondary,
  testID,
}: {
  tone?: Tone;
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  moneyLine?: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  testID?: string;
}) {
  const t = TONES[tone];
  return (
    <View
      testID={testID}
      accessibilityRole="alert"
      style={[styles.card, softShadow, { borderColor: t.border }]}
    >
      <View style={[styles.iconWrap, { backgroundColor: t.bg }]}>
        <Ionicons name={icon} size={22} color={t.fg} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {moneyLine ? (
        <View style={[styles.moneyPill, { backgroundColor: t.bg }]}>
          <Ionicons
            name={
              moneyLine.toLowerCase().startsWith("no money")
                ? "shield-checkmark"
                : "time"
            }
            size={14}
            color={t.fg}
          />
          <Text style={[styles.moneyText, { color: t.fg }]}>{moneyLine}</Text>
        </View>
      ) : null}
      <Text style={styles.body}>{body}</Text>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          loading={actionLoading}
          variant={tone === "error" ? "outline" : "primary"}
          style={styles.action}
          testID={testID ? `${testID}-action` : undefined}
        />
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Button
          label={secondaryLabel}
          onPress={onSecondary}
          variant="ghost"
          small
          style={styles.secondary}
          testID={testID ? `${testID}-secondary` : undefined}
        />
      ) : null}
    </View>
  );
}

export function EmptyState({
  icon = "sparkles",
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  testID,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  testID?: string;
}) {
  return (
    <View testID={testID} style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={26} color={C.brand} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="secondary"
          small
          style={styles.action}
          testID={testID ? `${testID}-action` : undefined}
        />
      ) : null}
      {secondaryLabel && onSecondary ? (
        <Button
          label={secondaryLabel}
          onPress={onSecondary}
          variant="ghost"
          small
          testID={testID ? `${testID}-secondary` : undefined}
        />
      ) : null}
    </View>
  );
}

/** Compact inline banner for one failed independent section. */
export function SectionError({
  title,
  body,
  onRetry,
  retryLabel = "Retry",
  retrying,
  testID,
}: {
  title: string;
  body: string;
  onRetry?: () => void;
  retryLabel?: string;
  retrying?: boolean;
  testID?: string;
}) {
  return (
    <View testID={testID} accessibilityRole="alert" style={styles.section}>
      <Ionicons name="cloud-offline" size={20} color={C.warning} />
      <View style={styles.sectionText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionBody}>{body}</Text>
      </View>
      {onRetry ? (
        <Button
          label={retryLabel}
          onPress={onRetry}
          loading={retrying}
          loadingLabel="Retrying"
          variant="outline"
          small
          testID={testID ? `${testID}-retry` : undefined}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    borderWidth: 1.5,
    padding: S.xl,
    alignItems: "flex-start",
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: R.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.md,
  },
  title: {
    fontFamily: F.display,
    fontSize: 19,
    lineHeight: 25,
    color: C.ink,
    marginBottom: S.sm,
  },
  moneyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: R.pill,
    paddingHorizontal: S.md,
    paddingVertical: 5,
    marginBottom: S.md,
  },
  moneyText: { fontFamily: F.bold, fontSize: 12.5 },
  body: {
    fontFamily: F.med,
    fontSize: 14,
    lineHeight: 21,
    color: C.inkSoft,
  },
  action: { marginTop: S.lg, alignSelf: "stretch" },
  secondary: { marginTop: S.sm, alignSelf: "center" },
  empty: {
    alignItems: "center",
    paddingVertical: S.xxl,
    paddingHorizontal: S.xl,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: R.lg,
    backgroundColor: C.lavenderSoft,
    borderWidth: 1.5,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.lg,
  },
  emptyTitle: {
    fontFamily: F.display,
    fontSize: 18,
    color: C.ink,
    textAlign: "center",
    marginBottom: S.sm,
  },
  emptyBody: {
    fontFamily: F.med,
    fontSize: 13.5,
    lineHeight: 20,
    color: C.inkSoft,
    textAlign: "center",
    maxWidth: 300,
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    backgroundColor: C.warningBg,
    borderRadius: R.md + 2,
    borderWidth: 1,
    borderColor: "#F5D9BC",
    padding: S.lg,
  },
  sectionText: { flex: 1 },
  sectionTitle: { fontFamily: F.bold, fontSize: 13.5, color: C.ink },
  sectionBody: {
    fontFamily: F.med,
    fontSize: 12.5,
    lineHeight: 17,
    color: C.inkSoft,
    marginTop: 2,
  },
});
