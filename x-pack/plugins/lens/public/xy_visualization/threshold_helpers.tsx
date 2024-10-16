/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { partition } from 'lodash';
import { layerTypes } from '../../common';
import type { XYLayerConfig, YConfig } from '../../common/expressions';
import { Datatable } from '../../../../../src/plugins/expressions/public';
import type { DatasourcePublicAPI, FramePublicAPI } from '../types';
import { groupAxesByType } from './axes_configuration';
import { isPercentageSeries, isStackedChart } from './state_helpers';
import type { XYState } from './types';
import { checkScaleOperation } from './visualization_helpers';

export interface ThresholdBase {
  label: 'x' | 'yRight' | 'yLeft';
}

/**
 * Return the threshold layers groups to show based on multiple criteria:
 * * what groups are current defined in data layers
 * * what existing threshold are currently defined in data thresholds
 */
export function getGroupsToShow<T extends ThresholdBase & { config?: YConfig[] }>(
  thresholdLayers: T[],
  state: XYState | undefined,
  datasourceLayers: Record<string, DatasourcePublicAPI>,
  tables: Record<string, Datatable> | undefined
): Array<T & { valid: boolean }> {
  if (!state) {
    return [];
  }
  const dataLayers = state.layers.filter(
    ({ layerType = layerTypes.DATA }) => layerType === layerTypes.DATA
  );
  const groupsAvailable = getGroupsAvailableInData(dataLayers, datasourceLayers, tables);
  return thresholdLayers
    .filter(({ label, config }: T) => groupsAvailable[label] || config?.length)
    .map((layer) => ({ ...layer, valid: groupsAvailable[layer.label] }));
}

/**
 * Returns the threshold layers groups to show based on what groups are current defined in data layers.
 */
export function getGroupsRelatedToData<T extends ThresholdBase>(
  thresholdLayers: T[],
  state: XYState | undefined,
  datasourceLayers: Record<string, DatasourcePublicAPI>,
  tables: Record<string, Datatable> | undefined
): T[] {
  if (!state) {
    return [];
  }
  const dataLayers = state.layers.filter(
    ({ layerType = layerTypes.DATA }) => layerType === layerTypes.DATA
  );
  const groupsAvailable = getGroupsAvailableInData(dataLayers, datasourceLayers, tables);
  return thresholdLayers.filter(({ label }: T) => groupsAvailable[label]);
}
/**
 * Returns a dictionary with the groups filled in all the data layers
 */
export function getGroupsAvailableInData(
  dataLayers: XYState['layers'],
  datasourceLayers: Record<string, DatasourcePublicAPI>,
  tables: Record<string, Datatable> | undefined
) {
  const hasNumberHistogram = dataLayers.some(
    checkScaleOperation('interval', 'number', datasourceLayers)
  );
  const { right, left } = groupAxesByType(dataLayers, tables);
  return {
    x: dataLayers.some(({ xAccessor }) => xAccessor != null) && hasNumberHistogram,
    yLeft: left.length > 0,
    yRight: right.length > 0,
  };
}

export function getStaticValue(
  dataLayers: XYState['layers'],
  groupId: 'x' | 'yLeft' | 'yRight',
  { activeData }: Pick<FramePublicAPI, 'activeData'>,
  layerHasNumberHistogram: (layer: XYLayerConfig) => boolean
) {
  const fallbackValue = 100;
  if (!activeData) {
    return fallbackValue;
  }

  // filter and organize data dimensions into threshold groups
  // now pick the columnId in the active data
  const {
    dataLayers: filteredLayers,
    untouchedDataLayers,
    accessors,
  } = getAccessorCriteriaForGroup(groupId, dataLayers, activeData);
  if (
    groupId === 'x' &&
    filteredLayers.length &&
    !untouchedDataLayers.some(layerHasNumberHistogram)
  ) {
    return fallbackValue;
  }
  return (
    computeStaticValueForGroup(
      filteredLayers,
      accessors,
      activeData,
      groupId !== 'x' // histogram axis should compute the min based on the current data
    ) || fallbackValue
  );
}

