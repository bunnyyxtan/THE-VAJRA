import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";

import Button from "@/src/components/Button";
import PressableScale, { triggerHaptic } from "@/src/components/PressableScale";
import Screen from "@/src/components/Screen";
import Sheet from "@/src/components/Sheet";
import StatusBadge from "@/src/components/StatusBadge";
import { useToast } from "@/src/components/Toast";
import { ConnectWalletSheet } from "@/src/components/WalletSheets";
import { useBreakpoint } from "@/src/hooks/use-breakpoint";
import { fmtDateTime, shortAddr } from "@/src/lib/format";
const delay = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
import { useVajra } from "@/src/state/vajra";
import { C, F, MONO, R, S, softShadow } from "@/src/theme";

export default function Security() {
  const router = useRouter();
  const { passkey, setPasskey, wallet, setWallet, settings, setSetting } =
    useVajra();
  const { toast } = useToast();
  const { isDesktop } = useBreakpoint();
  const [disableOpen, setDisableOpen] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [justDisabled, setJustDisabled] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [neverOpen, setNeverOpen] = useState(false);
  const [walletExpanded, setWalletExpanded] = useState(false);

  const disablePasskey = async () => {
    setDisabling(true);
    await delay(900);
    setPasskey(null);
    setDisabling(false);
    setDisableOpen(false);
    setJustDisabled(true);
    triggerHaptic("success");
  };

  return (
    <Screen title="Security" maxWidth={1000} testID="security-screen">
      <View style={isDesktop ? styles.grid : undefined}>
      <View style={isDesktop ? styles.cell : undefined}>
      {/* Vajra Touch */}
      <Text style={styles.sectionTitle}>Vajra Touch</Text>
      {passkey ? (
        <View style={[styles.card, softShadow]}>
          <View style={styles.cardHead}>
            <View style={styles.keyIcon}>
              <Ionicons name="finger-print" size={22} color={C.onBrand} />
            </View>
            <View style={styles.cardHeadText}>
              <Text style={styles.cardTitle}>{passkey.name}</Text>
              <Text style={styles.cardSub}>
                {passkey.device} · Created {fmtDateTime(passkey.createdAt)}
              </Text>
            </View>
            <StatusBadge status="active" testID="passkey-status-badge" />
          </View>
          <View style={styles.cardDivider} />
          <PressableScale
            testID="security-how-passkey-works"
            accessibilityLabel="How Vajra Touch works"
            onPress={() => setHowOpen(true)}
            style={styles.rowLink}
            haptic={null}
          >
            <Ionicons name="help-circle-outline" size={19} color={C.brand} />
            <Text style={styles.rowLinkText}>How Vajra Touch works</Text>
            <Ionicons name="chevron-forward" size={16} color={C.inkFaint} />
          </PressableScale>
          <PressableScale
            testID="security-disable-passkey"
            accessibilityLabel="Disable Vajra Touch"
            onPress={() => setDisableOpen(true)}
            style={styles.rowLink}
            haptic={null}
          >
            <Ionicons name="close-circle-outline" size={19} color={C.error} />
            <Text style={[styles.rowLinkText, { color: C.error }]}>
              Disable Vajra Touch
            </Text>
            <Ionicons name="chevron-forward" size={16} color={C.inkFaint} />
          </PressableScale>
        </View>
      ) : (
        <View style={[styles.card, softShadow]}>
          {justDisabled ? (
            <View style={styles.disabledNote} testID="passkey-disabled-note">
              <Ionicons name="checkmark-circle" size={17} color={C.success} />
              <Text style={styles.disabledNoteText}>
                Vajra Touch was disabled. Existing authenticated requests and
                receipts stay valid.
              </Text>
            </View>
          ) : null}
          <Text style={styles.cardTitle}>Not set up on this device</Text>
          <Text style={[styles.cardSub, { marginTop: 4 }]}>
            New requests can’t be authenticated here until Vajra Touch is set
            up.
          </Text>
          <Button
            label="Set up Vajra Touch"
            icon="finger-print"
            variant="secondary"
            onPress={() => router.push("/passkey-setup")}
            style={{ marginTop: S.lg }}
            testID="security-setup-passkey-button"
          />
        </View>
      )}
      </View>

      {/* Wallet */}
      <View style={isDesktop ? styles.cell : undefined}>
      <Text style={styles.sectionTitle}>Wallet</Text>
      <View style={[styles.card, softShadow]}>
        {wallet ? (
          <View>
            <View style={styles.cardHead}>
              <View style={[styles.keyIcon, { backgroundColor: C.lavenderSoft }]}>
                <Ionicons name="wallet" size={20} color={C.brand} />
              </View>
              <View style={styles.cardHeadText}>
                <Text style={styles.cardTitle}>{wallet.label}</Text>
                <Text style={styles.cardSub}>{wallet.network}</Text>
              </View>
            </View>
            <PressableScale
              testID="security-wallet-address"
              accessibilityLabel="Toggle full wallet address"
              onPress={() => setWalletExpanded((e) => !e)}
              style={styles.addrBox}
              haptic={null}
            >
              <Text style={styles.addrText}>
                {walletExpanded ? wallet.address : shortAddr(wallet.address)}
              </Text>
              <Text style={styles.addrHint}>
                {walletExpanded ? "Tap to shorten" : "Tap to view full"}
              </Text>
            </PressableScale>
            <Button
              label="Disconnect wallet"
              variant="outline"
              small
              onPress={() => {
                setWallet(null);
                toast("Wallet disconnected");
              }}
              style={{ marginTop: S.md }}
              testID="security-disconnect-wallet"
            />
          </View>
        ) : (
          <View>
            <Text style={styles.cardTitle}>No wallet connected</Text>
            <Text style={[styles.cardSub, { marginTop: 4 }]}>
              Connect a wallet to receive funds and pay verified requests.
              Viewing requests and receipts never requires a wallet.
            </Text>
            <Button
              label="Connect wallet"
              icon="wallet"
              variant="secondary"
              onPress={() => setConnectOpen(true)}
              style={{ marginTop: S.lg }}
              testID="security-connect-wallet"
            />
          </View>
        )}
      </View>
      </View>

      {/* Preferences */}
      <View style={isDesktop ? styles.cell : undefined}>
      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={[styles.card, softShadow, { paddingVertical: S.xs }]}>
        <ToggleRow
          testID="security-toggle-reduce-motion"
          icon="walk"
          label="Reduce motion"
          sub="Minimize animation across the app"
          value={settings.reduceMotion}
          onChange={(v) => setSetting("reduceMotion", v)}
        />
        <View style={styles.cardDivider} />
        <ToggleRow
          testID="security-toggle-reduce-transparency"
          icon="layers"
          label="Reduce transparency"
          sub="Replace glass surfaces with solid ones"
          value={settings.reduceTransparency}
          onChange={(v) => setSetting("reduceTransparency", v)}
        />
      </View>
      </View>

      {/* Network status */}
      <View style={isDesktop ? styles.cell : undefined}>
      <Text style={styles.sectionTitle}>Network</Text>
      <View style={[styles.card, softShadow, { paddingVertical: S.xs }]}>
        <ToggleRow
          testID="security-network-mainnet"
          icon="flash"
          label="Monad Mainnet"
          sub="Chain ID 143 · real MON moves on every payment"
          value={true}
          onChange={() => {}}
        />
      </View>
      </View>
      </View>

      <PressableScale
        testID="security-never-asks"
        accessibilityLabel="What Vajra never asks for"
        onPress={() => setNeverOpen(true)}
        style={styles.neverRow}
        haptic={null}
      >
        <Ionicons name="shield-half-outline" size={18} color={C.brand} />
        <Text style={styles.neverText}>What Vajra never asks for</Text>
        <Ionicons name="chevron-forward" size={16} color={C.inkFaint} />
      </PressableScale>

      {/* Sheets */}
      <Sheet
        visible={disableOpen}
        onClose={() => !disabling && setDisableOpen(false)}
        title="Disable Vajra Touch?"
        testID="disable-passkey-sheet"
      >
        <Text style={styles.sheetBody}>
          New requests from this device can’t be authenticated until you set
          it up again. Existing authenticated requests and receipts stay valid.
        </Text>
        <View style={styles.sheetMoney}>
          <Ionicons name="shield-checkmark" size={14} color={C.success} />
          <Text style={styles.sheetMoneyText}>No money moves</Text>
        </View>
        <Button
          label="Disable Vajra Touch"
          variant="danger"
          loading={disabling}
          loadingLabel="Disabling…"
          onPress={disablePasskey}
          style={{ marginTop: S.lg }}
          testID="disable-passkey-confirm"
        />
        <Button
          label="Keep it on"
          variant="ghost"
          small
          onPress={() => setDisableOpen(false)}
          style={{ marginTop: S.sm }}
          testID="disable-passkey-cancel"
        />
      </Sheet>

      <Sheet
        visible={howOpen}
        onClose={() => setHowOpen(false)}
        title="How Vajra Touch works"
        testID="how-passkey-sheet"
      >
        {[
          "Your device creates a passkey that only it controls. Vajra never sees or stores your biometrics.",
          "When you create a request, your device signs the exact terms: amount, wallet, network and expiry.",
          "Anyone opening your link verifies that signature. If a single character changes, the handshake breaks and payment is blocked.",
        ].map((t, i) => (
          <View key={i} style={styles.howRow}>
            <Text style={styles.howIndex}>{i + 1}</Text>
            <Text style={styles.sheetBody}>{t}</Text>
          </View>
        ))}
        <Button
          label="Got it"
          variant="secondary"
          onPress={() => setHowOpen(false)}
          style={{ marginTop: S.md }}
          testID="how-passkey-close"
        />
      </Sheet>

      <Sheet
        visible={neverOpen}
        onClose={() => setNeverOpen(false)}
        title="Vajra will never ask you to…"
        testID="never-asks-sheet"
      >
        {[
          "Paste a seed phrase or recovery phrase",
          "Export or upload a private key",
          "Upload a wallet file",
          "Disable your wallet's security features",
          "Trust a shortened address alone",
        ].map((t) => (
          <View key={t} style={styles.neverItem}>
            <Ionicons name="close-circle" size={17} color={C.error} />
            <Text style={styles.sheetBody}>{t}</Text>
          </View>
        ))}
        <Button
          label="Close"
          variant="secondary"
          onPress={() => setNeverOpen(false)}
          style={{ marginTop: S.md }}
          testID="never-asks-close"
        />
      </Sheet>

      <ConnectWalletSheet
        visible={connectOpen}
        onClose={() => setConnectOpen(false)}
        onConnected={(w) => {
          setWallet(w);
          toast("Wallet connected", "success");
        }}
      />
    </Screen>
  );
}

