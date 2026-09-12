import { Platform, Pressable, StyleSheet, Text, View, type ImageSourcePropType } from "react-native";
import { Stack } from "expo-router";
import type { SFSymbol } from "sf-symbols-typescript";
import Add from "@expo/material-symbols/add.xml";
import Delete from "@expo/material-symbols/delete.xml";
import LinkIcon from "@expo/material-symbols/link.xml";
import MyLocation from "@expo/material-symbols/my_location.xml";
import Navigation from "@expo/material-symbols/navigation.xml";
import RotateRight from "@expo/material-symbols/rotate_right.xml";
import { CustomToolbarAndroidIcon } from "@/components/CustomToolbarAndroidIcon";
import {
  CUSTOM_ADD_PANEL_A11Y,
  CUSTOM_HEADER_LINK_A11Y,
} from "@/utils/customChrome";
import { shouldShowWizardFinish } from "@/utils/wizardChrome";
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
};

/**
 * Android Stack.Toolbar.Button puts accessibilityLabel on a Compose Icon
 * (android.view.View, clickable=false). Maestro then taps a dead node.
 * Keep the label on a RN Pressable drawn *above* the Compose Host/Icon
 * so Add panel receives the tap (nested Host as a Pressable child swallows it).
 */
function ToolbarIconButton({
  name,
  onPress,
  accessibilityLabel,
  tint,
}: ToolbarIconButtonProps) {
  if (Platform.OS === "android") {
    return (
      <Stack.Toolbar.View>
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
        </View>
      </Stack.Toolbar.View>
    );
  }

  return (
    <Stack.Toolbar.Button
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

function WizardFinishButton({ onFinish }: { onFinish: () => void }) {
  const colors = useColors();

  if (Platform.OS === "android") {
    return (
      <Stack.Toolbar.View>
        <Pressable
          style={styles.toolbarTextButton}
          onPress={onFinish}
          accessibilityRole="button"
          accessibilityLabel="Finish"
          accessible
          collapsable={false}
          cancelable={false}
        >
          <Text style={[styles.toolbarTextButtonLabel, { color: colors.primary as string }]}>
            Finish
          </Text>
        </Pressable>
      </Stack.Toolbar.View>
    );
  }

  return (
    <Stack.Toolbar.Button onPress={onFinish}>
      Finish
    </Stack.Toolbar.Button>
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

  return (
    <Stack.Toolbar placement="bottom">
      <ToolbarIconButton
        name="add"
        onPress={onAddPanel}
        accessibilityLabel={CUSTOM_ADD_PANEL_A11Y}
        tint={actionTint}
      />
      {selectedId && (
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
      )}
      {shouldShowWizardFinish(isWizardMode, panelCount) && (
        <WizardFinishButton onFinish={onFinish} />
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
  toolbarTextButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: "center",
  },
  toolbarTextButtonLabel: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
