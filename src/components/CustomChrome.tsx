import { useState } from "react";
import { Platform, StyleSheet, View, type ImageSourcePropType } from "react-native";
import { Pressable as GesturePressable } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import type { SFSymbol } from "sf-symbols-typescript";
import Add from "@expo/material-symbols/add.xml";
import Delete from "@expo/material-symbols/delete.xml";
import LinkIcon from "@expo/material-symbols/link.xml";
import MyLocation from "@expo/material-symbols/my_location.xml";
import Navigation from "@expo/material-symbols/navigation.xml";
import RotateRight from "@expo/material-symbols/rotate_right.xml";
import { AndroidToolbarIconButton } from "@/components/AndroidToolbarIconButton";
import { AndroidWizardFinishGlyph } from "@/components/AndroidWizardFinishGlyph";
import {
  CUSTOM_ADD_PANEL_A11Y,
  CUSTOM_HEADER_LINK_A11Y,
} from "@/utils/customChrome";
import {
  ANDROID_WIZARD_FINISH_HIT_HEIGHT,
  ANDROID_WIZARD_FINISH_HIT_WIDTH,
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

function ToolbarIconButton({
  name,
  onPress,
  accessibilityLabel,
  tint,
  hidden,
}: ToolbarIconButtonProps) {
  if (Platform.OS === "android") {
    return (
      <AndroidToolbarIconButton
        source={CUSTOM_TOOLBAR_ICONS[name] as ImageSourcePropType}
        tint={tint}
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        hidden={hidden}
      />
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

/**
 * iOS header-right items must be *direct* `Stack.Toolbar.Button` children.
 * `processHeaderItemsForPlatform.ios` keeps only `isChildOfType(StackToolbarButton)`
 * (and Menu / Spacer / View). A wrapper like `ToolbarIconButton` is dropped, so
 * only the inlined Badge link survived and compass/snap vanished. Bottom toolbar
 * still wraps — iOS `placement="bottom"` renders React children, not header items.
 * Android header-right renders children inside a Compose Row, so wrappers stay.
 */
export function CustomHeaderToolbar({
  unlinkedCount,
  onCompassToggle,
  onSnapToOrigin,
}: CustomHeaderToolbarProps) {
  const colors = useColors();
  const headerTint = colors.text.primary as string;

  return (
    <Stack.Toolbar placement="right">
      {Platform.OS === "android" ? (
        <ToolbarIconButton
          name="compass"
          onPress={onCompassToggle}
          accessibilityLabel="Toggle compass"
          tint={headerTint}
        />
      ) : (
        <Stack.Toolbar.Button
          icon={CUSTOM_TOOLBAR_ICONS.compass}
          onPress={onCompassToggle}
          accessibilityLabel="Toggle compass"
        />
      )}
      {Platform.OS === "android" ? (
        <AndroidToolbarIconButton
          source={CUSTOM_TOOLBAR_ICONS.link as ImageSourcePropType}
          tint={headerTint}
          onPress={ignoreHeaderLinkPress}
          badge={unlinkedCount > 0 ? String(unlinkedCount) : undefined}
        />
      ) : (
        <Stack.Toolbar.Button
          icon={CUSTOM_TOOLBAR_ICONS.link}
          onPress={ignoreHeaderLinkPress}
          accessibilityLabel={CUSTOM_HEADER_LINK_A11Y}
        >
          {unlinkedCount > 0 && (
            <Stack.Toolbar.Badge>{String(unlinkedCount)}</Stack.Toolbar.Badge>
          )}
        </Stack.Toolbar.Button>
      )}
      {Platform.OS === "android" ? (
        <ToolbarIconButton
          name="snap"
          onPress={onSnapToOrigin}
          accessibilityLabel="Snap to origin"
          tint={headerTint}
        />
      ) : (
        <Stack.Toolbar.Button
          icon={CUSTOM_TOOLBAR_ICONS.snap}
          onPress={onSnapToOrigin}
          accessibilityLabel="Snap to origin"
        />
      )}
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
 * Android-only Finish. Visual is Skia (no TextView). RNGH Pressable +
 * box-none overlay sit above the full-screen canvas GestureDetector so
 * Maestro's a11y-coordinate tap hits this control, not the Skia tap
 * (which deselects the panel). Hit width/height fill that a11y box (#80).
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
    <View
      pointerEvents="box-none"
      accessible={false}
      importantForAccessibility="no"
      style={styles.androidFinishOverlay}
    >
      <GesturePressable
        onPress={() => {
          pressAndroidWizardFinish(setPressed, onFinish);
        }}
        accessibilityLabel={label}
        accessibilityRole="button"
        accessible
        collapsable={false}
        pointerEvents="box-only"
        testID={pressed ? "android-wizard-finish-tapped" : "android-wizard-finish"}
        style={[
          styles.androidFinishHit,
          {
            bottom: androidWizardFinishBottom(insets.bottom),
            right: androidWizardFinishRight(),
            width: ANDROID_WIZARD_FINISH_HIT_WIDTH,
            height: ANDROID_WIZARD_FINISH_HIT_HEIGHT,
          },
        ]}
      >
        <AndroidWizardFinishGlyph
          label={label}
          color={colors.primary as string}
        />
      </GesturePressable>
    </View>
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
  androidFinishOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 40,
  },
  androidFinishHit: {
    position: "absolute",
    zIndex: 40,
    elevation: 16,
    justifyContent: "center",
    alignItems: "center",
  },
});
