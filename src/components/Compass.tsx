import {useCallback, useEffect} from "react";
import {StyleSheet, View} from "react-native";
import {Canvas, Group, matchFont, Path, Skia, Text as SkiaText,} from "@shopify/react-native-skia";
import {Gesture, GestureDetector} from "react-native-gesture-handler";
import {useDerivedValue, useSharedValue, withTiming,} from "react-native-reanimated";
import {scheduleOnRN} from "react-native-worklets";
import * as Haptics from "expo-haptics";
import {useColors} from "@/utils/theme";

// Larger size to fit labels
const COMPASS_SIZE = 80;
const CENTER = COMPASS_SIZE / 2;
const RING_RADIUS = 24;

// 4 curved arc segments at diagonal positions (NE, SE, SW, NW)
// Letters N, E, S, W are positioned between the arcs on the ring
const ARC_SWEEP = 40; // Arc span in degrees (leaves wider gaps for letters)

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
    fontSize: 12,
    fontWeight: "800",
  });

  // Create arrow path: outer triangle with bottom notch and with inner triangle cutout (even-odd fill)
  const arrowPath = useDerivedValue(() => {
    const path = Skia.Path.Make();

    // Outer triangle (arrow shape)
    path.moveTo(CENTER, CENTER + -16);                           // Top point of arrow
    path.lineTo(CENTER - 12, CENTER + 12); // Bottom left of arrow
    path.lineTo(CENTER, CENTER + 12 - 6);                // Bottom center of arrow notch
    path.lineTo(CENTER + 12, CENTER + 12); // Bottom right of arrow
    path.close();

    // Inner cutout triangle
    path.moveTo(CENTER, CENTER - 9);                            // Top point of triangle
    path.lineTo(CENTER - 6, CENTER + 6);                        // Bottom left of triangle
    path.lineTo(CENTER, CENTER + 3);                            // Bottom right of triangle
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

  // Generate 4 curved arc segments at diagonal positions (NE, SE, SW, NW)
  // Skia angles: 0° = right (East), 90° = down (South), 180° = left (West), 270° = up (North)
  const oval = Skia.XYWHRect(
    CENTER - RING_RADIUS,
    CENTER - RING_RADIUS,
    RING_RADIUS * 2,
    RING_RADIUS * 2
  );

  // Arcs centered at diagonals: -45° (NE), 45° (SE), 135° (SW), 225° (NW)
  const arcStartAngles = [-45, 45, 135, 225].map(a => a - ARC_SWEEP / 2);
  const arcPaths = arcStartAngles.map((startAngle, i) => ({
    path: Skia.Path.Make().addArc(oval, startAngle, ARC_SWEEP),
    key: i,
  }));

  // Cardinal labels positioned ON the ring (between arcs)
  const labelRadius = RING_RADIUS;
  const labels = [
    { text: "N", angle: -Math.PI / 2 },  // Top
    { text: "E", angle: 0 },              // Right
    { text: "S", angle: Math.PI / 2 },    // Bottom
    { text: "W", angle: Math.PI },        // Left
  ];

  return (
    <GestureDetector gesture={composedGesture}>
      <View style={styles.container}>
        <Canvas style={styles.canvas}>
          {/* Curved dashed ring */}
          {arcPaths.map((arc) => (
            <Path
              key={arc.key}
              path={arc.path}
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