function ToggleRow({
  icon,
  label,
  sub,
  value,
  onChange,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
  testID: string;
}) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleIcon}>
        <Ionicons name={icon} size={17} color={C.inkSoft} />
      </View>
      <View style={styles.toggleText}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleSub}>{sub}</Text>
      </View>
      <Switch
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: C.surface3, true: C.brand }}
        thumbColor={C.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: S.xl,
    alignItems: "flex-start",
  },
  cell: { flexBasis: "46%", flexGrow: 1, minWidth: 320 },
  sectionTitle: {
    fontFamily: F.display,
    fontSize: 16,
    color: C.ink,
    marginBottom: S.md,
    marginTop: S.xl,
  },
  card: {
    backgroundColor: C.white,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.lg,
  },
  cardHead: { flexDirection: "row", alignItems: "center", gap: S.md },
  keyIcon: {
    width: 44,
    height: 44,
    borderRadius: R.md,
    backgroundColor: C.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  cardHeadText: { flex: 1, minWidth: 0 },
  cardTitle: { fontFamily: F.semi, fontSize: 15.5, color: C.ink },
  cardSub: { fontFamily: F.med, fontSize: 12, lineHeight: 17, color: C.inkSoft, marginTop: 2 },
  cardDivider: { height: 1, backgroundColor: C.border, marginVertical: S.sm },
  rowLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    paddingVertical: S.md,
    minHeight: 44,
  },
  rowLinkText: { flex: 1, fontFamily: F.semi, fontSize: 14, color: C.ink },
  addrBox: {
    backgroundColor: C.surface2,
    borderRadius: R.md,
    padding: S.md,
    marginTop: S.md,
  },
  addrText: { fontFamily: MONO, fontSize: 12.5, color: C.ink, lineHeight: 18 },
  addrHint: { fontFamily: F.med, fontSize: 11, color: C.brand, marginTop: 4 },
  disabledNote: {
    flexDirection: "row",
    gap: S.sm,
    alignItems: "flex-start",
    backgroundColor: C.successBg,
    borderRadius: R.md,
    padding: S.md,
    marginBottom: S.md,
  },
  disabledNoteText: {
    flex: 1,
    fontFamily: F.med,
    fontSize: 12.5,
    lineHeight: 18,
    color: C.success,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    paddingVertical: S.md,
  },
  toggleIcon: {
    width: 34,
    height: 34,
    borderRadius: R.sm + 2,
    backgroundColor: C.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: { flex: 1, minWidth: 0 },
  toggleLabel: { fontFamily: F.semi, fontSize: 14, color: C.ink },
  toggleSub: { fontFamily: F.med, fontSize: 11.5, lineHeight: 16, color: C.inkSoft, marginTop: 1 },
  neverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    padding: S.lg,
    marginTop: S.xl,
    backgroundColor: C.lavenderSoft,
    borderRadius: R.lg,
  },
  neverText: { flex: 1, fontFamily: F.semi, fontSize: 14, color: C.onLavender },
  neverItem: {
    flexDirection: "row",
    gap: S.sm,
    alignItems: "flex-start",
    marginBottom: S.sm,
  },
  sheetBody: {
    flex: 1,
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
  howRow: { flexDirection: "row", gap: S.md, marginBottom: S.md },
  howIndex: {
    fontFamily: F.display,
    fontSize: 15,
    color: C.brand,
    width: 18,
  },
});
