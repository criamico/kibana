/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FleetAuthzRouter } from '../../services/security';

import { OUTPUT_API_ROUTES } from '../../constants';
import {
  DeleteOutputRequestSchema,
  GetOneOutputRequestSchema,
  GetOutputsRequestSchema,
  PostOutputRequestSchema,
  PutOutputRequestSchema,
  PostESOutputRequestSchema,
  PostLogstashOutputRequestSchema,
  PutESOutputRequestSchema,
  PutLogstashOutputRequestSchema,
} from '../../types';

import {
  deleteOutputHandler,
  getOneOuputHandler,
  getOutputsHandler,
  postOuputHandler,
  putOuputHandler,
  postLogstashApiKeyHandler,
  postESOutputHandler,
  postLogstashOutputHandler,
  putESOutputHandler,
  putLogstashOutputHandler,
} from './handler';

export const registerRoutes = (router: FleetAuthzRouter) => {
  router.get(
    {
      path: OUTPUT_API_ROUTES.LIST_PATTERN,
      validate: GetOutputsRequestSchema,
      fleetAuthz: {
        fleet: { all: true },
      },
    },
    getOutputsHandler
  );
  router.get(
    {
      path: OUTPUT_API_ROUTES.INFO_PATTERN,
      validate: GetOneOutputRequestSchema,
      fleetAuthz: {
        fleet: { all: true },
      },
    },
    getOneOuputHandler
  );
  // to be deprecated
  router.put(
    {
      path: OUTPUT_API_ROUTES.UPDATE_PATTERN,
      validate: PutOutputRequestSchema,
      fleetAuthz: {
        fleet: { all: true },
      },
    },
    putOuputHandler
  );

  router.post(
    {
      path: OUTPUT_API_ROUTES.CREATE_PATTERN,
      validate: PostOutputRequestSchema,
      fleetAuthz: {
        fleet: { all: true },
      },
    },
    postOuputHandler
  );
  // New endpoints
  router.put(
    {
      path: OUTPUT_API_ROUTES.UPDATE_ES_PATTERN,
      validate: PutESOutputRequestSchema,
      fleetAuthz: {
        fleet: { all: true },
      },
    },
    putESOutputHandler
  );

  router.post(
    {
      path: OUTPUT_API_ROUTES.CREATE_ES_PATTERN,
      validate: PostESOutputRequestSchema,
      fleetAuthz: {
        fleet: { all: true },
      },
    },
    postESOutputHandler
  );
  router.put(
    {
      path: OUTPUT_API_ROUTES.UPDATE_LOGSTASH_PATTERN,
      validate: PutLogstashOutputRequestSchema,
      fleetAuthz: {
        fleet: { all: true },
      },
    },
    putLogstashOutputHandler // create new handler
  );

  router.post(
    {
      path: OUTPUT_API_ROUTES.CREATE_LOGSTASH_PATTERN,
      validate: PostLogstashOutputRequestSchema,
      fleetAuthz: {
        fleet: { all: true },
      },
    },
    postLogstashOutputHandler
  );

  router.delete(
    {
      path: OUTPUT_API_ROUTES.DELETE_PATTERN,
      validate: DeleteOutputRequestSchema,
      fleetAuthz: {
        fleet: { all: true },
      },
    },
    deleteOutputHandler
  );

  router.post(
    {
      path: OUTPUT_API_ROUTES.LOGSTASH_API_KEY_PATTERN,
      validate: false,
      fleetAuthz: {
        fleet: { all: true },
      },
    },
    postLogstashApiKeyHandler
  );
};
