import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
}

type ModalState = {
  visible: boolean;
  type: "camera" | "gallery";
  isDenied: boolean;
} | null;

export function useImagePicker() {
  const [image, setImage] = useState<PickedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [modalState, setModalState] = useState<ModalState>(null);

  const checkCameraPermission = useCallback(async () => {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    return status;
  }, []);

  const checkGalleryPermission = useCallback(async () => {
    const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
    return status;
  }, []);

  const launchCamera = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== "granted") {
        setModalState({ visible: true, type: "camera", isDenied: true });
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImage({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";

      if (message.includes("Camera not available")) {
        Alert.alert(
          "Camera Unavailable",
          "The camera is not available on this device. Please use the gallery option instead.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Error", message, [{ text: "OK" }]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const launchGallery = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        setModalState({ visible: true, type: "gallery", isDenied: true });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImage({
          uri: asset.uri,
          width: asset.width,
          height: asset.height,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unknown error occurred";
      Alert.alert("Error", message, [{ text: "OK" }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const requestCamera = useCallback(async () => {
    const status = await checkCameraPermission();

    if (status === "denied") {
      setModalState({ visible: true, type: "camera", isDenied: true });
      return;
    }

    if (status === "undetermined") {
      setModalState({ visible: true, type: "camera", isDenied: false });
      return;
    }

    // Permission already granted, launch camera
    await launchCamera();
  }, [checkCameraPermission, launchCamera]);

  const requestGallery = useCallback(async () => {
    const status = await checkGalleryPermission();

    if (status === "denied") {
      setModalState({ visible: true, type: "gallery", isDenied: true });
      return;
    }

    if (status === "undetermined") {
      setModalState({ visible: true, type: "gallery", isDenied: false });
      return;
    }

    // Permission already granted, launch gallery
    await launchGallery();
  }, [checkGalleryPermission, launchGallery]);

  const handleModalAllow = useCallback(async () => {
    if (!modalState) return;

    setModalState(null);

    if (modalState.type === "camera") {
      await launchCamera();
    } else {
      await launchGallery();
    }
  }, [modalState, launchCamera, launchGallery]);

  const handleModalClose = useCallback(() => {
    setModalState(null);
  }, []);

  const clearImage = useCallback(() => {
    setImage(null);
  }, []);

  return {
    image,
    isLoading,
    pickFromCamera: requestCamera,
    pickFromGallery: requestGallery,
    clearImage,
    modalState,
    handleModalAllow,
    handleModalClose,
  };
}
