/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { PluginInitializerContext } from '@kbn/core/public';
import { UiActionsPlugin } from './plugin';

export function plugin(initializerContext: PluginInitializerContext) {
  return new UiActionsPlugin(initializerContext);
}

export type { UiActionsSetup, UiActionsStart } from './plugin';
export type { UiActionsServiceParams } from './service';
export { UiActionsService } from './service';
export type { Action, ActionDefinition as UiActionsActionDefinition } from './actions';
export { ActionInternal, createAction, IncompatibleActionError } from './actions';
export { buildContextMenuForActions } from './context_menu';
export type {
  Presentable as UiActionsPresentable,
  PresentableGrouping as UiActionsPresentableGrouping,
} from '@kbn/ui-actions-browser';
export type { Trigger, RowClickContext } from './triggers';
export {
  VISUALIZE_FIELD_TRIGGER,
  visualizeFieldTrigger,
  VISUALIZE_GEO_FIELD_TRIGGER,
  visualizeGeoFieldTrigger,
  ROW_CLICK_TRIGGER,
  rowClickTrigger,
  CATEGORIZE_FIELD_TRIGGER,
  categorizeFieldTrigger,
} from './triggers';
export type { VisualizeFieldContext, CategorizeFieldContext } from './types';
export {
  ACTION_VISUALIZE_FIELD,
  ACTION_VISUALIZE_GEO_FIELD,
  ACTION_VISUALIZE_LENS_FIELD,
  ACTION_CATEGORIZE_FIELD,
} from './types';
export type { ActionExecutionContext, ActionExecutionMeta, ActionMenuItemProps } from './actions';
