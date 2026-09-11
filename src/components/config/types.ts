import type { InverterConfig, RoofType } from '@/utils/configStore';

export type RoofTypePickerProps = {
  roofType: RoofType;
  onChange: (value: RoofType) => void;
};

export type InverterSectionProps = {
  inverters: InverterConfig[];
  onEdit: (inverter: InverterConfig) => void;
  onDeleteIndices: (indices: number[]) => void;
  onDeleteInverter: (inverter: InverterConfig) => void;
};
