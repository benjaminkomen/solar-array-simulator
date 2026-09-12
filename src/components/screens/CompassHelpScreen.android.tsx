import { useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import {
  Column,
  Host,
  Icon,
  ModalBottomSheet,
  Text as UIText,
} from "@expo/ui/jetpack-compose";
import { fillMaxWidth, paddingAll } from "@expo/ui/jetpack-compose/modifiers";
import Navigation from "@expo/material-symbols/navigation.xml";
import { COMPASS_HELP_BODY, COMPASS_HELP_TITLE } from "@/utils/compassHelpCopy";
import { useColors } from "@/utils/theme";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";

export default function CompassHelpScreen() {
  useMarkInteractive();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <Host matchContents colorScheme={colorScheme ?? undefined}>
      <ModalBottomSheet onDismissRequest={() => router.back()}>
        <Column
          horizontalAlignment="center"
          modifiers={[fillMaxWidth(), paddingAll(16)]}
          verticalArrangement={{ spacedBy: 16 }}
        >
          <Icon
            source={Navigation}
            size={40}
            tint={colors.primary}
            contentDescription={COMPASS_HELP_TITLE}
          />
          <UIText
            style={{ typography: "titleMedium", fontWeight: "700", textAlign: "center" }}
            color={colors.text.primary as string}
            modifiers={[fillMaxWidth()]}
          >
            {COMPASS_HELP_TITLE}
          </UIText>
          <UIText
            style={{ typography: "bodyMedium", textAlign: "center" }}
            color={colors.text.secondary as string}
            modifiers={[fillMaxWidth()]}
          >
            {COMPASS_HELP_BODY}
          </UIText>
        </Column>
      </ModalBottomSheet>
    </Host>
  );
}
