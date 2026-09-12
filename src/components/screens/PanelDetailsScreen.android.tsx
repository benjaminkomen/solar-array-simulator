import { useRouter } from "expo-router";
import {
  Column,
  Host,
  ModalBottomSheet,
  Text as UIText,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth, paddingAll } from "@expo/ui/jetpack-compose/modifiers";
import { PanelDetailsForm } from "@/components/PanelDetailsForm";
import { useColors } from "@/utils/theme";
import { usePanelDetails } from "@/hooks/usePanelDetails";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";

export default function PanelDetailsScreen() {
  useMarkInteractive();
  const colors = useColors();
  const router = useRouter();
  const {
    isViewMode,
    currentInverter,
    availableInverters,
    handleLink,
    handleUnlink,
  } = usePanelDetails();

  return (
    <Host matchContents>
      <ModalBottomSheet onDismissRequest={() => router.back()}>
        <Column modifiers={[paddingAll(16), fillMaxWidth()]} verticalArrangement={{ spacedBy: 16 }}>
          <UIText
            style={{ typography: "titleMedium", fontWeight: "700", textAlign: "center" }}
            color={colors.text.primary as string}
            modifiers={[fillMaxWidth()]}
          >
            Panel Details
          </UIText>

          <PanelDetailsForm
            isViewMode={isViewMode}
            currentInverter={currentInverter}
            availableInverters={availableInverters}
            onLink={handleLink}
            onUnlink={handleUnlink}
            onAddInverter={() => router.push("/config")}
          />
        </Column>
      </ModalBottomSheet>
    </Host>
  );
}