function getAccessorCriteriaForGroup(
  groupId: 'x' | 'yLeft' | 'yRight',
  dataLayers: XYState['layers'],
  activeData: FramePublicAPI['activeData']
) {
  switch (groupId) {
    case 'x': {
      const filteredDataLayers = dataLayers.filter(({ xAccessor }) => xAccessor);
      // need to reshape the dataLayers to match the other accessors format
      return {
        dataLayers: filteredDataLayers.map(({ accessors, xAccessor, ...rest }) => ({
          ...rest,
          accessors: [xAccessor] as string[],
        })),
        // need the untouched ones for some checks later on
        untouchedDataLayers: filteredDataLayers,
        accessors: filteredDataLayers.map(({ xAccessor }) => xAccessor) as string[],
      };
    }
    case 'yLeft': {
      const { left } = groupAxesByType(dataLayers, activeData);
      const leftIds = new Set(left.map(({ layer }) => layer));
      const filteredDataLayers = dataLayers.filter(({ layerId }) => leftIds.has(layerId));
      return {
        dataLayers: filteredDataLayers,
        untouchedDataLayers: filteredDataLayers,
        accessors: left.map(({ accessor }) => accessor),
      };
    }
    case 'yRight': {
      const { right } = groupAxesByType(dataLayers, activeData);
      const rightIds = new Set(right.map(({ layer }) => layer));
      const filteredDataLayers = dataLayers.filter(({ layerId }) => rightIds.has(layerId));
      return {
        dataLayers: filteredDataLayers,
        untouchedDataLayers: filteredDataLayers,
        accessors: right.map(({ accessor }) => accessor),
      };
    }
  }
}

export function computeOverallDataDomain(
  dataLayers: Array<Pick<XYLayerConfig, 'seriesType' | 'accessors' | 'xAccessor' | 'layerId'>>,
  accessorIds: string[],
  activeData: NonNullable<FramePublicAPI['activeData']>
) {
  const accessorMap = new Set(accessorIds);
  let min: number | undefined;
  let max: number | undefined;
  const [stacked, unstacked] = partition(dataLayers, ({ seriesType }) =>
    isStackedChart(seriesType)
  );
  for (const { layerId, accessors } of unstacked) {
    const table = activeData[layerId];
    if (table) {
      for (const accessor of accessors) {
        if (accessorMap.has(accessor)) {
          for (const row of table.rows) {
            const value = row[accessor];
            if (typeof value === 'number') {
              // when not stacked, do not keep the 0
              max = max != null ? Math.max(value, max) : value;
              min = min != null ? Math.min(value, min) : value;
            }
          }
        }
      }
    }
  }
  // stacked can span multiple layers, so compute an overall max/min by bucket
  const stackedResults: Record<string, number> = {};
  for (const { layerId, accessors, xAccessor } of stacked) {
    const table = activeData[layerId];
    if (table) {
      for (const accessor of accessors) {
        if (accessorMap.has(accessor)) {
          for (const row of table.rows) {
            const value = row[accessor];
            // start with a shared bucket
            let bucket = 'shared';
            // but if there's an xAccessor use it as new bucket system
            if (xAccessor) {
              bucket = row[xAccessor];
            }
            if (typeof value === 'number') {
              stackedResults[bucket] = stackedResults[bucket] ?? 0;
              stackedResults[bucket] += value;
            }
          }
        }
      }
    }
  }

  for (const value of Object.values(stackedResults)) {
    // for stacked extents keep 0 in view
    max = Math.max(value, max || 0, 0);
    min = Math.min(value, min || 0, 0);
  }

  return { min, max };
}

function computeStaticValueForGroup(
  dataLayers: Array<Pick<XYLayerConfig, 'seriesType' | 'accessors' | 'xAccessor' | 'layerId'>>,
  accessorIds: string[],
  activeData: NonNullable<FramePublicAPI['activeData']>,
  minZeroOrNegativeBase: boolean = true
) {
  const defaultThresholdFactor = 3 / 4;

  if (dataLayers.length && accessorIds.length) {
    if (dataLayers.some(({ seriesType }) => isPercentageSeries(seriesType))) {
      return defaultThresholdFactor;
    }

    const { min, max } = computeOverallDataDomain(dataLayers, accessorIds, activeData);

    if (min != null && max != null && isFinite(min) && isFinite(max)) {
      // Custom axis bounds can go below 0, so consider also lower values than 0
      const finalMinValue = minZeroOrNegativeBase ? Math.min(0, min) : min;
      const interval = max - finalMinValue;
      return Number((finalMinValue + interval * defaultThresholdFactor).toFixed(2));
    }
  }
}
