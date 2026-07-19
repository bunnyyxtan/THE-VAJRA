import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { C, F, MONO, R, S } from "@/src/theme";

export type StageStatus = "done" | "active" | "pending" | "failed";

export interface Stage {
  key: string;
  label: string;
  desc?: string;
  meta?: string;
  status: StageStatus;
}

/** Truthful vertical transaction rail — exactly one active stage, done stages calm and permanent. */
export default function StageRail({ stages }: { stages: Stage[] }) {
  return (
    <View accessibilityRole="progressbar" accessibilityLiveRegion="polite">
      {stages.map((s, i) => {
        const isLast = i === stages.length - 1;
        return (
          <View key={s.key} style={styles.row} testID={`stage-${s.key}-${s.status}`}>
            <View style={styles.railCol}>
              <View
                style={[
                  styles.node,
                  s.status === "done" && styles.nodeDone,
                  s.status === "active" && styles.nodeActive,
                  s.status === "failed" && styles.nodeFailed,
                ]}
              >
                {s.status === "done" ? (
                  <Ionicons name="checkmark" size={14} color={C.onBrand} />
                ) : s.status === "active" ? (
                  <ActivityIndicator size="small" color={C.brand} />
                ) : s.status === "failed" ? (
                  <Ionicons name="close" size={14} color={C.white} />
                ) : null}
              </View>
              {!isLast ? (
                <View
                  style={[
                    styles.line,
                    s.status === "done" && { backgroundColor: C.brand },
                  ]}
                />
              ) : null}
            </View>
            <View style={[styles.content, isLast && { paddingBottom: 0 }]}>
              <Text
                style={[
                  styles.label,
                  s.status === "pending" && { color: C.inkFaint },
                  s.status === "failed" && { color: C.error },
                ]}
              >
                {s.label}
              </Text>
              {s.desc ? <Text style={styles.desc}>{s.desc}</Text> : null}
              {s.meta ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {s.meta}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  railCol: { alignItems: "center", width: 32 },
  node: {
    width: 28,
    height: 28,
    borderRadius: R.pill,
    borderWidth: 2,
    borderColor: C.surface3,
    backgroundColor: C.white,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeDone: { backgroundColor: C.brand, borderColor: C.brand },
  nodeActive: { borderColor: C.brand },
  nodeFailed: { backgroundColor: C.errorBright, borderColor: C.errorBright },
  line: { flex: 1, width: 2, backgroundColor: C.surface3, marginVertical: 3 },
  content: { flex: 1, paddingLeft: S.md, paddingBottom: S.xl, paddingTop: 3 },
  label: { fontFamily: F.semi, fontSize: 15.5, color: C.ink },
  desc: { fontFamily: F.med, fontSize: 12.5, lineHeight: 18, color: C.inkSoft, marginTop: 2 },
  meta: { fontFamily: MONO, fontSize: 11.5, color: C.inkFaint, marginTop: 4 },
});
