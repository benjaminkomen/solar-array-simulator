export function inverterEfficiencyFooter(isAddMode: boolean): string {
  return isAddMode
    ? "Set the expected efficiency for this micro-inverter."
    : "Adjust for shading, dirt, or other obstructions.";
}

export const PANEL_AVAILABLE_FOOTER =
  "Select a micro-inverter to link to this panel.";

export const PANEL_EMPTY_COPY =
  "All inverters are assigned. Unlink a panel first or add a new inverter.";
