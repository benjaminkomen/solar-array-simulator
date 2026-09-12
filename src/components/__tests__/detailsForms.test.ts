import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "bun:test";
import {
  inverterEfficiencyFooter,
  PANEL_AVAILABLE_FOOTER,
  PANEL_EMPTY_COPY,
} from "../detailsFormCopy";

const readSrc = (...parts: string[]) =>
  readFileSync(resolve(import.meta.dir, ...parts), "utf8");

const inverterFormSrc = readSrc("../InverterDetailsForm.tsx");
const panelFormSrc = readSrc("../PanelDetailsForm.tsx");
const inverterIosSrc = readSrc("../screens/InverterDetailsScreen.ios.tsx");
const inverterAndroidSrc = readSrc("../screens/InverterDetailsScreen.android.tsx");
const inverterWebSrc = readSrc("../screens/InverterDetailsScreen.tsx");
const panelIosSrc = readSrc("../screens/PanelDetailsScreen.ios.tsx");
const panelAndroidSrc = readSrc("../screens/PanelDetailsScreen.android.tsx");
const panelWebSrc = readSrc("../screens/PanelDetailsScreen.tsx");
const configSrc = readSrc("../../app/config.tsx");
const customIosSrc = readSrc("../screens/CustomScreen.ios.tsx");
const customAndroidSrc = readSrc("../screens/CustomScreen.android.tsx");
const detailsFlowSrc = readSrc("../../../.maestro/details-sheets.yaml");
const layoutSrc = readSrc("../../app/_layout.tsx");
const appJsonSrc = readFileSync(resolve(import.meta.dir, "../../../app.json"), "utf8");

describe("details FieldGroup body", () => {
  it("keeps inverter and panel form bodies on one FieldGroup implementation", () => {
    expect(inverterFormSrc).toContain('from "@expo/ui"');
    expect(inverterFormSrc).toContain("<FieldGroup");
    expect(inverterFormSrc).toContain("Serial Number");
    expect(inverterFormSrc).toContain("inverter-serial-input");
    expect(inverterFormSrc).not.toContain("<Host");

    expect(panelFormSrc).toContain('from "@expo/ui"');
    expect(panelFormSrc).toContain("<FieldGroup");
    expect(panelFormSrc).toContain("Linked Inverter");
    expect(panelFormSrc).toContain("Available Inverters");
    expect(panelFormSrc).toContain("No Available Inverters");
    expect(panelFormSrc).not.toContain("<Host");
  });

  it("leaves sheet chrome on the platform routes and _layout presentation split", () => {
    expect(inverterIosSrc).toContain("InverterDetailsForm");
    expect(inverterIosSrc).toContain("sheetAllowedDetents");
    expect(inverterIosSrc).not.toContain("<Form");
    expect(inverterIosSrc).not.toContain("LabeledContent");

    expect(inverterAndroidSrc).toContain("InverterDetailsForm");
    expect(inverterAndroidSrc).toContain("ModalBottomSheet");
    expect(inverterAndroidSrc).not.toContain("OutlinedCard");
    expect(inverterAndroidSrc).not.toContain("OutlinedTextField");

    expect(panelIosSrc).toContain("PanelDetailsForm");
    expect(panelIosSrc).toContain("sheetAllowedDetents");
    expect(panelIosSrc).not.toContain("<Form");
    expect(panelIosSrc).not.toContain("List.ForEach");

    expect(panelAndroidSrc).toContain("PanelDetailsForm");
    expect(panelAndroidSrc).toContain("ModalBottomSheet");
    expect(panelAndroidSrc).not.toContain("ElevatedCard");
    expect(panelAndroidSrc).not.toContain("ListItem");

    expect(layoutSrc).toContain('presentation: Platform.OS === \'ios\' ? "formSheet" : "transparentModal"');
  });

  it("does not put Host on the web route first paint", () => {
    expect(inverterWebSrc).toContain("InverterDetailsForm");
    expect(inverterWebSrc).not.toContain("<Host");
    expect(panelWebSrc).toContain("PanelDetailsForm");
    expect(panelWebSrc).not.toContain("<Host");
  });

  it("does not collapse Custom in this change", () => {
    expect(configSrc).toContain("FieldGroup");
    expect(customIosSrc).toContain("SolarPanelCanvas");
    expect(customAndroidSrc).toContain("SolarPanelCanvas");
    expect(customIosSrc).not.toContain("from \"@expo/ui\"");
    expect(customAndroidSrc).not.toContain("from \"@expo/ui\"");
  });

  it("reaches both sheets without Custom Add or a canvas tap", () => {
    expect(detailsFlowSrc).toContain("inverter-row-1");
    expect(detailsFlowSrc).toContain("panelId=seed-panel");
    expect(detailsFlowSrc).not.toContain("tap-add-panel");
    expect(detailsFlowSrc).not.toContain("Add panel");
    expect(detailsFlowSrc).not.toContain("inverter-details?mode=edit");
    expect(detailsFlowSrc).toContain("scrollUntilVisible");
    expect(detailsFlowSrc).toContain("visibilityPercentage: 100");
    const firstSave = detailsFlowSrc.indexOf('tapOn: "Save"');
    const afterFirstSave = detailsFlowSrc.slice(firstSave);
    expect(afterFirstSave).toContain('visible: "Continue"');
    expect(afterFirstSave.indexOf('visible: "Continue"')).toBeLessThan(
      afterFirstSave.indexOf('id: "inverter-row-1"'),
    );
  });

  it("does not flip Hermes V1", () => {
    expect(appJsonSrc).toContain('"useHermesV1": true');
  });

  it("preserves inverter efficiency footer copy", () => {
    expect(inverterEfficiencyFooter(true)).toBe(
      "Set the expected efficiency for this micro-inverter.",
    );
    expect(inverterEfficiencyFooter(false)).toBe(
      "Adjust for shading, dirt, or other obstructions.",
    );
    expect(PANEL_AVAILABLE_FOOTER).toBe(
      "Select a micro-inverter to link to this panel.",
    );
    expect(PANEL_EMPTY_COPY).toContain("All inverters are assigned");
  });
});
