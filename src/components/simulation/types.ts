import type { Season } from '@/utils/solarCalculations';

export type SeasonPickerProps = {
  season: Season;
  onChange: (value: Season) => void;
};
