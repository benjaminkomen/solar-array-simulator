import { useCallback, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import {
  Canvas,
  Group,
  Line,
  Path,
  Text as SkiaText,
  matchFont,
  Skia,
} from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import {
  useSharedValue,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import * as Haptics from "expo-haptics";
import { useColors } from "@/utils/theme";

// Larger size to fit labels
const COMPASS_SIZE = 80;
const CENTER = COMPASS_SIZE / 2;
const RING_RADIUS = 24;

// Arrow dimensions
// Outer triangle (pointing up)
const OUTER_TOP = -16;       // Top point (apex) relative to center
const OUTER_BASE = 12;       // Base Y relative to center
const BOTTOM_NOTCH = 6;     // Indent for bottom point of arrow to create notch
const OUTER_HALF_WIDTH = 12;  // Half of base width

// 8 dash segments (2 between each cardinal direction)
const DASH_COUNT = 8;
const DASH_ANGLE = (2 * Math.PI) / DASH_COUNT;
const DASH_LENGTH = 0.5; // Portion of each segment that is filled

interface CompassProps {
  direction: number;
  onDirectionChange?: (degrees: number) => void;
  onTap?: () => void;
  readOnly?: boolean;
}

// Snap to nearest 45 degree increment
function snapToDirection(degrees: number): number {
  "worklet";
  return Math.round(degrees / 45) * 45 % 360;
}

export function Compass({
  direction,
  onDirectionChange,
  onTap,
  readOnly = false,
}: CompassProps) {
  const colors = useColors();
  const angle = useSharedValue(direction);

  // Sync with external direction prop
  useEffect(() => {
    angle.value = direction;
  }, [direction, angle]);

  const font = matchFont({
    fontFamily: "System",
    fontSize: 11,
    fontWeight: "600",
  });

  // Create arrow path: outer triangle with inner diamond cutout (even-odd fill)
  const arrowPath = useDerivedValue(() => {
    const path = Skia.Path.Make();

    // Outer triangle (arrow shape)
    path.moveTo(CENTER, CENTER + OUTER_TOP);                     // Top point of arrow
    path.lineTo(CENTER - OUTER_HALF_WIDTH, CENTER + OUTER_BASE); // Bottom left of arrow
    path.lineTo(CENTER, CENTER + OUTER_BASE - BOTTOM_NOTCH);     // Bottom center of arrow notch
    path.lineTo(CENTER + OUTER_HALF_WIDTH, CENTER + OUTER_BASE); // Bottom right of arrow
    path.close();

    // Inner cutout triangle
    path.moveTo(CENTER, CENTER - 9);                            // Top point of triangle
    path.lineTo(CENTER - 6, CENTER + 6);                        // Bottom left of triangle
    path.lineTo(CENTER, CENTER + 3);                             // Bottom right of triangle
    path.close();

    // Even-odd fill rule makes the inner region transparent
    path.setFillType(1); // 1 = EvenOdd in Skia
    return path;
  });

  // Transform for rotating the arrow
  const arrowTransform = useDerivedValue(() => [
    { translateX: CENTER },
    { translateY: CENTER },
    { rotate: (angle.value * Math.PI) / 180 },
    { translateX: -CENTER },
    { translateY: -CENTER },
  ]);

  const triggerHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleDirectionChange = useCallback(
    (degrees: number) => {
      onDirectionChange?.(degrees);
    },
    [onDirectionChange]
  );

  const handleTap = useCallback(() => {
    onTap?.();
  }, [onTap]);

  // Pan gesture for rotation
  const panGesture = Gesture.Pan()
    .enabled(!readOnly)
    .onUpdate((e) => {
      // Calculate angle from center to touch point
      const dx = e.x - CENTER;
      const dy = e.y - CENTER;
      const rawAngle = Math.atan2(dx, -dy); // -dy because y increases downward, we want 0° at top
      const degrees = ((rawAngle * 180) / Math.PI + 360) % 360;
      angle.value = degrees;
    })
    .onEnd(() => {
      // Snap to nearest 45 degrees
      const snapped = snapToDirection(angle.value);
      angle.value = withTiming(snapped, { duration: 150 });
      scheduleOnRN(triggerHaptic);
      scheduleOnRN(handleDirectionChange, snapped);
    });

  // Tap gesture for opening help sheet
  const tapGesture = Gesture.Tap().onEnd(() => {
    scheduleOnRN(triggerHaptic);
    scheduleOnRN(handleTap);
  });

  const composedGesture = Gesture.Exclusive(panGesture, tapGesture);

  // Generate 8 dash segments for the ring (offset to be between cardinal directions)
  const dashSegments = [];
  for (let i = 0; i < DASH_COUNT; i++) {
    // Offset by half a segment so dashes are between letters
    const startAngle = i * DASH_ANGLE - Math.PI / 2 + DASH_ANGLE / 2;
    const endAngle = startAngle + DASH_ANGLE * DASH_LENGTH;
    const x1 = CENTER + RING_RADIUS * Math.cos(startAngle);
    const y1 = CENTER + RING_RADIUS * Math.sin(startAngle);
    const x2 = CENTER + RING_RADIUS * Math.cos(endAngle);
    const y2 = CENTER + RING_RADIUS * Math.sin(endAngle);
    dashSegments.push({ x1, y1, x2, y2, key: i });
  }

  // Cardinal label positions (outside ring)
  const labelRadius = RING_RADIUS + 10;
  const labels = [
    { text: "N", angle: -Math.PI / 2 },
    { text: "E", angle: 0 },
    { text: "S", angle: Math.PI / 2 },
    { text: "W", angle: Math.PI },
  ];

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={styles.container}>
        <Canvas style={styles.canvas}>
          {/* Dashed ring */}
          {dashSegments.map((seg) => (
            <Line
              key={seg.key}
              p1={{ x: seg.x1, y: seg.y1 }}
              p2={{ x: seg.x2, y: seg.y2 }}
              color={colors.border.medium}
              strokeWidth={2}
              style="stroke"
              strokeCap="round"
            />
          ))}

          {/* Cardinal labels */}
          {font &&
            labels.map((label) => {
              const x = CENTER + labelRadius * Math.cos(label.angle);
              const y = CENTER + labelRadius * Math.sin(label.angle);
              const textWidth = font.measureText(label.text).width;
              return (
                <SkiaText
                  key={label.text}
                  x={x - textWidth / 2}
                  y={y + 4} // Adjust for baseline
                  text={label.text}
                  font={font}
                  color={label.text === "N" ? colors.text.primary : colors.text.secondary}
                />
              );
            })}

          {/* Rotating arrow - filled triangle */}
          <Group transform={arrowTransform}>
            <Path
              path={arrowPath}
              color={colors.text.primary}
              style="fill"
            />
          </Group>
        </Canvas>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
  },
  canvas: {
    flex: 1,
  },
});
