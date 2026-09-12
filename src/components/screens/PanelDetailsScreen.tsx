import { Stack, useRouter } from "expo-router";
import { PanelDetailsForm } from "@/components/PanelDetailsForm";
import { usePanelDetails } from "@/hooks/usePanelDetails";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";

export default function PanelDetailsScreen() {
  useMarkInteractive();
  const router = useRouter();
  const {
    isViewMode,
    currentInverter,
    availableInverters,
    handleLink,
    handleUnlink,
  } = usePanelDetails();

  return (
    <>
      <Stack.Screen options={{ title: "Panel Details" }} />
      <PanelDetailsForm
        isViewMode={isViewMode}
        currentInverter={currentInverter}
        availableInverters={availableInverters}
        onLink={handleLink}
        onUnlink={handleUnlink}
        onAddInverter={() => router.push("/config")}
      />
    </>
  );
}
