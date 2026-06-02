import { useRouter } from 'expo-router';
import { Host, ModalBottomSheet, Text as UIText, Column, Icon } from "@expo/ui/jetpack-compose";
import { paddingAll } from "@expo/ui/jetpack-compose/modifiers";
import Navigation from "@expo/material-symbols/navigation.xml";
import { useColors } from "@/utils/theme";
import { useMarkInteractive } from "@/hooks/useMarkInteractive";

export default function CompassHelpScreen() {
  useMarkInteractive();
  const colors = useColors();
  const router = useRouter();

  return (
    <Host matchContents>
      <ModalBottomSheet onDismissRequest={() => router.back()}>
        <Column modifiers={[paddingAll(24)]} horizontalAlignment="center" verticalArrangement={{ spacedBy: 12 }}>
          <Icon
            source={Navigation}
            size={40}
            tint={colors.primary}
          />
          <UIText style={{ typography: 'titleMedium', fontWeight: '700' }} color={colors.text.primary as string}>
            Array Orientation
          </UIText>
          <UIText style={{ typography: 'bodyMedium', textAlign: 'center' }} color={colors.text.secondary as string}>
            {`Drag the arrow to indicate which direction the top of your panel array faces. This helps track your array\u2019s orientation for optimal sun exposure.`}
          </UIText>
        </Column>
      </ModalBottomSheet>
    </Host>
  );
}
