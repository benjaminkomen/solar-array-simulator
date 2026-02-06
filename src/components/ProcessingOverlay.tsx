import { useEffect, useMemo } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import {
  Blur,
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Mask,
  matchFont,
  Rect,
  Shader,
  Skia,
  Text,
  vec,
} from "@shopify/react-native-skia";
import Animated, {
  Easing,
  FadeIn,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

// Fibonacci shader constants (no user controls)
const CIRCLE_COUNT = 90;
const MAGICAL_MUL = 2.4;

// Shimmer text constants
const SHIMMER_TEXT = "Analyzing solar array...";
const SHIMMER_TEXT_SIZE = 20;
const SHIMMER_WIDTH = 80;

const fontFamily = process.env.EXPO_OS === "ios" ? "Helvetica" : "sans-serif";
const fontStyle = {
  fontFamily,
  fontSize: SHIMMER_TEXT_SIZE,
  fontWeight: "500" as const,
};

interface ProcessingOverlayProps {
  imageUri: string;
}

export function ProcessingOverlay({ imageUri }: ProcessingOverlayProps) {
  const { width: screenWidth } = useWindowDimensions();
  const canvasSize = screenWidth;

  const iTime = useSharedValue(0);
  const shimmerX = useSharedValue(-SHIMMER_WIDTH);
  const font = matchFont(fontStyle);

  const textWidth = useMemo(
    () => (font ? font.measureText(SHIMMER_TEXT).width : 250),
    [font],
  );
  const textX = (screenWidth - textWidth) / 2;

  const dynamicSource = useDerivedValue(() => {
    return Skia.RuntimeEffect.Make(`
      const vec2 iResolution = vec2(${canvasSize}, ${canvasSize});
      const float iTime = ${iTime.value};
      const float N = ${CIRCLE_COUNT}.0;

      vec4 main(vec2 FC) {
        vec4 o = vec4(0, 0, 0, 1);
        vec2 p = vec2(0);
        vec2 c = p;
        vec2 u = FC.xy * 2.0 - iResolution.xy;
        float a;

        for (float i = 0.0; i < N; i++) {
          a = i / (N * 0.5) - 1.0;
          p = cos(i * ${MAGICAL_MUL} + iTime + vec2(0, 11)) * sqrt(1.0 - a * a);
          c = u / iResolution.y + vec2(p.x, a) / (p.y + 2.0);
          o += (cos(i + vec4(0, 2, 4, 0)) + 1.0) / dot(c, c) * (1.0 - p.y) / (N * 75.0);
        }
        return o;
      }`)!;
  }, []);

  const shimmerStart = useDerivedValue(() => vec(shimmerX.value, 0));
  const shimmerEnd = useDerivedValue(() => vec(shimmerX.value + SHIMMER_WIDTH, 0));

  // Start animations on mount. This component is only rendered when processing,
  // so no `visible` guard needed — Reanimated animations are imperative
  // side-effects that legitimately belong in an effect.
  useEffect(() => {
    iTime.value = withRepeat(
      withTiming(15, { duration: 20000, easing: Easing.linear }),
      -1,
      true,
    );

    shimmerX.value = withRepeat(
      withTiming(textWidth + SHIMMER_WIDTH, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [textWidth]);

  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.container}>
      {/* Background image */}
      <Image
        source={{ uri: imageUri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      {/* Dark overlay */}
      <View style={[StyleSheet.absoluteFill, styles.darkOverlay]} />

      {/* Fibonacci shader animation */}
      <View style={styles.shaderContainer}>
        <Canvas style={{ width: canvasSize, height: canvasSize }}>
          <Mask
            mode="luminance"
            mask={
              <Circle
                cx={canvasSize / 2}
                cy={canvasSize / 2}
                r={canvasSize / 2}
                color="#FFF"
              >
                <Blur blur={10} />
              </Circle>
            }
          >
            <Group opacity={0.7}>
              <Rect x={0} y={0} width={canvasSize} height={canvasSize}>
                <Shader source={dynamicSource} />
              </Rect>
            </Group>
          </Mask>
        </Canvas>
      </View>

      {/* Shimmer text */}
      <View style={styles.textContainer}>
        <Canvas style={{ width: screenWidth, height: 40 }}>
          <Text
            x={textX}
            y={SHIMMER_TEXT_SIZE + 6}
            text={SHIMMER_TEXT}
            font={font}
          >
            <LinearGradient
              start={shimmerStart}
              end={shimmerEnd}
              colors={["#9ca3af", "#ffffff", "#9ca3af"]}
              positions={[0, 0.5, 1]}
            />
          </Text>
        </Canvas>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: "#000",
  },
  darkOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  shaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    position: "absolute",
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: "center",
  },
});
