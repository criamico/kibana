/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

/*
 * NOTICE: Do not edit this file manually.
 * This file is automatically generated by the OpenAPI Generator, @kbn/openapi-generator.
 *
 * info:
 *   title: Delete list API endpoint
 *   version: 2023-10-31
 */

import { z } from 'zod';
import { BooleanFromString } from '@kbn/zod-helpers';

import { ListId } from '../model/list_common.gen';
import { List } from '../model/list_schemas.gen';

export type DeleteListRequestQuery = z.infer<typeof DeleteListRequestQuery>;
export const DeleteListRequestQuery = z.object({
  /**
   * List's `id` value
   */
  id: ListId,
  deleteReferences: BooleanFromString.optional().default(false),
  ignoreReferences: BooleanFromString.optional().default(false),
});
export type DeleteListRequestQueryInput = z.input<typeof DeleteListRequestQuery>;

export type DeleteListResponse = z.infer<typeof DeleteListResponse>;
export const DeleteListResponse = List;
