/**
 * Android Config keeps `@expo/ui/community/segmented-control` (via SegmentedChips).
 *
 * That drop-in wraps its own Host (`matchContents` vertical) — official usage
 * is an RN-tree child, not a raw Compose child of FieldGroup:
 * https://docs.expo.dev/versions/latest/sdk/ui/drop-in-replacements/segmentedcontrol/
 *
 * FieldGroup is a LazyColumn that needs a finite parent
 * (https://github.com/expo/expo/issues/46203). Nesting the community Host
 * directly in a section collapsed Android width (smashed chips, vertical titles).
 *
 * Official bridge for RN inside `@expo/ui` is RNHostView, which fills the
 * native parent unless `matchContents` is set:
 * https://docs.expo.dev/versions/latest/sdk/ui/universal/rnhostview/
 */
import { View } from "react-native";
import { Column, RNHostView, Text } from "@expo/ui";
import { SegmentedChips } from "@/components/SegmentedChips";
import { ROOF_TYPES } from "@/hooks/useConfigForm";
import type { RoofTypePickerProps } from "./types";

const CHIP_HEIGHT = 48;

export function RoofTypePicker({ roofType, onChange }: RoofTypePickerProps) {
  return (
    <Column spacing={8} style={{ width: "100%" }}>
      <Text>Roof Type</Text>
      <RNHostView style={{ width: "100%", height: CHIP_HEIGHT }}>
        <View style={{ flex: 1, height: CHIP_HEIGHT }} collapsable={false}>
          <SegmentedChips
            options={ROOF_TYPES}
            value={roofType}
            onChange={onChange}
            style={{ width: "100%", height: CHIP_HEIGHT }}
          />
        </View>
      </RNHostView>
    </Column>
  );
}
