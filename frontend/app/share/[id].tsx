import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Share, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import QRCode from "react-native-qrcode-svg";

import Button from "@/src/components/Button";
import PressableScale, { triggerHaptic } from "@/src/components/PressableScale";
import Screen from "@/src/components/Screen";
import Sheet from "@/src/components/Sheet";
import StatusBadge from "@/src/components/StatusBadge";
import { EmptyState, ErrorCard } from "@/src/components/StateViews";
import { useToast } from "@/src/components/Toast";
import { useBreakpoint } from "@/src/hooks/use-breakpoint";
import { fmtDateTime, fmtMon, shortAddr, timeUntil } from "@/src/lib/format";
import { delay, linkFor } from "@/src/lib/mock";
import { useMotionPref, useVajra } from "@/src/state/vajra";
import { C, F, MONO, R, S, cardShadow } from "@/src/theme";

export default function ShareRequest() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getRequest, updateRequest, addRequest } = useVajra();
  const { toast } = useToast();
  const reduceMotion = useMotionPref();
  const { isDesktop } = useBreakpoint();

  const [copied, setCopied] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const request = id ? getRequest(String(id)) : undefined;

  if (!request) {
    return (
      <Screen title="Share request" testID="share-screen">
        <EmptyState
          testID="share-not-found"
          icon="help-circle-outline"
          title="Request not found"
          body="This request may have been removed from this device. Nothing was paid."
          actionLabel="Back to home"
          onAction={() => router.replace("/")}
        />
      </Screen>
    );
  }

  const link = linkFor(request.id);
  const remaining = timeUntil(request.expiresAt);

  const copyLink = async () => {
    try {
      await Clipboard.setStringAsync(link);
      triggerHaptic("success");
      setCopied(true);
      toast("Secure link copied", "success");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast("Could not copy. Try again.", "error");
    }
  };

  const shareLink = async () => {
    try {
      await Share.share({ message: `Pay me securely with Vajra: ${link}` });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

  const revoke = async () => {
    setRevoking(true);
    await delay(900);
    if (request.mine) updateRequest(request.id, { status: "revoked" });
    else addRequest({ ...request, status: "revoked" });
    setRevoking(false);
    setRevokeOpen(false);
    triggerHaptic("success");
  };

  return (
    <Screen
      title="Share request"
      subtitle={request.id}
      onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      maxWidth={request.status === "active" ? 1000 : 640}
      testID="share-screen"
    >
      {/* Status */}
      <View style={styles.statusRow}>
        <StatusBadge status={request.status} testID="share-status-badge" />
        {request.status === "active" ? (
          <Text style={styles.statusMeta}>
            {remaining
              ? `Expires in ${remaining}`
              : request.expiresAt
                ? "Expiring…"
                : "No expiry"}
          </Text>
        ) : null}
      </View>

      {request.status === "revoked" ? (
        <ErrorCard
          testID="share-revoked-card"
          tone="error"
          icon="ban"
          title="This request is revoked"
          moneyLine="No money moved"
          body="Anyone opening the link will see it as revoked and payment is blocked. Create a new request if you still expect this payment."
          actionLabel="Create a new request"
          onAction={() => router.replace("/create")}
        />
      ) : request.status === "expired" ? (
        <ErrorCard
          testID="share-expired-card"
          tone="warning"
          icon="time"
          title="This request has expired"
          moneyLine="No money moved"
          body={`It stopped being payable on ${request.expiresAt ? fmtDateTime(request.expiresAt) : "its expiry"}. Create a new request if you still expect this payment.`}
          actionLabel="Create a new request"
          onAction={() => router.replace("/create")}
        />
      ) : request.status === "paid" ? (
        <ErrorCard
          testID="share-paid-card"
          tone="success"
          icon="checkmark-circle"
          title="This request has been settled"
          body={`${fmtMon(request.amountMon)} MON was paid${request.paidAt ? ` on ${fmtDateTime(request.paidAt)}` : ""} and is final on Monad.`}
          actionLabel="View permanent receipt"
          onAction={() => router.push(`/receipt/${request.id}` as never)}
        />
      ) : (
        <View style={isDesktop ? styles.cols : undefined}>
          {/* QR */}
          <View style={isDesktop ? styles.colQr : undefined}>
          <Animated.View
            entering={reduceMotion ? undefined : FadeInDown.duration(360)}
            style={[styles.qrCard, cardShadow]}
            testID="share-qr-card"
          >
            {qrFailed ? (
              <View style={styles.qrFallback}>
                <Ionicons name="qr-code-outline" size={36} color={C.inkFaint} />
                <Text style={styles.qrFallbackText}>
                  QR unavailable right now. The secure link below still works.
                </Text>
              </View>
            ) : (
              <QRCode
                value={link}
                size={216}
                color={C.ink}
                backgroundColor={C.white}
                onError={() => setQrFailed(true)}
              />
            )}
            <View style={styles.qrAmountRow}>
              <Text style={styles.qrAmount}>{fmtMon(request.amountMon)} MON</Text>
              {request.memo ? (
                <Text style={styles.qrMemo} numberOfLines={1}>
                  {request.memo}
                </Text>
              ) : null}
            </View>
          </Animated.View>
          </View>

          {/* Link + copy */}
          <View style={isDesktop ? styles.colDetails : undefined}>
          <View style={[styles.linkRow, isDesktop && { marginTop: 0 }]}>
            <View style={styles.linkBox}>
              <Text style={styles.linkText} numberOfLines={1}>
                {link.replace("https://", "")}
              </Text>
            </View>
            <PressableScale
              testID="share-copy-button"
              accessibilityLabel={copied ? "Copied" : "Copy secure link"}
              onPress={copyLink}
              style={[styles.copyBtn, copied && styles.copyBtnDone]}
            >
              <Ionicons
                name={copied ? "checkmark" : "copy-outline"}
                size={16}
                color={copied ? C.success : C.onBrand}
              />
              <Text style={[styles.copyText, copied && { color: C.success }]}>
                {copied ? "Copied" : "Copy"}
              </Text>
            </PressableScale>
          </View>

          <Button
            label="Share secure link"
            icon="share-outline"
            variant="outline"
            onPress={shareLink}
            style={{ marginTop: S.md }}
            testID="share-native-button"
          />

          {/* Protected summary */}
          <View style={styles.summary}>
            <SummaryRow label="To" value={shortAddr(request.recipient)} mono />
            <SummaryRow label="Network" value={request.network} />
            <SummaryRow
              label="Expires"
              value={
                request.expiresAt ? fmtDateTime(request.expiresAt) : "No expiry"
              }
            />
            <SummaryRow
              label="Who can pay"
              value={
                request.restrictedPayer
                  ? shortAddr(request.restrictedPayer)
                  : "Anyone"
              }
              mono={Boolean(request.restrictedPayer)}
            />
            <View style={styles.lockRow}>
              <Ionicons name="lock-closed" size={13} color={C.brand} />
              <Text style={styles.lockText}>
                Terms locked with {request.authMethod === "passkey" ? "Vajra Touch" : "wallet signature"}. Any change breaks the link.
              </Text>
            </View>
          </View>

          <Button
            label="View as payer"
            icon="eye-outline"
            variant="ghost"
            onPress={() => router.push(`/pay/${request.id}` as never)}
            style={{ marginTop: S.lg }}
            testID="share-view-as-payer"
          />
          <Button
            label="Revoke request"
            icon="ban"
            variant="danger"
            onPress={() => setRevokeOpen(true)}
            style={{ marginTop: S.sm }}
            testID="share-revoke-button"
          />
          </View>
        </View>
      )}

      <Sheet
        visible={revokeOpen}
        onClose={() => !revoking && setRevokeOpen(false)}
        title="Revoke this request?"
        testID="revoke-sheet"
      >
        <Text style={styles.sheetBody}>
          Anyone opening the link will see it as revoked and payment will be
          blocked. This cannot be undone.
        </Text>
        <View style={styles.sheetMoney}>
          <Ionicons name="shield-checkmark" size={14} color={C.success} />
          <Text style={styles.sheetMoneyText}>No money moves</Text>
        </View>
        <Button
          label="Revoke request"
          variant="danger"
          loading={revoking}
          loadingLabel="Revoking…"
          onPress={revoke}
          style={{ marginTop: S.lg }}
          testID="revoke-confirm-button"
        />
        <Button
          label="Keep it active"
          variant="ghost"
          small
          onPress={() => setRevokeOpen(false)}
          style={{ marginTop: S.sm }}
          testID="revoke-cancel-button"
        />
      </Sheet>
    </Screen>
  );
}

function SummaryRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, mono && { fontFamily: MONO, fontSize: 12.5 }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cols: {
    flexDirection: "row",
    gap: S.xxxl,
    alignItems: "flex-start",
  },
  colQr: { flex: 1, maxWidth: 440 },
  colDetails: { flex: 1.1, minWidth: 0 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    marginBottom: S.lg,
  },
  statusMeta: { fontFamily: F.med, fontSize: 12.5, color: C.inkSoft },
  qrCard: {
    backgroundColor: C.white,
    borderRadius: R.lg + 4,
    borderWidth: 1.5,
    borderColor: C.borderStrong,
    padding: S.xl,
    alignItems: "center",
    boxShadow: "0px 5px 0px #0E091C",
  },
  qrFallback: {
    width: 216,
    height: 216,
    alignItems: "center",
    justifyContent: "center",
    gap: S.md,
    backgroundColor: C.surface2,
    borderRadius: R.md,
    padding: S.lg,
  },
  qrFallbackText: {
    fontFamily: F.med,
    fontSize: 12.5,
    lineHeight: 18,
    color: C.inkSoft,
    textAlign: "center",
  },
  qrAmountRow: { alignItems: "center", marginTop: S.lg },
  qrAmount: { fontFamily: F.display, fontSize: 26, color: C.ink },
  qrMemo: { fontFamily: F.med, fontSize: 13, color: C.inkSoft, marginTop: 2 },
  linkRow: { flexDirection: "row", gap: S.sm, marginTop: S.lg },
  linkBox: {
    flex: 1,
    backgroundColor: C.surface2,
    borderRadius: R.md + 2,
    justifyContent: "center",
    paddingHorizontal: S.md,
    height: 48,
  },
  linkText: { fontFamily: MONO, fontSize: 12.5, color: C.ink },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: 96,
    height: 48,
    borderRadius: R.md + 2,
    backgroundColor: C.brand,
    borderWidth: 1.25,
    borderColor: C.ink,
    boxShadow: "0px 3px 0px #0E091C",
  },
  copyBtnDone: { backgroundColor: C.successBg },
  copyText: { fontFamily: F.semi, fontSize: 13.5, color: C.onBrand },
  summary: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: S.lg,
    paddingVertical: S.xs,
    marginTop: S.xl,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: S.md - 1,
    gap: S.md,
  },
  summaryLabel: { fontFamily: F.med, fontSize: 13, color: C.inkSoft },
  summaryValue: {
    fontFamily: F.semi,
    fontSize: 13.5,
    color: C.ink,
    flexShrink: 1,
    textAlign: "right",
  },
  lockRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingVertical: S.md,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  lockText: {
    flex: 1,
    fontFamily: F.med,
    fontSize: 11.5,
    lineHeight: 16,
    color: C.inkSoft,
  },
  sheetBody: {
    fontFamily: F.med,
    fontSize: 13.5,
    lineHeight: 20,
    color: C.inkSoft,
  },
  sheetMoney: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.successBg,
    alignSelf: "flex-start",
    borderRadius: R.pill,
    paddingHorizontal: S.md,
    paddingVertical: 5,
    marginTop: S.md,
  },
  sheetMoneyText: { fontFamily: F.bold, fontSize: 12.5, color: C.success },
});
