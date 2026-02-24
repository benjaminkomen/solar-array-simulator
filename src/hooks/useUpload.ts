/**
 * Business logic for the Upload screen.
 * Handles wizard mode, image selection, and navigation.
 */
import { useCallback } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useImagePicker, type PickedImage } from "@/hooks/useImagePicker";

export function useUpload() {
  const router = useRouter();
  const { wizard } = useLocalSearchParams<{ wizard?: string }>();
  const isWizardMode = wizard === 'true';

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const wizardParam = isWizardMode ? '?wizard=true' : '';
    router.push(`/custom${wizardParam}`);
  };

  const onImageSelected = useCallback((picked: PickedImage) => {
    const wizardParam = isWizardMode ? '&wizard=true' : '';
    router.push(`/analyze?imageUri=${encodeURIComponent(picked.uri)}${wizardParam}`);
  }, [isWizardMode, router]);

  const {
    pickFromCamera,
    pickFromGallery,
    modalState,
    handleModalAllow,
    handleModalClose,
  } = useImagePicker(onImageSelected);

  return {
    isWizardMode,
    handleSkip,
    pickFromCamera,
    pickFromGallery,
    modalState,
    handleModalAllow,
    handleModalClose,
  };
}
