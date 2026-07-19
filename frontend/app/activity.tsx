import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";

import RequestRow from "@/src/components/RequestRow";
import Screen, { ChipRow } from "@/src/components/Screen";
import Skeleton from "@/src/components/Skeleton";
import { EmptyState, SectionError } from "@/src/components/StateViews";
import { delay } from "@/src/lib/mock";
import type { RequestStatus } from "@/src/lib/types";
import { useVajra } from "@/src/state/vajra";
import { C, R, S } from "@/src/theme";

type Filter = "all" | RequestStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "paid", label: "Settled" },
  { key: "expired", label: "Expired" },
  { key: "revoked", label: "Revoked" },
];

const EMPTY_COPY: Record<Filter, { title: string; body: string }> = {
  all: {
    title: "No payment activity yet",
    body: "Requests you create, send, or receive will appear here.",
  },
  active: {
    title: "You have no unpaid requests",
    body: "Every active request has been completed, revoked, or expired.",
  },
  paid: {
    title: "No settled payments yet",
    body: "Once a request is paid and final on Monad, its receipt appears here.",
  },
  expired: {
    title: "No expired requests",
    body: "Requests that pass their expiry without being paid will appear here.",
  },
  revoked: {
    title: "No revoked requests",
    body: "Requests you cancel before payment will appear here.",
  },
};

export default function Activity() {
  const router = useRouter();
  const { hydrated, requests, settings } = useVajra();
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let alive = true;
    delay(850).then(() => {
      if (alive) setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await delay(900);
    setRefreshing(false);
  }, []);

  const items = requests
    .filter((r) => filter === "all" || r.status === filter)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const showSkeleton = loading || !hydrated;
  // derived from live settings so hydration timing can never hide the outage
  const refreshFailed = !showSkeleton && settings.outage;
  const empty = EMPTY_COPY[filter];

  return (
    <Screen
      title="Activity"
      scroll={false}
      padded={false}
      maxWidth={760}
      testID="activity-screen"
      belowHeader={
        <ChipRow
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          testIDPrefix="activity-filter"
        />
      }
    >
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={C.brand}
            colors={[C.brand]}
          />
        }
      >
        {refreshFailed ? (
          <View style={{ marginBottom: S.lg }}>
            <SectionError
              testID="activity-refresh-error"
              title="Activity could not be refreshed"
              body="Your saved requests are still available below."
              retryLabel="Retry"
              retrying={refreshing}
              onRetry={refresh}
            />
          </View>
        ) : null}

        {showSkeleton ? (
          <View style={{ gap: S.md }} testID="activity-skeleton">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} h={68} r={R.md + 4} />
            ))}
          </View>
        ) : items.length === 0 ? (
          <EmptyState
            testID="activity-empty"
            icon={filter === "active" ? "checkmark-done" : "leaf-outline"}
            title={empty.title}
            body={empty.body}
            actionLabel={filter === "all" ? "Create a payment request" : undefined}
            onAction={filter === "all" ? () => router.push("/create") : undefined}
            secondaryLabel={filter === "all" ? "Open a Vajra link" : "Show all activity"}
            onSecondary={
              filter === "all"
                ? () => router.push("/open-link")
                : () => setFilter("all")
            }
          />
        ) : (
          <View style={styles.ledger}>
            {items.map((r, i) => (
              <RequestRow key={r.id} request={r} last={i === items.length - 1} />
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: S.lg, paddingBottom: S.xxxl },
  ledger: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.ink,
    paddingHorizontal: S.lg,
    boxShadow: "0px 4px 0px #0E091C",
    marginBottom: S.sm,
  },
});
