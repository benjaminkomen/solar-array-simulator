import { Fragment } from 'react';
import { useRouter } from 'expo-router';
import {
  Column,
  ElevatedCard,
  HorizontalDivider,
  Host,
  Icon,
  ListItem,
  ModalBottomSheet,
  TextButton,
  Text as UIText,
} from '@expo/ui/jetpack-compose';
import { clickable, fillMaxWidth, paddingAll } from '@expo/ui/jetpack-compose/modifiers';
import LinkOff from '@expo/material-symbols/link_off.xml';
import { useColors } from '@/utils/theme';
import { usePanelDetails } from '@/hooks/usePanelDetails';
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

          <UIText style={{ typography: 'titleMedium', fontWeight: '700', textAlign: 'center' }} color={colors.text.primary as string} modifiers={[fillMaxWidth()]}>
            Panel Details
          </UIText>

          {currentInverter ? (
            <ElevatedCard colors={{ containerColor: colors.background.primary }}>
              <Column modifiers={[fillMaxWidth(), paddingAll(8)]}>
                <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary as string} modifiers={[paddingAll(8)]}>
                  LINKED INVERTER
                </UIText>
                <ListItem>
                  <ListItem.HeadlineContent>
                    <UIText>Serial Number</UIText>
                  </ListItem.HeadlineContent>
                  <ListItem.TrailingContent>
                    <UIText style={{ typography: 'bodyMedium' }} color={colors.text.secondary as string}>
                      {currentInverter.serialNumber}
                    </UIText>
                  </ListItem.TrailingContent>
                </ListItem>
                <HorizontalDivider />
                <ListItem>
                  <ListItem.HeadlineContent>
                    <UIText>Efficiency</UIText>
                  </ListItem.HeadlineContent>
                  <ListItem.TrailingContent>
                    <UIText style={{ typography: 'bodyMedium' }} color={colors.text.secondary as string}>
                      {`${Math.round(currentInverter.efficiency)}%`}
                    </UIText>
                  </ListItem.TrailingContent>
                </ListItem>
                {!isViewMode && (
                  <>
                    <HorizontalDivider />
                    <ListItem
                      modifiers={[clickable(handleUnlink)]}
                      colors={{ contentColor: colors.system.red }}
                    >
                      <ListItem.HeadlineContent>
                        <UIText color={colors.system.red as string}>Unlink Inverter</UIText>
                      </ListItem.HeadlineContent>
                      <ListItem.LeadingContent>
                        <Icon source={LinkOff} tint={colors.system.red} />
                      </ListItem.LeadingContent>
                    </ListItem>
                  </>
                )}
              </Column>
            </ElevatedCard>
          ) : !isViewMode && availableInverters.length > 0 ? (
            <Column modifiers={[fillMaxWidth()]} verticalArrangement={{ spacedBy: 8 }}>
              <UIText style={{ typography: 'labelMedium', letterSpacing: 0.5 }} color={colors.text.secondary as string} modifiers={[paddingAll(4)]}>
                AVAILABLE INVERTERS
              </UIText>
              <ElevatedCard colors={{ containerColor: colors.background.primary }}>
                <Column modifiers={[fillMaxWidth(), paddingAll(8)]}>
                  {availableInverters.map((inv, idx) => (
                    <Fragment key={inv.id}>
                      {idx > 0 && <HorizontalDivider />}
                      <ListItem
                        modifiers={[clickable(() => handleLink(inv.id))]}
                      >
                        <ListItem.HeadlineContent>
                          <UIText>{inv.serialNumber}</UIText>
                        </ListItem.HeadlineContent>
                        <ListItem.SupportingContent>
                          <UIText>{`${Math.round(inv.efficiency)}% efficiency`}</UIText>
                        </ListItem.SupportingContent>
                      </ListItem>
                    </Fragment>
                  ))}
                </Column>
              </ElevatedCard>
              <UIText style={{ typography: 'bodySmall' }} color={colors.text.secondary as string} modifiers={[paddingAll(4)]}>
                Select a micro-inverter to link to this panel.
              </UIText>
            </Column>
          ) : !isViewMode ? (
            <ElevatedCard colors={{ containerColor: colors.background.primary }}>
              <Column modifiers={[fillMaxWidth(), paddingAll(16)]} horizontalAlignment="center">
                <UIText style={{ typography: 'headlineSmall', fontWeight: '700' }} color={colors.text.primary as string}>
                  No Available Inverters
                </UIText>
                <UIText style={{ typography: 'bodyMedium', textAlign: 'center' }} color={colors.text.secondary as string}>
                  All inverters are assigned. Unlink a panel first or add a new inverter.
                </UIText>
                <TextButton onClick={() => router.push('/config')}>
                  Add Inverter
                </TextButton>
              </Column>
            </ElevatedCard>
          ) : null}

        </Column>
      </ModalBottomSheet>
    </Host>
  );
}
