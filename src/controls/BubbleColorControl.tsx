import { getCategoricalSchemeRegistry } from '@superset-ui/core';
import {
  ColorPicker,
  type ColorValue,
} from '@superset-ui/core/components';
import { ControlHeader } from '@superset-ui/chart-controls';
import {
  DEFAULT_BUBBLE_COLOR,
  RgbColorValue,
  toRgbColor,
} from '../geoColorUtils';

function rgbToHex(rgb: RgbColorValue): string {
  const toHex = (value: number) => {
    const hex = Math.round(value).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

type Props = {
  value?: unknown;
  onChange?: (color: RgbColorValue) => void;
  name?: string;
  label?: string;
  description?: string;
  renderTrigger?: boolean;
  hovered?: boolean;
  warning?: string;
};

export default function BubbleColorControl({
  value,
  onChange,
  ...headerProps
}: Props) {
  const rgb = toRgbColor(value) ?? DEFAULT_BUBBLE_COLOR;
  const categoricalScheme = getCategoricalSchemeRegistry().get();
  const presetColors = categoricalScheme?.colors.slice(0, 9) || [];

  const handleChange = (color: ColorValue) => {
    if (!onChange) {
      return;
    }
    const next = color.toRgb();
    onChange({
      r: next.r,
      g: next.g,
      b: next.b,
      a: next.a,
    });
  };

  return (
    <div>
      <ControlHeader {...headerProps} />
      <ColorPicker
        value={rgbToHex(rgb)}
        onChangeComplete={handleChange}
        presets={[{ label: 'Theme colors', colors: presetColors }]}
        showText
      />
    </div>
  );
}
