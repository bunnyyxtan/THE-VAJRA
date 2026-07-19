import React from "react";
import { StyleSheet, Text, View } from "react-native";

import type { RequestStatus } from "@/src/lib/types";
import { C, F, S } from "@/src/theme";

const MAP: Record<RequestStatus, { bg: string; fg: string; label: string }> = {
  active: { bg: C.lavender, fg: C.onLavender, label: "ACTIVE" },
  paid: { bg: C.successBg, fg: C.success, label: "SETTLED" },
  expired: { bg: C.surface3, fg: C.inkSoft, label: "EXPIRED" },
  revoked: { bg: C.errorBg, fg: C.error, label: "REVOKED" },
};

export default function StatusBadge({
  status,
  testID,
}: {
  status: RequestStatus;
  testID?: string;
}) {
  const m = MAP[status];
  return (
    <View
      testID={testID}
      accessibilityLabel={`Status: ${m.label}`}
      style={[styles.badge, { backgroundColor: m.bg }]}
    >
      <Text style={[styles.text, { color: m.fg }]}>{m.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 5,
    paddingHorizontal: S.sm,
    height: 22,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    flexShrink: 0,
  },
  text: {
    fontFamily: F.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
});
