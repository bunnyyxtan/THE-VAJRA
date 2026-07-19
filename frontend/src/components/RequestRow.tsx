import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import PressableScale from "./PressableScale";
import StatusBadge from "./StatusBadge";
import { fmtMon, timeAgo } from "@/src/lib/format";
import type { PaymentRequest, RequestStatus } from "@/src/lib/types";
import { C, F, HAIRLINE, MONO, S } from "@/src/theme";

export function routeForRequest(r: PaymentRequest): string {
  if (r.status === "paid") return `/receipt/${r.id}`;
  if (r.mine) return `/share/${r.id}`;
  return `/pay/${r.id}`;
}

const CHIP: Record<RequestStatus, { bg: string; fg: string }> = {
  active: { bg: C.lavenderSoft, fg: C.brand },
  paid: { bg: C.emeraldBg, fg: C.emeraldDeep },
  expired: { bg: C.surface2, fg: C.inkSoft },
  revoked: { bg: C.errorBg, fg: C.error },
};

const iconFor = (
  r: PaymentRequest,
  incoming: boolean,
): keyof typeof Ionicons.glyphMap => {
  if (r.status === "paid") return "checkmark";
  if (r.status === "expired") return "time-outline";
  if (r.status === "revoked") return "close";
  return incoming ? "arrow-down" : "arrow-up";
};

/** Ledger-style row — status-tinted icon chip, mono figures, hairline dividers. */
export default function RequestRow({
  request,
  last,
}: {
  request: PaymentRequest;
  last?: boolean;
}) {
  const router = useRouter();
  const incoming = Boolean(request.mine);
  const chip = CHIP[request.status];

  return (
    <PressableScale
      testID={`request-row-${request.id}`}
      accessibilityLabel={`${request.memo || "Payment request"}, ${fmtMon(request.amountMon)} MON, ${request.status}`}
      onPress={() => router.push(routeForRequest(request) as never)}
      style={[styles.row, !last && styles.rowBorder]}
      haptic={null}
      scaleTo={0.99}
    >
      <View style={[styles.icon, { backgroundColor: chip.bg }]}>
        <Ionicons name={iconFor(request, incoming)} size={16} color={chip.fg} />
      </View>
      <View style={styles.mid}>
        <Text style={styles.title} numberOfLines={1}>
          {request.memo || (incoming ? "Payment request" : "Payment sent")}
        </Text>
        <Text style={styles.sub} numberOfLines={1}>
          {request.id} · {timeAgo(request.createdAt)}
        </Text>
      </View>
      <View style={styles.right}>
        <Text
          style={[
            styles.amount,
            request.status === "paid" && { color: C.emeraldDeep },
          ]}
          numberOfLines={1}
        >
          {incoming ? "+" : "−"}
          {fmtMon(request.amountMon)}
          <Text style={styles.unit}> MON</Text>
        </Text>
        <StatusBadge status={request.status} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    paddingVertical: S.lg,
  },
  rowBorder: {
    borderBottomWidth: HAIRLINE,
    borderBottomColor: C.surface3,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.25,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  mid: { flex: 1, minWidth: 0 },
  title: { fontFamily: F.semi, fontSize: 15, color: C.ink },
  sub: { fontFamily: MONO, fontSize: 10.5, color: C.inkFaint, marginTop: 4 },
  right: { alignItems: "flex-end", gap: 6 },
  amount: { fontFamily: F.display, fontSize: 16, color: C.ink },
  unit: { fontFamily: F.semi, fontSize: 10.5, color: C.inkFaint },
});
