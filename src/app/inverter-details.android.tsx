import { StyleSheet, ScrollView, Text, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import {
  Host, Slider, TextInput,
  Card, Text as UIText, Column,
} from '@expo/ui/jetpack-compose';
import { paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import { useColors } from '@/utils/theme';
import { useInverterForm } from '@/hooks/useInverterForm';

export default function InverterDetailsScreen() {
  const colors = useColors();
  const {
    isAddMode,
    serial,
    setSerial,
    efficiency,
    setEfficiency,
    handleSave,
    handleCancel,
  } = useInverterForm();

  return (
    <>
      <Stack.Screen
        options={{
          title: isAddMode ? 'New Micro-inverter' : 'Edit Micro-inverter',
          sheetAllowedDetents: [0.6, 1.0],
          headerLeft: () => (
            <Pressable onPress={handleCancel} style={styles.headerButton} accessibilityLabel="Cancel">
              <Text style={[styles.headerButtonText, { color: colors.text.primary }]}>Cancel</Text>
            </Pressable>
          ),
          headerRight: () => (
            <Pressable onPress={handleSave} style={styles.headerButton} accessibilityLabel="Save">
              <Text style={[styles.headerButtonText, { color: colors.primary }]}>Save</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background.secondary }]}
        contentContainerStyle={styles.scrollContent}
        keyboardDismissMode="on-drag"
      >
        {/* Details */}
        <Host matchContents>
          <Card variant="outlined">
            <Column modifiers={[paddingAll(16)]}>
              <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary}>
                DETAILS
              </UIText>
              <UIText style={{ typography: 'bodyLarge' }} color={colors.text.primary}>
                Serial Number
              </UIText>
              <TextInput
                defaultValue={serial}
                onChangeText={setSerial}
                keyboardType="numeric"
              />
            </Column>
          </Card>
        </Host>

        {/* Efficiency */}
        <Host matchContents>
          <Card variant="outlined">
            <Column modifiers={[paddingAll(16)]}>
              <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary}>
                EFFICIENCY
              </UIText>
              <UIText style={{ typography: 'headlineMedium', fontWeight: '700' }} color={colors.text.primary}>
                {`${Math.round(efficiency)}%`}
              </UIText>
              <Slider
                value={efficiency / 100}
                onValueChange={(val) => setEfficiency(val * 100)}
                min={0}
                max={1}
              />
              <UIText style={{ typography: 'bodySmall' }} color={colors.text.secondary}>
                {isAddMode
                  ? 'Set the expected efficiency for this micro-inverter.'
                  : 'Adjust for shading, dirt, or other obstructions.'}
              </UIText>
            </Column>
          </Card>
        </Host>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
