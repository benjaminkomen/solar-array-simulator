import { Platform, Pressable, StyleSheet, Text, type ImageSourcePropType } from "react-native";
import { Stack } from "expo-router";
import type { SFSymbol } from "sf-symbols-typescript";
import Add from "@expo/material-symbols/add.xml";
import Delete from "@expo/material-symbols/delete.xml";
import LinkIcon from "@expo/material-symbols/link.xml";
import MyLocation from "@expo/material-symbols/my_location.xml";
import Navigation from "@expo/material-symbols/navigation.xml";
import RotateRight from "@expo/material-symbols/rotate_right.xml";
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

export function CustomHeaderToolbar({
  unlinkedCount,
  onCompassToggle,
  onSnapToOrigin,
}: CustomHeaderToolbarProps) {
  return (
    <Stack.Toolbar placement="right">
      <Stack.Toolbar.Button
        icon={CUSTOM_TOOLBAR_ICONS.compass}
        onPress={onCompassToggle}
        accessibilityLabel="Toggle compass"
      />
      <Stack.Toolbar.Button
        icon={CUSTOM_TOOLBAR_ICONS.link}
        onPress={ignoreHeaderLinkPress}
        accessibilityLabel={CUSTOM_HEADER_LINK_A11Y}
      >
        {unlinkedCount > 0 && (
          <Stack.Toolbar.Badge>{String(unlinkedCount)}</Stack.Toolbar.Badge>
        )}
      </Stack.Toolbar.Button>
      <Stack.Toolbar.Button
        icon={CUSTOM_TOOLBAR_ICONS.snap}
        onPress={onSnapToOrigin}
        accessibilityLabel="Snap to origin"
      />
    </Stack.Toolbar>
  );
}

function WizardFinishButton({ onFinish }: { onFinish: () => void }) {
  const colors = useColors();

  if (Platform.OS === "android") {
    return (
      <Stack.Toolbar.View>
        <Pressable style={styles.toolbarTextButton} onPress={onFinish}>
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
  return (
    <Stack.Toolbar placement="bottom">
      <Stack.Toolbar.Button
        icon={CUSTOM_TOOLBAR_ICONS.add}
        onPress={onAddPanel}
        accessibilityLabel={CUSTOM_ADD_PANEL_A11Y}
      />
      {selectedId && (
        <>
          <Stack.Toolbar.Button
            icon={CUSTOM_TOOLBAR_ICONS.link}
            onPress={onLinkInverter}
            accessibilityLabel="Link inverter"
          />
          <Stack.Toolbar.Button
            icon={CUSTOM_TOOLBAR_ICONS.rotate}
            onPress={onRotatePanel}
            accessibilityLabel="Rotate panel"
          />
          <Stack.Toolbar.Button
            icon={CUSTOM_TOOLBAR_ICONS.delete}
            onPress={onDeletePanel}
            accessibilityLabel="Delete panel"
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
