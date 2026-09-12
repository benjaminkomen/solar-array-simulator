import { useState } from "react";
import { Platform, Pressable, StyleSheet, View, type ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import type { SFSymbol } from "sf-symbols-typescript";
import Add from "@expo/material-symbols/add.xml";
import Delete from "@expo/material-symbols/delete.xml";
import LinkIcon from "@expo/material-symbols/link.xml";
import MyLocation from "@expo/material-symbols/my_location.xml";
import Navigation from "@expo/material-symbols/navigation.xml";
import RotateRight from "@expo/material-symbols/rotate_right.xml";
import { AndroidWizardFinishGlyph } from "@/components/AndroidWizardFinishGlyph";
import { CustomToolbarAndroidIcon } from "@/components/CustomToolbarAndroidIcon";
import {
  CUSTOM_ADD_PANEL_A11Y,
  CUSTOM_HEADER_LINK_A11Y,
} from "@/utils/customChrome";
import {
  androidWizardFinishBottom,
  androidWizardFinishPressProofLabel,
  androidWizardFinishRight,
  shouldShowWizardFinish,
} from "@/utils/wizardChrome";
import { useColors } from "@/utils/theme";

type ToolbarIcon = SFSymbol | ImageSourcePropType;
type ToolbarIconName = "compass" | "snap" | "add" | "link" | "rotate" | "delete";

const CUSTOM_TOOLBAR_ICONS: Record<ToolbarIconName, ToolbarIcon> = Platform.OS === "ios"
  ? {
      compass: "location.north.circle",
      snap: "scope",
      add: "plus",
      link: "link",
      rotate: "rotate.right",
      delete: "trash",
    }
  : {
      compass: Navigation,
      snap: MyLocation,
      add: Add,
      link: LinkIcon,
      rotate: RotateRight,
      delete: Delete,
    };

/** Header-right link is a count indicator; linking lives on the bottom toolbar. */
function ignoreHeaderLinkPress() {}

export type CustomHeaderToolbarProps = {
  unlinkedCount: number;
  onCompassToggle: () => void;
  onSnapToOrigin: () => void;
};

export type CustomBottomToolbarProps = {
  selectedId: string | null;
  isWizardMode: boolean;
  panelCount: number;
  onAddPanel: () => void;
  onLinkInverter: () => void;
  onRotatePanel: () => void;
  onDeletePanel: () => void;
  onFinish: () => void;
};

type ToolbarIconButtonProps = {
  name: ToolbarIconName;
  onPress: () => void;
  accessibilityLabel: string;
  tint: string;
  hidden?: boolean;
};

/**
 * Android Stack.Toolbar.Button puts accessibilityLabel on a Compose Icon
 * (android.view.View, clickable=false). Maestro then taps a dead node.
 * Keep the label on a RN Pressable drawn *above* the Compose Host/Icon
 * so Add panel receives the tap (nested Host as a Pressable child swallows it).
 */
function AndroidToolbarHitOverlay({
  onPress,
  accessibilityLabel,
}: {
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessible
      collapsable={false}
      cancelable={false}
      style={styles.toolbarIconHit}
    >
      <View style={styles.toolbarIconHit} collapsable={false} />
    </Pressable>
  );
}

function ToolbarIconButton({
  name,
  onPress,
  accessibilityLabel,
  tint,
  hidden,
}: ToolbarIconButtonProps) {
  if (Platform.OS === "android") {
    return (
      <Stack.Toolbar.View hidden={hidden}>
        <View style={styles.toolbarIconButton} collapsable={false}>
          <View
            pointerEvents="none"
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={styles.toolbarIconGlyph}
          >
            <CustomToolbarAndroidIcon
              source={CUSTOM_TOOLBAR_ICONS[name] as ImageSourcePropType}
              tint={tint}
            />
          </View>
          <AndroidToolbarHitOverlay
            onPress={onPress}
            accessibilityLabel={accessibilityLabel}
          />
        </View>
      </Stack.Toolbar.View>
    );
  }

  return (
    <Stack.Toolbar.Button
      hidden={hidden}
      icon={CUSTOM_TOOLBAR_ICONS[name]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

export function CustomHeaderToolbar({
  unlinkedCount,
  onCompassToggle,
  onSnapToOrigin,
}: CustomHeaderToolbarProps) {
  const colors = useColors();
  const headerTint = colors.text.primary as string;

  return (
    <Stack.Toolbar placement="right">
      <ToolbarIconButton
        name="compass"
        onPress={onCompassToggle}
        accessibilityLabel="Toggle compass"
        tint={headerTint}
      />
      <Stack.Toolbar.Button
        icon={CUSTOM_TOOLBAR_ICONS.link}
        onPress={ignoreHeaderLinkPress}
        accessibilityLabel={Platform.OS === "ios" ? CUSTOM_HEADER_LINK_A11Y : undefined}
      >
        {unlinkedCount > 0 && (
          <Stack.Toolbar.Badge>{String(unlinkedCount)}</Stack.Toolbar.Badge>
        )}
      </Stack.Toolbar.Button>
      <ToolbarIconButton
        name="snap"
        onPress={onSnapToOrigin}
        accessibilityLabel="Snap to origin"
        tint={headerTint}
      />
    </Stack.Toolbar>
  );
}

/**
 * iOS Finish stays a Toolbar.Button (official happy path already lands
 * Production). Android must not mount this child at all — a `null`
 * toolbar slot can still leave a leftover FINISH a11y node that Maestro
 * hits instead of `AndroidWizardFinishButton` (#80).
 */
function WizardFinishButton({
  onFinish,
  visible,
}: {
  onFinish: () => void;
  visible: boolean;
}) {
  if (Platform.OS === "android" || !visible) {
    return null;
  }

  return (
    <Stack.Toolbar.Button onPress={onFinish}>
      Finish
    </Stack.Toolbar.Button>
  );
}

function pressAndroidWizardFinish(
  setPressed: (pressed: boolean) => void,
  onFinish: () => void,
): void {
  setPressed(true);
  onFinish();
}

/**
 * Android-only Finish. Position is locked. Visual is Skia, not RN Text —
 * a TextView "FINISH" is a second uiautomator node that Maestro taps
 * instead of this Pressable (#80). onPress flips the same control to
 * `Tapped`, then records `/production`.
 */
export function AndroidWizardFinishButton({
  visible,
  onFinish,
}: {
  visible: boolean;
  onFinish: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [pressed, setPressed] = useState(false);
  const label = androidWizardFinishPressProofLabel(pressed);

  if (!visible) {
    return null;
  }

  return (
    <Pressable
      onPress={() => {
        pressAndroidWizardFinish(setPressed, onFinish);
      }}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessible
      collapsable={false}
      cancelable={false}
      testID={pressed ? "android-wizard-finish-tapped" : "android-wizard-finish"}
      style={[
        styles.androidFinishHit,
        {
          bottom: androidWizardFinishBottom(insets.bottom),
          right: androidWizardFinishRight(),
        },
      ]}
    >
      <AndroidWizardFinishGlyph
        label={label}
        color={colors.primary as string}
      />
    </Pressable>
  );
}

export function CustomBottomToolbar({
  selectedId,
  isWizardMode,
  panelCount,
  onAddPanel,
  onLinkInverter,
  onRotatePanel,
  onDeletePanel,
  onFinish,
}: CustomBottomToolbarProps) {
  const colors = useColors();
  const actionTint = colors.primary as string;
  const showFinish = shouldShowWizardFinish(isWizardMode, panelCount);

  return (
    <Stack.Toolbar placement="bottom">
      <ToolbarIconButton
        name="add"
        onPress={onAddPanel}
        accessibilityLabel={CUSTOM_ADD_PANEL_A11Y}
        tint={actionTint}
      />
      {Platform.OS === "android" ? (
        <>
          <ToolbarIconButton
            name="link"
            hidden={!selectedId}
            onPress={onLinkInverter}
            accessibilityLabel="Link inverter"
            tint={actionTint}
          />
          <ToolbarIconButton
            name="rotate"
            hidden={!selectedId}
            onPress={onRotatePanel}
            accessibilityLabel="Rotate panel"
            tint={actionTint}
          />
          <ToolbarIconButton
            name="delete"
            hidden={!selectedId}
            onPress={onDeletePanel}
            accessibilityLabel="Delete panel"
            tint={actionTint}
          />
        </>
      ) : (
        selectedId && (
          <>
            <ToolbarIconButton
              name="link"
              onPress={onLinkInverter}
              accessibilityLabel="Link inverter"
              tint={actionTint}
            />
            <ToolbarIconButton
              name="rotate"
              onPress={onRotatePanel}
              accessibilityLabel="Rotate panel"
              tint={actionTint}
            />
            <ToolbarIconButton
              name="delete"
              onPress={onDeletePanel}
              accessibilityLabel="Delete panel"
              tint={actionTint}
            />
          </>
        )
      )}
      {Platform.OS !== "android" && (
        <WizardFinishButton onFinish={onFinish} visible={showFinish} />
      )}
    </Stack.Toolbar>
  );
}

const styles = StyleSheet.create({
  toolbarIconButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  toolbarIconGlyph: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },
  toolbarIconHit: {
    ...StyleSheet.absoluteFill,
  },
  androidFinishHit: {
    position: "absolute",
    zIndex: 30,
    elevation: 8,
    minWidth: 48,
    minHeight: 48,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
