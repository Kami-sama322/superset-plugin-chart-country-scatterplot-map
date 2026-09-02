import { useCallback, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import { t } from '@apache-superset/core/translation';
import { useTheme } from '@apache-superset/core/theme';
import { Constants, InfoTooltip } from '@superset-ui/core/components';
import { ControlHeader } from '@superset-ui/chart-controls';
import { CodeEditor } from '@superset-ui/core/components/CodeEditor';
import {
  contentsEqual,
  syncContentsFromTemplate,
  syncTemplateFromContents,
} from '../tooltipSync';

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  name: string;
  tooltipContents?: unknown[];
  columns?: { column_name: string }[];
  actions?: {
    setControlValue?: (name: string, value: unknown) => void;
  };
};

const debounceFunc = debounce(
  (func: (val: string) => void, source: string) => func(source),
  Constants.SLOW_DEBOUNCE,
);

export default function TooltipTemplateControl({
  value,
  onChange,
  label,
  name,
  tooltipContents = [],
  columns = [],
  actions,
}: Props) {
  const theme = useTheme();
  const valueRef = useRef(value || '');
  const contentsRef = useRef(tooltipContents);
  const prevContentsRef = useRef(tooltipContents);
  valueRef.current = value || '';
  contentsRef.current = tooltipContents;

  useEffect(() => {
    const synced = syncTemplateFromContents(
      valueRef.current,
      prevContentsRef.current,
      tooltipContents,
    );
    prevContentsRef.current = tooltipContents;
    if (synced !== valueRef.current) {
      valueRef.current = synced;
      onChange(synced);
    }
  }, [tooltipContents, onChange]);

  const handleTemplateChange = useCallback(
    (newValue: string) => {
      const nextTemplate = newValue || '';
      debounceFunc(updated => {
        onChange(updated);
        const known = columns.map(column => column.column_name);
        const nextContents = syncContentsFromTemplate(
          contentsRef.current,
          updated,
          known,
        );
        if (
          actions?.setControlValue &&
          !contentsEqual(nextContents, contentsRef.current)
        ) {
          contentsRef.current = nextContents;
          actions.setControlValue('tooltip_contents', nextContents);
        }
      }, nextTemplate);
    },
    [actions, columns, onChange],
  );

  return (
    <div>
      <ControlHeader
        name={name}
        label={
          <>
            {label || t('Customize tooltips template')}
            <InfoTooltip
              iconStyle={{ marginLeft: theme.sizeUnit }}
              tooltip={t(
                'Handlebars template for the hover tooltip. Variables follow Tooltip contents. Built-in: country_id, metric, metric_formatted, region_name, longitude, latitude.',
              )}
            />
          </>
        }
      />
      <CodeEditor
        mode="handlebars"
        value={value || ''}
        onChange={handleTemplateChange}
        height="120px"
      />
    </div>
  );
}
