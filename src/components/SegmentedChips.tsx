import SegmentedControl from "@expo/ui/community/segmented-control";
import type { StyleProp, ViewStyle } from "react-native";

export type SegmentedChipOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedChipsProps<T extends string> = {
  options: readonly SegmentedChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Shared chips over `@expo/ui/community/segmented-control`.
 * That export maps to SwiftUI `pickerStyle('segmented')` and Material
 * `SingleChoiceSegmentedButtonRow` — not universal `Picker` menu/wheel.
 */
export function SegmentedChips<T extends string>({
  options,
  value,
  onChange,
  testID,
  style,
}: SegmentedChipsProps<T>) {
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  return (
    <SegmentedControl
      values={options.map((option) => option.label)}
      selectedIndex={selectedIndex}
      onChange={(event) => {
        const next = options[event.nativeEvent.selectedSegmentIndex];
        if (next) onChange(next.value);
      }}
      testID={testID}
      style={style}
    />
  );
}
