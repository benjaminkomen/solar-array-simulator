import {StyleSheet, View} from 'react-native';
import {Link, Stack} from 'expo-router';
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
  VStack,
} from '@expo/ui/swift-ui';
import {
  bold,
  buttonStyle,
  font,
  foregroundStyle,
  opacity,
} from '@expo/ui/swift-ui/modifiers';
import { usePanelDetails } from '@/hooks/usePanelDetails';

export default function PanelDetailsScreen() {
  const {
    isViewMode,
    currentInverter,
    availableInverters,
    handleLink,
    handleUnlink,
  } = usePanelDetails();

  return (
    <>
      <Stack.Screen
        options={{
          sheetAllowedDetents: isViewMode ? [0.3] : [0.6, 1.0],
        }}
      />
      <View style={styles.container}>
        <Host style={styles.host}>
          <Form>
          {currentInverter ? (
            <Section
              header={<Text>Linked Inverter</Text>}
            >
              <LabeledContent label="Serial Number">
                <Text>{currentInverter.serialNumber}</Text>
              </LabeledContent>
              <LabeledContent label="Efficiency">
                <Text>{Math.round(currentInverter.efficiency)}%</Text>
              </LabeledContent>
              {!isViewMode && (
                <Button onPress={handleUnlink} modifiers={[buttonStyle('plain')]}>
                  <HStack spacing={8}>
                    <Image systemName="link.badge.plus" size={20} color="#FF3B30" />
                    <Text modifiers={[foregroundStyle({type: 'color', color: '#FF3B30'}), bold()]}>
                      Unlink Inverter
                    </Text>
                  </HStack>
                </Button>
              )}
            </Section>
          ) : !isViewMode && availableInverters.length > 0 ? (
            <Section
              header={<Text>Available Inverters</Text>}
              footer={<Text>Select a micro-inverter to link to this panel.</Text>}
            >
              <List.ForEach>
                {availableInverters.map((inv) => (
                  <Button key={inv.id} onPress={() => handleLink(inv.id)} modifiers={[buttonStyle('plain')]}>
                    <HStack>
                      <VStack alignment="leading" spacing={2}>
                        <Text modifiers={[foregroundStyle({type: 'hierarchical', style: 'primary'})]}>
                          {inv.serialNumber}
                        </Text>
                        <Text modifiers={[opacity(0.6), font({size: 14})]}>
                          {Math.round(inv.efficiency)}% efficiency
                        </Text>
                      </VStack>
                      <Spacer />
                      <Image systemName="chevron.right" size={14} color="#C7C7CC" />
                    </HStack>
                  </Button>
                ))}
              </List.ForEach>
            </Section>
          ) : !isViewMode ? (
            <Section>
              <VStack spacing={16}>
                <Image systemName="exclamationmark.triangle" size={56} color="#8E8E93" />
                <Text modifiers={[bold(), font({size: 20})]}>No Available Inverters</Text>
                <Text modifiers={[opacity(0.6), font({size: 15})]}>
                  All inverters are assigned. Unlink a panel first or add a new inverter.
                </Text>
                <Link href="/config" asChild>
                  <Button>
                    <HStack>
                      <Image systemName="plus.circle" size={22} color="#007AFF" />
                      <Text modifiers={[foregroundStyle({type: 'color', color: '#007AFF'}), bold()]}>
                        Add Inverter
                      </Text>
                    </HStack>
                  </Button>
                </Link>
              </VStack>
            </Section>
          ) : null}
          </Form>
        </Host>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  host: {
    flex: 1,
  },
});
