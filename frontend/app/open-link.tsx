import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";

import Button from "@/src/components/Button";
import PressableScale from "@/src/components/PressableScale";
import QRScannerModal from "@/src/components/QRScanner";
import Screen from "@/src/components/Screen";
import { useToast } from "@/src/components/Toast";
import { useBreakpoint } from "@/src/hooks/use-breakpoint";
import { SCENARIO_LIST } from "@/src/lib/mock";
import { useVajra } from "@/src/state/vajra";
import { C, F, MONO, R, S } from "@/src/theme";

const extractCode = (raw: string): string | null => {
  const m = raw.trim().toUpperCase().match(/VJ-[A-Z0-9]{4,}/);
  return m ? m[0] : null;
};

export default function OpenLink() {
  const router = useRouter();
  const { getRequest } = useVajra();
  const { toast } = useToast();
  const { isDesktop } = useBreakpoint();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const open = () => {
    const code = extractCode(input);
    if (!code) {
      setError(
        "This does not look like a Vajra link. Paste the full link (vajra.link/r/…) or the request code. Nothing was paid.",
      );
      return;
    }
    if (!getRequest(code)) {
      setError(
        "No request found for that code. Check the link with the sender and try again. No money moved.",
      );
      return;
    }
    setError(null);
    router.push(`/pay/${code}` as never);
  };

  const handleScannedCode = (code: string): boolean => {
    if (!getRequest(code)) return false;
    setScannerOpen(false);
    router.push(`/pay/${code}` as never);
    return true;
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setInput(text);
        setError(null);
      } else {
        toast("Clipboard is empty");
      }
    } catch {
      toast("Could not read the clipboard. Try again.", "error");
    }
  };

  const toneColor = { ok: C.success, warn: C.warning, error: C.error } as const;
  const toneBg = { ok: C.successBg, warn: C.warningBg, error: C.errorBg } as const;
  const toneIcon = {
    ok: "checkmark-circle" as const,
    warn: "alert-circle" as const,
    error: "close-circle" as const,
  };

  return (
    <Screen title="Pay a request" maxWidth={1000} testID="open-link-screen">
      <View style={isDesktop ? styles.cols : undefined}>
      <View style={isDesktop ? styles.colMain : undefined}>
      {/* Scan entry */}
      <PressableScale
        testID="open-link-scan-button"
        accessibilityLabel="Scan a Vajra QR code"
        onPress={() => setScannerOpen(true)}
        style={styles.scanCard}
        scaleTo={0.99}
      >
        <View style={styles.scanIcon}>
          <Ionicons name="scan" size={24} color={C.onBrand} />
        </View>
        <View style={styles.scanText}>
          <Text style={styles.scanTitle}>Scan a Vajra QR</Text>
          <Text style={styles.scanBody}>
            Point your camera at the code the recipient shows you.
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={18} color={C.ink} />
      </PressableScale>

      <View style={styles.orRow}>
        <View style={styles.orRule} />
        <Text style={styles.orText}>OR PASTE A LINK</Text>
        <View style={styles.orRule} />
      </View>

      <Text style={styles.label}>SECURE LINK OR REQUEST CODE</Text>
      <View
        style={[styles.inputRow, error ? { borderColor: C.errorBright } : null]}
      >
        <TextInput
          testID="open-link-input"
          accessibilityLabel="Vajra link or request code"
          style={styles.input}
          placeholder="vajra.link/r/VJ-CAFE42"
          placeholderTextColor={C.inkFaint}
          autoCapitalize="none"
          autoCorrect={false}
          value={input}
          onChangeText={(t) => {
            setInput(t);
            if (error) setError(null);
          }}
          onSubmitEditing={open}
          returnKeyType="go"
        />
        <PressableScale
          testID="open-link-paste-button"
          accessibilityLabel="Paste from clipboard"
          onPress={pasteFromClipboard}
          style={styles.pasteBtn}
          haptic={null}
        >
          <Ionicons name="clipboard-outline" size={18} color={C.brand} />
          <Text style={styles.pasteText}>Paste</Text>
        </PressableScale>
      </View>
      <View style={styles.errorSlot} accessibilityLiveRegion="polite">
        {error ? (
          <Text testID="open-link-error" style={styles.errorText}>
            {error}
          </Text>
        ) : (
          <Text style={styles.helperText}>
            Requests and receipts are readable without connecting a wallet.
          </Text>
        )}
      </View>

      <Button
        label="Open request"
        icon="arrow-forward"
        onPress={open}
        disabled={input.trim().length === 0}
        disabledReason="Paste a Vajra link or request code to continue."
        testID="open-link-submit-button"
      />
      </View>

      {!isDesktop ? <View style={styles.divider} /> : null}
      <View style={isDesktop ? styles.colAside : undefined}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Sample requests</Text>
        <View style={styles.sectionRule} />
      </View>
      <Text style={styles.sectionSub}>
        Preview every request state with deterministic sample data.
      </Text>
      <View style={{ gap: S.sm, marginTop: S.md }}>
        {SCENARIO_LIST.map((s) => (
          <PressableScale
            key={s.id}
            testID={`scenario-${s.id}`}
            accessibilityLabel={`Open sample: ${s.title}`}
            onPress={() => router.push(`/pay/${s.id}` as never)}
            style={styles.scenarioRow}
            haptic={null}
            scaleTo={0.99}
          >
            <View style={[styles.scenarioIcon, { backgroundColor: toneBg[s.tone] }]}>
              <Ionicons name={toneIcon[s.tone]} size={17} color={toneColor[s.tone]} />
            </View>
            <View style={styles.scenarioText}>
              <Text style={styles.scenarioTitle}>{s.title}</Text>
              <Text style={styles.scenarioDesc}>{s.desc}</Text>
            </View>
            <Text style={styles.scenarioCode}>{s.id}</Text>
          </PressableScale>
        ))}
      </View>
      </View>
      </View>

      <QRScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onCode={handleScannedCode}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cols: {
    flexDirection: "row",
    gap: S.xxxl,
    alignItems: "flex-start",
  },
  colMain: { flex: 1, maxWidth: 500 },
  colAside: { flex: 1, minWidth: 0 },
  scanCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    backgroundColor: C.lavender,
    borderRadius: R.lg - 4,
    borderWidth: 1.5,
    borderColor: C.ink,
    padding: S.lg,
    boxShadow: "0px 4px 0px #0E091C",
  },
  scanIcon: {
    width: 44,
    height: 44,
    borderRadius: R.md,
    backgroundColor: C.brand,
    borderWidth: 1.25,
    borderColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
  },
  scanText: { flex: 1 },
  scanTitle: { fontFamily: F.display, fontSize: 16.5, color: C.ink },
  scanBody: {
    fontFamily: F.med,
    fontSize: 12.5,
    lineHeight: 17,
    color: C.inkSoft,
    marginTop: 2,
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    marginVertical: S.xl,
  },
  orRule: { flex: 1, height: 1, backgroundColor: C.surface3 },
  orText: {
    fontFamily: F.bold,
    fontSize: 9.5,
    letterSpacing: 1.6,
    color: C.inkFaint,
  },
  label: {
    fontFamily: F.bold,
    fontSize: 10,
    letterSpacing: 1.4,
    color: C.inkFaint,
    marginBottom: S.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.borderStrong,
    borderRadius: R.md + 2,
    paddingLeft: S.lg,
    paddingRight: S.sm,
    height: 56,
  },
  input: {
    flex: 1,
    fontFamily: MONO,
    fontSize: 14,
    color: C.ink,
    height: "100%",
  },
  pasteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: C.lavenderSoft,
    borderRadius: R.sm + 2,
    paddingHorizontal: S.md,
    height: 40,
  },
  pasteText: { fontFamily: F.semi, fontSize: 13, color: C.brand },
  errorSlot: { minHeight: 44, justifyContent: "center", marginVertical: S.sm },
  errorText: {
    fontFamily: F.med,
    fontSize: 12.5,
    lineHeight: 18,
    color: C.error,
  },
  helperText: {
    fontFamily: F.med,
    fontSize: 12.5,
    lineHeight: 18,
    color: C.inkFaint,
  },
  divider: { height: 1, backgroundColor: C.border, marginVertical: S.xl },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: S.md },
  sectionTitle: { fontFamily: F.display, fontSize: 18, color: C.ink },
  sectionRule: { flex: 1, height: 1.5, backgroundColor: C.ink },
  sectionSub: {
    fontFamily: F.med,
    fontSize: 12.5,
    lineHeight: 18,
    color: C.inkSoft,
    marginTop: 6,
  },
  scenarioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: S.md,
    backgroundColor: C.white,
    borderRadius: R.md + 2,
    borderWidth: 1,
    borderColor: C.border,
    padding: S.md,
  },
  scenarioIcon: {
    width: 34,
    height: 34,
    borderRadius: R.sm + 2,
    alignItems: "center",
    justifyContent: "center",
  },
  scenarioText: { flex: 1, minWidth: 0 },
  scenarioTitle: { fontFamily: F.semi, fontSize: 14, color: C.ink },
  scenarioDesc: { fontFamily: F.med, fontSize: 11.5, color: C.inkSoft, marginTop: 1 },
  scenarioCode: { fontFamily: MONO, fontSize: 10.5, color: C.inkFaint },
});
