import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Button from "./Button";
import PressableScale, { triggerHaptic } from "./PressableScale";
import { C, F, R, S } from "@/src/theme";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Return true when the code was accepted (scanner closes), false to keep scanning. */
  onCode: (code: string) => boolean;
}

const extractCode = (raw: string): string | null => {
  const m = raw.trim().toUpperCase().match(/VJ-[A-Z0-9]{4,}/);
  return m ? m[0] : null;
};

/**
 * Full-screen Vajra QR scanner with a complete camera permission flow:
 * contextual explanation before the system prompt, denied and blocked states,
 * and a settings redirect when permission can no longer be requested.
 */
export default function QRScannerModal({ visible, onClose, onCode }: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [requesting, setRequesting] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const lastScan = useRef(0);
  const errTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScan = ({ data }: { data: string }) => {
    const now = Date.now();
    if (now - lastScan.current < 1500) return;
    lastScan.current = now;
    const code = extractCode(data);
    if (!code) {
      setScanError("This is not a Vajra request QR. Keep the code inside the frame.");
    } else if (!onCode(code)) {
      setScanError("No request found for this code. Ask the sender to check it.");
    } else {
      triggerHaptic("success");
      return;
    }
    triggerHaptic("error");
    if (errTimer.current) clearTimeout(errTimer.current);
    errTimer.current = setTimeout(() => setScanError(null), 2400);
  };

  const askPermission = async () => {
    setRequesting(true);
    try {
      await requestPermission();
    } finally {
      setRequesting(false);
    }
  };

  const renderBody = () => {
    if (Platform.OS === "web") {
      return <WebScannerBody onCode={onCode} />;
    }
    if (!permission) {
      return (
        <InfoPanel
          icon="camera-outline"
          title="Checking camera access"
          body="One moment."
          testID="scanner-loading"
        />
      );
    }
    if (!permission.granted) {
      if (permission.canAskAgain) {
        return (
          <InfoPanel
            icon="camera-outline"
            title="Allow camera to scan"
            body="Vajra uses your camera only while this scanner is open, and only to read Vajra QR codes. Nothing is recorded."
            actionLabel="Allow camera access"
            actionLoading={requesting}
            onAction={askPermission}
            secondaryLabel="Paste a link instead"
            onSecondary={onClose}
            testID="scanner-permission-request"
          />
        );
      }
      return (
        <InfoPanel
          icon="settings-outline"
          title="Camera access is turned off"
          body="Scanning stays unavailable until camera access is enabled for Vajra in your device settings. Pasting a link always works."
          actionLabel="Open Settings"
          onAction={() => Linking.openSettings()}
          secondaryLabel="Paste a link instead"
          onSecondary={onClose}
          testID="scanner-permission-blocked"
        />
      );
    }
    return (
      <View style={styles.fill}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={handleScan}
        />
        {/* framing overlay */}
        <View style={styles.overlay} pointerEvents="none">
          <View style={styles.frame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
          </View>
        </View>
        <View
          style={[styles.caption, { bottom: insets.bottom + S.xxl }]}
          accessibilityLiveRegion="polite"
        >
          {scanError ? (
            <Text style={styles.captionError} testID="scanner-error">
              {scanError}
            </Text>
          ) : (
            <Text style={styles.captionText}>
              Point at a Vajra QR. Verification starts before any payment.
            </Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root} testID="qr-scanner-modal">
        <View style={[styles.header, { paddingTop: insets.top + S.sm }]}>
          <Text style={styles.headerTitle}>Scan to pay</Text>
          <PressableScale
            testID="scanner-close-button"
            accessibilityLabel="Close scanner"
            onPress={onClose}
            style={styles.closeBtn}
            haptic={null}
          >
            <Ionicons name="close" size={22} color={C.onInverse} />
          </PressableScale>
        </View>
        {renderBody()}
      </View>
    </Modal>
  );
}

type WebBarcode = { rawValue: string };
type BarcodeDetectorInstance = {
  detect: (source: HTMLVideoElement) => Promise<WebBarcode[]>;
};
type BarcodeDetectorCtor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

type WebCamState = "starting" | "active" | "fallback";

/**
 * Web scanner body: tries getUserMedia + BarcodeDetector first, and falls back
 * to a paste action (real validation through onCode) when the camera or the
 * detector is unavailable in this browser.
 */
function WebScannerBody({ onCode }: { onCode: (code: string) => boolean }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [camState, setCamState] = useState<WebCamState>("starting");
  const [scanError, setScanError] = useState<string | null>(null);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [pasting, setPasting] = useState(false);
  const lastScan = useRef(0);
  const errTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDetected = useCallback(
    (raw: string) => {
      const now = Date.now();
      if (now - lastScan.current < 1500) return;
      lastScan.current = now;
      const code = extractCode(raw);
      if (!code) {
        setScanError("This is not a Vajra request QR. Keep the code inside the frame.");
      } else if (!onCode(code)) {
        setScanError("No request found for this code. Ask the sender to check it.");
      } else {
        triggerHaptic("success");
        return;
      }
      triggerHaptic("error");
      if (errTimer.current) clearTimeout(errTimer.current);
      errTimer.current = setTimeout(() => setScanError(null), 2400);
    },
    [onCode],
  );

  useEffect(() => {
    let stream: MediaStream | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const start = async () => {
      const Detector = (
        window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }
      ).BarcodeDetector;
      if (!Detector || !navigator.mediaDevices?.getUserMedia) {
        setCamState("fallback");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
      } catch {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch {
          if (!cancelled) setCamState("fallback");
          return;
        }
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        setCamState("fallback");
        return;
      }
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        // Autoplay can be rejected until first frames arrive; detection still works.
      }
      let detector: BarcodeDetectorInstance;
      try {
        detector = new Detector({ formats: ["qr_code"] });
      } catch {
        try {
          detector = new Detector();
        } catch {
          stream.getTracks().forEach((t) => t.stop());
          if (!cancelled) setCamState("fallback");
          return;
        }
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      setCamState("active");
      interval = setInterval(() => {
        if (!video || video.readyState < 2) return;
        detector
          .detect(video)
          .then((codes) => {
            const raw = codes && codes.length > 0 ? codes[0].rawValue : null;
            if (raw) handleDetected(raw);
          })
          .catch(() => {});
      }, 500);
    };

    start().catch(() => {
      if (!cancelled) setCamState("fallback");
    });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (errTimer.current) clearTimeout(errTimer.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [handleDetected]);

  const pasteLink = async () => {
    setPasting(true);
    setPasteError(null);
    try {
      const text = (await Clipboard.getStringAsync()).trim();
      if (!text) {
        setPasteError("Clipboard is empty. Copy the Vajra link first, then paste it here.");
        return;
      }
      // Pass the pasted text through onCode so open-link validates it for real.
      onCode(text);
    } catch {
      setPasteError(
        "This browser blocked clipboard access. Close this and paste the link into the input instead.",
      );
    } finally {
      setPasting(false);
    }
  };

  if (camState === "starting") {
    return (
      <InfoPanel
        icon="camera-outline"
        title="Checking camera access"
        body="One moment."
        testID="scanner-web-loading"
      />
    );
  }

  if (camState === "fallback") {
    return (
      <InfoPanel
        icon="camera-outline"
        title="No camera here"
        body="Scanning needs a camera this browser can't reach. Paste the link instead — requests verify the same way."
        actionLabel="Paste link"
        onAction={pasteLink}
        actionLoading={pasting}
        actionLoadingLabel="Reading clipboard"
        error={pasteError}
        testID="scanner-web-fallback"
      />
    );
  }

  return (
    <View style={styles.fill}>
      {React.createElement("video", {
        ref: videoRef,
        playsInline: true,
        muted: true,
        autoPlay: true,
        style: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        } as React.CSSProperties,
      })}
      {/* framing overlay */}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame}>
          <View style={[styles.corner, styles.tl]} />
          <View style={[styles.corner, styles.tr]} />
          <View style={[styles.corner, styles.bl]} />
          <View style={[styles.corner, styles.br]} />
        </View>
      </View>
      <View style={styles.caption} accessibilityLiveRegion="polite">
        {scanError ? (
          <Text style={styles.captionError} testID="scanner-web-error">
            {scanError}
          </Text>
        ) : (
          <Text style={styles.captionText}>
            Point at a Vajra QR. Verification starts before any payment.
          </Text>
        )}
      </View>
    </View>
  );
}

function InfoPanel({
  icon,
  title,
  body,
  actionLabel,
  onAction,
  actionLoading,
  actionLoadingLabel,
  secondaryLabel,
  onSecondary,
  error,
  testID,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
  actionLoading?: boolean;
  actionLoadingLabel?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
  error?: string | null;
  testID?: string;
}) {
  return (
    <View style={styles.info} testID={testID}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={26} color={C.lavender} />
      </View>
      <Text style={styles.infoTitle}>{title}</Text>
      <Text style={styles.infoBody}>{body}</Text>
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          loading={actionLoading}
          loadingLabel={actionLoadingLabel ?? "Requesting"}
          style={styles.infoAction}
          testID={testID ? `${testID}-action` : undefined}
        />
      ) : null}
      {secondaryLabel && onSecondary ? (
        <PressableScale
          testID={testID ? `${testID}-secondary` : undefined}
          accessibilityLabel={secondaryLabel}
          onPress={onSecondary}
          style={styles.infoSecondary}
          haptic={null}
        >
          <Text style={styles.infoSecondaryText}>{secondaryLabel}</Text>
        </PressableScale>
      ) : null}
      {error ? (
        <Text
          style={styles.infoError}
          testID={testID ? `${testID}-error` : undefined}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const FRAME = 250;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.inverse },
  fill: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: S.lg,
    paddingBottom: S.md,
    zIndex: 5,
    backgroundColor: C.inverse,
  },
  headerTitle: {
    fontFamily: F.display,
    fontSize: 18,
    letterSpacing: 0.4,
    color: C.onInverse,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: R.pill,
    backgroundColor: "rgba(252,251,255,0.12)",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  frame: { width: FRAME, height: FRAME },
  corner: {
    position: "absolute",
    width: 34,
    height: 34,
    borderColor: C.onInverse,
  },
  tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 },
  tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 },
  br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 },
  caption: {
    position: "absolute",
    left: S.xl,
    right: S.xl,
    alignItems: "center",
  },
  captionText: {
    fontFamily: F.semi,
    fontSize: 13.5,
    lineHeight: 19,
    color: C.onInverse,
    textAlign: "center",
    backgroundColor: "rgba(14,9,28,0.65)",
    borderRadius: R.md,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    overflow: "hidden",
  },
  captionError: {
    fontFamily: F.semi,
    fontSize: 13.5,
    lineHeight: 19,
    color: C.onInverse,
    textAlign: "center",
    backgroundColor: C.error,
    borderRadius: R.md,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    overflow: "hidden",
  },
  info: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: S.xl,
  },
  infoIcon: {
    width: 64,
    height: 64,
    borderRadius: R.lg,
    backgroundColor: "rgba(252,251,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: S.lg,
  },
  infoTitle: {
    fontFamily: F.display,
    fontSize: 21,
    color: C.onInverse,
    textAlign: "center",
  },
  infoBody: {
    fontFamily: F.med,
    fontSize: 13.5,
    lineHeight: 20,
    color: "#B9B3CE",
    textAlign: "center",
    marginTop: S.sm,
    maxWidth: 320,
  },
  infoAction: { alignSelf: "stretch", marginTop: S.xl },
  infoSecondary: { padding: S.md, marginTop: S.xs },
  infoSecondaryText: { fontFamily: F.semi, fontSize: 13.5, color: C.lavender },
  infoError: {
    fontFamily: F.semi,
    fontSize: 13,
    lineHeight: 18,
    color: C.onInverse,
    textAlign: "center",
    backgroundColor: C.error,
    borderRadius: R.md,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    overflow: "hidden",
    marginTop: S.lg,
    maxWidth: 320,
  },
});
