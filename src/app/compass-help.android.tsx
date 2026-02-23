import { useRouter } from 'expo-router';
import { Host, ModalBottomSheet, Text as UIText, Column, Icon } from "@expo/ui/jetpack-compose";
import { paddingAll } from "@expo/ui/jetpack-compose/modifiers";
import { useColors } from "@/utils/theme";

export default function CompassHelpScreen() {
  const colors = useColors();
  const router = useRouter();

  return (
    <Host matchContents>
      <ModalBottomSheet onDismissRequest={() => router.back()}>
        <Column modifiers={[paddingAll(24)]} horizontalAlignment="center" verticalArrangement={{ spacedBy: 12 }}>
          <Icon
            source={require('@/assets/symbols/navigation.xml')}
            size={40}
            tintColor={colors.primary}
          />
          <UIText style={{ typography: 'titleMedium', fontWeight: '700' }} color={colors.text.primary}>
            Array Orientation
          </UIText>
          <UIText style={{ typography: 'bodyMedium', textAlign: 'center' }} color={colors.text.secondary}>
            {`Drag the arrow to indicate which direction the top of your panel array faces. This helps track your array\u2019s orientation for optimal sun exposure.`}
          </UIText>
        </Column>
      </ModalBottomSheet>
    </Host>
  );
}
