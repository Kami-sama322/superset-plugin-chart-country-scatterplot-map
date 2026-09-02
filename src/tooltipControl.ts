import { t } from '@apache-superset/core/translation';
import { ControlPanelState } from '@superset-ui/chart-controls';
import TooltipTemplateControl from './controls/TooltipTemplateControl';

export const tooltipContentsControl = {
  name: 'tooltip_contents',
  config: {
    type: 'DndColumnSelect',
    label: t('Tooltip contents'),
    multi: true,
    freeForm: true,
    clearable: true,
    default: [],
    description: t(
      'Columns shown in the hover tooltip. Custom SQL is supported and can be removed from this list.',
    ),
    ghostButtonText: t('Drop columns here or click'),
    shouldMapStateToProps: () => true,
    mapStateToProps: (state: ControlPanelState) => {
      const columns = state.datasource?.columns || [];
      return {
        options: columns.filter(
          (column: { groupby?: boolean }) => column.groupby !== false,
        ),
      };
    },
  },
};

export const tooltipTemplateControl = {
  name: 'tooltip_template',
  config: {
    type: TooltipTemplateControl,
    label: t('Customize tooltips template'),
    renderTrigger: true,
    default: '',
    shouldMapStateToProps: () => true,
    mapStateToProps: (state: ControlPanelState) => ({
      tooltipContents: state.form_data?.tooltip_contents || [],
      columns: state.datasource?.columns || [],
    }),
  },
};

