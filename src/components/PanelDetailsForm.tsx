import type { ReactNode } from "react";
import { Platform } from "react-native";
import {
  Button,
  Column,
  FieldGroup,
  Icon,
  Row,
  Spacer,
  Text,
} from "@expo/ui";
import {
  PANEL_AVAILABLE_FOOTER,
  PANEL_EMPTY_COPY,
} from "@/components/detailsFormCopy";
import { useColors } from "@/utils/theme";

const UNLINK_ICON = Icon.select({
  ios: "link.badge.plus",
  android: import("@expo/material-symbols/link_off.xml"),
});

const CHEVRON_ICON = Icon.select({
  ios: "chevron.right",
  android: import("@expo/material-symbols/chevron_right.xml"),
});

const WARNING_ICON = Icon.select({
  ios: "exclamationmark.triangle",
  android: import("@expo/material-symbols/warning.xml"),
});

const ADD_ICON = Icon.select({
  ios: "plus.circle",
  android: import("@expo/material-symbols/add_circle.xml"),
});

type InverterSummary = {
  id: string;
  serialNumber: string;
  efficiency: number;
};

function PanelFieldGroup({ children }: { children: ReactNode }) {
  return (
    <FieldGroup
      testID="panel-details-form"
      style={Platform.OS === "android" ? { height: 420 } : undefined}
    >
      {children}
    </FieldGroup>
  );
}

type PanelDetailsFormProps = {
  isViewMode: boolean;
  currentInverter?: InverterSummary | null;
  availableInverters: InverterSummary[];
  onLink: (inverterId: string) => void;
  onUnlink: () => void;
  onAddInverter: () => void;
};

export function PanelDetailsForm({
  isViewMode,
  currentInverter,
  availableInverters,
  onLink,
  onUnlink,
  onAddInverter,
}: PanelDetailsFormProps) {
  const colors = useColors();

  if (currentInverter) {
    const efficiencyLabel = `${Math.round(currentInverter.efficiency)}%`;
    return (
      <PanelFieldGroup>
        <FieldGroup.Section title="Linked Inverter">
          <Row alignment="center" spacing={12}>
            <Text>Serial Number</Text>
            <Spacer flexible />
            <Text>{currentInverter.serialNumber}</Text>
          </Row>
          <Row alignment="center" spacing={12}>
            <Text>Efficiency</Text>
            <Spacer flexible />
            <Text>{efficiencyLabel}</Text>
          </Row>
          {!isViewMode && (
            <Button
              variant="text"
              onPress={onUnlink}
              testID="unlink-inverter-button"
            >
              <Row alignment="center" spacing={8}>
                <Icon
                  name={UNLINK_ICON}
                  size={20}
                  color={colors.system.red as string}
                />
                <Text
                  textStyle={{
                    fontWeight: "700",
                    color: colors.system.red as string,
                  }}
                >
                  Unlink Inverter
                </Text>
              </Row>
            </Button>
          )}
        </FieldGroup.Section>
      </PanelFieldGroup>
    );
  }

  if (!isViewMode && availableInverters.length > 0) {
    return (
      <PanelFieldGroup>
        <FieldGroup.Section title="Available Inverters">
          <FieldGroup.SectionFooter>
            <Text textStyle={{ color: colors.text.secondary as string }}>
              {PANEL_AVAILABLE_FOOTER}
            </Text>
          </FieldGroup.SectionFooter>
          {availableInverters.map((inverter) => (
            <Button
              key={inverter.id}
              variant="text"
              onPress={() => onLink(inverter.id)}
              testID={`link-inverter-${inverter.id}`}
            >
              <Row alignment="center" spacing={12}>
                <Column alignment="start" spacing={2}>
                  <Text>{inverter.serialNumber}</Text>
                  <Text
                    textStyle={{
                      fontSize: 14,
                      color: colors.text.secondary as string,
                    }}
                  >
                    {`${Math.round(inverter.efficiency)}% efficiency`}
                  </Text>
                </Column>
                <Spacer flexible />
                <Icon
                  name={CHEVRON_ICON}
                  size={14}
                  color={colors.text.tertiary as string}
                />
              </Row>
            </Button>
          ))}
        </FieldGroup.Section>
      </PanelFieldGroup>
    );
  }

  if (!isViewMode) {
    return (
      <PanelFieldGroup>
        <FieldGroup.Section>
          <Column alignment="center" spacing={16}>
            <Icon
              name={WARNING_ICON}
              size={56}
              color={colors.text.secondary as string}
            />
            <Text textStyle={{ fontWeight: "700", fontSize: 20 }}>
              No Available Inverters
            </Text>
            <Text
              textStyle={{
                fontSize: 15,
                color: colors.text.secondary as string,
                textAlign: "center",
              }}
            >
              {PANEL_EMPTY_COPY}
            </Text>
            <Button
              variant="text"
              onPress={onAddInverter}
              testID="add-inverter-button"
            >
              <Row alignment="center" spacing={8}>
                <Icon
                  name={ADD_ICON}
                  size={22}
                  color={colors.primary as string}
                />
                <Text
                  textStyle={{
                    fontWeight: "700",
                    color: colors.primary as string,
                  }}
                >
                  Add Inverter
                </Text>
              </Row>
            </Button>
          </Column>
        </FieldGroup.Section>
      </PanelFieldGroup>
    );
  }

  return null;
}
