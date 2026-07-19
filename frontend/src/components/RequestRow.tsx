import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import PressableScale from "./PressableScale";
import StatusBadge from "./StatusBadge";
import { fmtMon, timeAgo } from "@/src/lib/format";
import type { PaymentRequest } from "@/src/lib/types";
import { C, F, HAIRLINE, MONO, S } from "@/src/theme";

export function routeForRequest(r: PaymentRequest): string {
  if (r.status === "paid") return `/receipt/${r.id}`;
  if (r.mine) return `/share/${r.id}`;
  return `/pay/${r.id}`;
}

/** Ledger-style row — hairline dividers, mono figures, no card chrome. */
export default function RequestRow({
  request,
  last,
}: {
  request: PaymentRequest;
  last?: boolean;
}) {
  const router = useRouter();
  const incoming = Boolean(request.mine);

  return (
    <PressableScale
      testID={`request-row-${request.id}`}
      accessibilityLabel={`${request.memo || "Payment request"}, ${fmtMon(request.amountMon)} MON, ${request.status}`}
      onPress={() => router.push(routeForRequest(request) as never)}
      style={[styles.row, !last && styles.rowBorder]}
      haptic={null}
      scaleTo={0.99}
    >
      <View style={styles.icon}>
        <Ionicons
          name={incoming ? "arrow-down" : "arrow-up"}
          size={15}
          color={C.ink}
        />
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
        <Text style={styles.amount} numberOfLines={1}>
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
    paddingVertical: S.md + 3,
  },
  rowBorder: {
    borderBottomWidth: HAIRLINE,
    borderBottomColor: C.surface3,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1.25,
    borderColor: C.ink,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  mid: { flex: 1, minWidth: 0 },
  title: { fontFamily: F.semi, fontSize: 14.5, color: C.ink },
  sub: { fontFamily: MONO, fontSize: 10.5, color: C.inkFaint, marginTop: 3 },
  right: { alignItems: "flex-end", gap: 5 },
  amount: { fontFamily: F.display, fontSize: 15, color: C.ink },
  unit: { fontFamily: F.semi, fontSize: 10, color: C.inkFaint },
});
