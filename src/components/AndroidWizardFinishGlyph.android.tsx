import { Platform, StyleSheet, View } from "react-native";
import { Canvas, Text as SkiaText, matchFont } from "@shopify/react-native-skia";

const GLYPH_WIDTH = 96;
const GLYPH_HEIGHT = 24;
const FONT_SIZE = 14;

/**
 * Paint Finish / Tapped without an RN TextView.
 * Maestro `tapOn: Finish` matches uiautomator text, so a Text child
 * (`accessible={false}` included) is a second Finish node that steals the tap.
 * Skia is not a text node in the dump.
 */
export function AndroidWizardFinishGlyph({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  const font = matchFont({
    fontFamily: Platform.select({ ios: "System", default: "sans-serif-medium" }),
    fontSize: FONT_SIZE,
    fontWeight: "600",
  });
  const text = label.toUpperCase();
  const textWidth = font ? font.measureText(text).width : 72;
  const x = Math.max(0, (GLYPH_WIDTH - textWidth) / 2);
  const y = 18;

  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      collapsable={false}
      style={styles.glyph}
    >
      <Canvas style={styles.canvas} pointerEvents="none">
        {font ? (
          <SkiaText x={x} y={y} text={text} font={font} color={color} />
        ) : null}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  glyph: {
    width: GLYPH_WIDTH,
    height: GLYPH_HEIGHT,
  },
  canvas: {
    width: GLYPH_WIDTH,
    height: GLYPH_HEIGHT,
  },
});
