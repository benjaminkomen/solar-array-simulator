import { useRef, useCallback, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { GestureResponderEvent, ViewProps } from "react-native";
import * as THREE from "three/webgpu";

interface OrbitState {
  isRotating: boolean;
  isPanning: boolean;
  lastX: number;
  lastY: number;
  lastDist: number;
  theta: number;
  phi: number;
  radius: number;
  target: THREE.Vector3;
}

function OrbitControlsComponent({
  orbitState,
}: {
  orbitState: React.MutableRefObject<OrbitState>;
}) {
  const { camera } = useThree();

  useFrame(() => {
    const s = orbitState.current;
    const x =
      s.target.x + s.radius * Math.sin(s.phi) * Math.sin(s.theta);
    const y = s.target.y + s.radius * Math.cos(s.phi);
    const z =
      s.target.z + s.radius * Math.sin(s.phi) * Math.cos(s.theta);

    camera.position.set(x, y, z);
    camera.lookAt(s.target);
  });

  return null;
}

export default function useControls(
  initialRadius = 12,
  initialTheta = Math.PI / 4,
  initialPhi = Math.PI / 3
): [React.FC, Pick<ViewProps, "onTouchStart" | "onTouchMove" | "onTouchEnd">] {
  const orbitState = useRef<OrbitState>({
    isRotating: false,
    isPanning: false,
    lastX: 0,
    lastY: 0,
    lastDist: 0,
    theta: initialTheta,
    phi: initialPhi,
    radius: initialRadius,
    target: new THREE.Vector3(0, 1, 0),
  });

  const onTouchStart = useCallback((e: GestureResponderEvent) => {
    const touches = e.nativeEvent.touches;
    if (touches.length === 2) {
      const dx = touches[1].pageX - touches[0].pageX;
      const dy = touches[1].pageY - touches[0].pageY;
      orbitState.current.lastDist = Math.sqrt(dx * dx + dy * dy);
      orbitState.current.isPanning = true;
      orbitState.current.isRotating = false;
    } else if (touches.length === 1) {
      orbitState.current.lastX = touches[0].pageX;
      orbitState.current.lastY = touches[0].pageY;
      orbitState.current.isRotating = true;
      orbitState.current.isPanning = false;
    }
  }, []);

  const onTouchMove = useCallback((e: GestureResponderEvent) => {
    const touches = e.nativeEvent.touches;
    const s = orbitState.current;

    if (touches.length === 2 && s.isPanning) {
      const dx = touches[1].pageX - touches[0].pageX;
      const dy = touches[1].pageY - touches[0].pageY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = s.lastDist / dist;
      s.radius = Math.max(3, Math.min(40, s.radius * scale));
      s.lastDist = dist;
    } else if (touches.length === 1 && s.isRotating) {
      const deltaX = touches[0].pageX - s.lastX;
      const deltaY = touches[0].pageY - s.lastY;
      s.theta -= deltaX * 0.01;
      s.phi = Math.max(0.1, Math.min(Math.PI * 0.85, s.phi + deltaY * 0.01));
      s.lastX = touches[0].pageX;
      s.lastY = touches[0].pageY;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    orbitState.current.isRotating = false;
    orbitState.current.isPanning = false;
  }, []);

  const OrbitControls = useMemo(
    () =>
      function Controls() {
        return <OrbitControlsComponent orbitState={orbitState} />;
      },
    []
  );

  const events = useMemo(
    () => ({ onTouchStart, onTouchMove, onTouchEnd }),
    [onTouchStart, onTouchMove, onTouchEnd]
  );

  return [OrbitControls, events];
}
