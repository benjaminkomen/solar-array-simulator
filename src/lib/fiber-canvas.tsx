import * as THREE from "three/webgpu";
import React, { useEffect, useRef } from "react";
import type { ReconcilerRoot, RootState } from "@react-three/fiber";
import {
  extend,
  createRoot,
  unmountComponentAtNode,
  events,
} from "@react-three/fiber";
import type { ViewProps } from "react-native";
import { PixelRatio } from "react-native";
import { Canvas, type CanvasRef } from "react-native-wgpu";

import {
  makeWebGPURenderer,
  ReactNativeCanvas,
} from "@/lib/make-webgpu-renderer";

import { pass } from "three/tsl";
import { bloom } from "three/addons/tsl/display/BloomNode.js";

// Extend THREE namespace for R3F
extend({
  AmbientLight: THREE.AmbientLight,
  DirectionalLight: THREE.DirectionalLight,
  PointLight: THREE.PointLight,
  Mesh: THREE.Mesh,
  Group: THREE.Group,
  BoxGeometry: THREE.BoxGeometry,
  SphereGeometry: THREE.SphereGeometry,
  CylinderGeometry: THREE.CylinderGeometry,
  PlaneGeometry: THREE.PlaneGeometry,
  BufferGeometry: THREE.BufferGeometry,
  BufferAttribute: THREE.BufferAttribute,
  MeshStandardMaterial: THREE.MeshStandardMaterial,
  MeshBasicMaterial: THREE.MeshBasicMaterial,
  PerspectiveCamera: THREE.PerspectiveCamera,
  Scene: THREE.Scene,
});

interface FiberCanvasProps {
  children: React.ReactNode;
  style?: ViewProps["style"];
  camera?: THREE.PerspectiveCamera;
  scene?: THREE.Scene;
}

export const FiberCanvas = ({
  children,
  style,
  scene,
  camera,
}: FiberCanvasProps) => {
  const root = useRef<ReconcilerRoot<OffscreenCanvas>>(null!);
  const canvasRef = useRef<CanvasRef>(null);

  useEffect(() => {
    const context = canvasRef.current!.getContext("webgpu")!;
    const renderer = makeWebGPURenderer(context);

    // @ts-expect-error - ReactNativeCanvas wraps native canvas
    const canvas = new ReactNativeCanvas(context.canvas) as HTMLCanvasElement;
    canvas.width = canvas.clientWidth * PixelRatio.get();
    canvas.height = canvas.clientHeight * PixelRatio.get();
    const size = {
      top: 0,
      left: 0,
      width: canvas.clientWidth,
      height: canvas.clientHeight,
    };

    if (!root.current) {
      root.current = createRoot(canvas);
    }
    root.current.configure({
      size,
      events,
      scene,
      camera,
      gl: renderer,
      frameloop: "always",
      dpr: 1,
      onCreated: async (state: RootState) => {
        // @ts-expect-error - WebGPU renderer has init method
        await state.gl.init();

        // Set up post-processing with bloom
        // @ts-expect-error - state.gl is typed as WebGLRenderer by R3F but is actually a WebGPURenderer
        const postProcessing = new THREE.PostProcessing(state.gl);
        const scenePass = pass(state.scene, state.camera);
        const sceneColor = scenePass.getTextureNode("output");
        postProcessing.outputNode = sceneColor.add(
          bloom(sceneColor, 1.5, 0.4, 0.85),
        );

        let renderingPostProcess = false;
        const originalRender = state.gl.render.bind(state.gl);

        state.gl.render = (scene: THREE.Scene, camera: THREE.Camera) => {
          if (renderingPostProcess) {
            // Called internally by PostProcessing — use original renderer
            return originalRender(scene, camera);
          }
          // Called by R3F frame loop — use post-processing pipeline
          renderingPostProcess = true;
          try {
            postProcessing.render();
          } finally {
            renderingPostProcess = false;
          }
          context?.present();
        };
      },
    });
    return () => {
      if (canvas != null) {
        unmountComponentAtNode(canvas!);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-render the R3F tree whenever children change
  useEffect(() => {
    if (root.current) {
      root.current.render(children);
    }
  });

  return <Canvas ref={canvasRef} style={style} />;
};
