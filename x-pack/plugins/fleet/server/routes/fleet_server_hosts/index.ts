/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FleetAuthzRouter } from '../../services/security';

import { OLDEST_PUBLIC_VERSION } from '../../../common/constants';

import { FLEET_SERVER_HOST_API_ROUTES } from '../../../common/constants';
import {
  GetAllFleetServerHostRequestSchema,
  GetOneFleetServerHostRequestSchema,
  PostFleetServerHostRequestSchema,
  PutFleetServerHostRequestSchema,
} from '../../types';

import {
  deleteFleetServerHostHandler,
  getAllFleetServerHostsHandler,
  getFleetServerHostHandler,
  postFleetServerHost,
  putFleetServerHostHandler,
} from './handler';

export const registerRoutes = (router: FleetAuthzRouter) => {
  router.versioned
    .get({
      path: FLEET_SERVER_HOST_API_ROUTES.LIST_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: GetAllFleetServerHostRequestSchema },
      },
      getAllFleetServerHostsHandler
    );
  router.versioned
    .post({
      path: FLEET_SERVER_HOST_API_ROUTES.CREATE_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: PostFleetServerHostRequestSchema },
      },
      postFleetServerHost
    );
  router.versioned
    .get({
      path: FLEET_SERVER_HOST_API_ROUTES.INFO_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: GetOneFleetServerHostRequestSchema },
      },
      getFleetServerHostHandler
    );
  router.versioned
    .delete({
      path: FLEET_SERVER_HOST_API_ROUTES.DELETE_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: GetOneFleetServerHostRequestSchema },
      },
      deleteFleetServerHostHandler
    );
  router.versioned
    .put({
      path: FLEET_SERVER_HOST_API_ROUTES.UPDATE_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: PutFleetServerHostRequestSchema },
      },
      putFleetServerHostHandler
    );
};
