import {StyleSheet, View} from 'react-native';
import {
  Button,
  Form,
  Host,
  HStack,
  Image,
  LabeledContent,
  List,
  Section,
  Spacer,
  Text,
  TextField,
  VStack,
} from '@expo/ui/swift-ui';
import {
  buttonStyle,
  font,
  foregroundStyle,
  opacity,
  scrollDismissesKeyboard,
  submitLabel,
} from '@expo/ui/swift-ui/modifiers';
import {useConfigStore} from '@/hooks/useConfigStore';
import type {InverterConfig} from '@/utils/configStore';
import {Stack, useLocalSearchParams, useRouter} from "expo-router";
import {WizardProgress} from "@/components/WizardProgress";
import * as Haptics from "expo-haptics";

export default function ConfigScreen() {
  const router = useRouter();
  const {wizard} = useLocalSearchParams<{ wizard?: string }>();
  const isWizardMode = wizard === 'true';

  const {config, updateDefaultWattage, removeInverter} = useConfigStore();

  const handleWattageChange = (text: string) => {
    const wattage = parseInt(text, 10);
    if (!isNaN(wattage)) {
      updateDefaultWattage(wattage);
    }
  };

  const handleDelete = (indices: number[]) => {
    indices.forEach((i) => {
      const inverter = config.inverters[i];
      if (inverter) removeInverter(inverter.id);
    });
  };

  const handleOpenAddSheet = () => {
    router.push('/inverter-details?mode=add');
  };

  const handleOpenEditSheet = (inverter: InverterConfig) => {
    router.push(`/inverter-details?mode=edit&inverterId=${inverter.id}`);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/upload?wizard=true');
  };

  return (
    <>
      <Stack.Screen.BackButton displayMode="minimal"/>
      {isWizardMode && <WizardProgress currentStep={1}/>}
      <View style={styles.container}>
        <Host style={styles.form}>
            <Form modifiers={[scrollDismissesKeyboard('immediately')]}>
              {/* Panel Settings Section */}
              <Section
                header={<Text>Panel Settings</Text>}
                footer={
                  <Text>
                    Configure the default wattage each micro-inverter and solar panel will produce at
                    maximum production.
                  </Text>
                }
              >
                <LabeledContent label="Default Production">
                  <HStack>
                    <TextField
                      keyboardType="numbers-and-punctuation"
                      defaultValue={config.defaultMaxWattage.toString()}
                      onChangeText={handleWattageChange}
                      placeholder="430"
                      modifiers={[submitLabel('done')]}
                    />
                    <Spacer/>
                    <Text testID='text-input-unit'>W</Text>
                  </HStack>
                </LabeledContent>
              </Section>

              {/* Micro-inverters Section */}
              <Section
                header={<Text>Micro-inverters ({config.inverters.length})</Text>}
                footer={
                  <Text>
                    Tap to edit efficiency. Swipe left to delete.
                  </Text>
                }
              >
                <List.ForEach onDelete={handleDelete}>
                  {config.inverters.map((inverter) => (
                    <Button key={inverter.id} onPress={() => handleOpenEditSheet(inverter)}
                            modifiers={[buttonStyle('plain')]}>
                      <HStack>
                        <VStack alignment="leading" spacing={2}>
                          <Text modifiers={[foregroundStyle({type: 'hierarchical', style: 'primary'})]}>
                            {inverter.serialNumber}
                          </Text>
                          <Text
                            modifiers={[
                              opacity(0.6),
                              font({size: 14}),
                            ]}
                          >
                            {Math.round(inverter.efficiency)}% efficiency
                          </Text>
                        </VStack>
                        <Spacer/>
                        <Image systemName="chevron.right" size={14} color="#C7C7CC"/>
                      </HStack>
                    </Button>
                  ))}
                </List.ForEach>
              </Section>
            </Form>
          </Host>
        </View>
      <Stack.Toolbar placement="bottom">
        {isWizardMode && (
          <Stack.Toolbar.Button onPress={handleContinue}>
            Continue
          </Stack.Toolbar.Button>
        )}
        <Stack.Toolbar.Button icon="plus" onPress={handleOpenAddSheet}/>
      </Stack.Toolbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  form: {
    flex: 1,
  },
});
