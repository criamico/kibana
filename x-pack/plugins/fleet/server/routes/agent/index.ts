/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { FleetAuthz } from '../../../common';
import { OLDEST_PUBLIC_VERSION } from '../../../common/constants';

import { getRouteRequiredAuthz, type FleetAuthzRouter } from '../../services/security';

import { AGENT_API_ROUTES } from '../../constants';
import {
  GetAgentsRequestSchema,
  GetTagsRequestSchema,
  GetOneAgentRequestSchema,
  UpdateAgentRequestSchema,
  DeleteAgentRequestSchema,
  PostAgentUnenrollRequestSchema,
  PostBulkAgentUnenrollRequestSchema,
  GetAgentStatusRequestSchema,
  GetAgentDataRequestSchema,
  PostNewAgentActionRequestSchema,
  PutAgentReassignRequestSchemaDeprecated,
  PostAgentReassignRequestSchema,
  PostBulkAgentReassignRequestSchema,
  PostAgentUpgradeRequestSchema,
  PostBulkAgentUpgradeRequestSchema,
  PostCancelActionRequestSchema,
  GetActionStatusRequestSchema,
  PostRequestDiagnosticsActionRequestSchema,
  PostBulkRequestDiagnosticsActionRequestSchema,
  ListAgentUploadsRequestSchema,
  GetAgentUploadFileRequestSchema,
  PostRetrieveAgentsByActionsRequestSchema,
} from '../../types';
import * as AgentService from '../../services/agents';
import type { FleetConfigType } from '../..';

import { PostBulkUpdateAgentTagsRequestSchema } from '../../types/rest_spec/agent';

import { calculateRouteAuthz } from '../../services/security/security';

import {
  getAgentsHandler,
  getAgentTagsHandler,
  getAgentHandler,
  updateAgentHandler,
  deleteAgentHandler,
  getAgentStatusForAgentPolicyHandler,
  putAgentsReassignHandlerDeprecated,
  postBulkAgentsReassignHandler,
  getAgentDataHandler,
  bulkUpdateAgentTagsHandler,
  getAvailableVersionsHandler,
  getActionStatusHandler,
  getAgentUploadsHandler,
  getAgentUploadFileHandler,
  postAgentsReassignHandler,
  postRetrieveAgentsByActionsHandler,
} from './handlers';
import {
  postNewAgentActionHandlerBuilder,
  postCancelActionHandlerBuilder,
} from './actions_handlers';
import { postAgentUnenrollHandler, postBulkAgentsUnenrollHandler } from './unenroll_handler';
import { postAgentUpgradeHandler, postBulkAgentsUpgradeHandler } from './upgrade_handler';
import {
  bulkRequestDiagnosticsHandler,
  requestDiagnosticsHandler,
} from './request_diagnostics_handler';

export const registerAPIRoutes = (router: FleetAuthzRouter, config: FleetConfigType) => {
  // Get one
  router.versioned
    .get({
      access: 'public',
      path: AGENT_API_ROUTES.INFO_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: GetOneAgentRequestSchema },
      },
      getAgentHandler
    );

  // Update
  router.versioned
    .put({
      access: 'public',
      path: AGENT_API_ROUTES.UPDATE_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: UpdateAgentRequestSchema },
      },
      updateAgentHandler
    );

  // Bulk Update Tags
  router.versioned
    .post({
      access: 'public',
      path: AGENT_API_ROUTES.BULK_UPDATE_AGENT_TAGS_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: PostBulkUpdateAgentTagsRequestSchema },
      },
      bulkUpdateAgentTagsHandler
    );

  // Delete
  router.versioned
    .delete({
      access: 'public',
      path: AGENT_API_ROUTES.DELETE_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: DeleteAgentRequestSchema },
      },
      deleteAgentHandler
    );

  // List
  router.versioned
    .get({
      access: 'public',
      path: AGENT_API_ROUTES.LIST_PATTERN,

      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: GetAgentsRequestSchema },
      },
      getAgentsHandler
    );

  // List Agent Tags
  router.versioned
    .get({
      access: 'public',
      path: AGENT_API_ROUTES.LIST_TAGS_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: GetTagsRequestSchema },
      },
      getAgentTagsHandler
    );

  // Agent actions
  router.versioned
    .post({
      access: 'public',
      path: AGENT_API_ROUTES.ACTIONS_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: PostNewAgentActionRequestSchema },
      },
      postNewAgentActionHandlerBuilder({
        getAgent: AgentService.getAgentById,
        cancelAgentAction: AgentService.cancelAgentAction,
        createAgentAction: AgentService.createAgentAction,
        getAgentActions: AgentService.getAgentActions,
      })
    );

  router.versioned
    .post({
      access: 'public',
      path: AGENT_API_ROUTES.CANCEL_ACTIONS_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: PostCancelActionRequestSchema },
      },
      postCancelActionHandlerBuilder({
        getAgent: AgentService.getAgentById,
        cancelAgentAction: AgentService.cancelAgentAction,
        createAgentAction: AgentService.createAgentAction,
        getAgentActions: AgentService.getAgentActions,
      })
    );

  // Get agents by Action_Ids
  router.versioned
    .post({
      access: 'public',
      path: AGENT_API_ROUTES.LIST_PATTERN,
      fleetAuthz: {
        fleet: { all: true }, // Authorizations?
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: PostRetrieveAgentsByActionsRequestSchema },
      },
      postRetrieveAgentsByActionsHandler
    );

  router.versioned
    .post({
      access: 'public',
      path: AGENT_API_ROUTES.UNENROLL_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: PostAgentUnenrollRequestSchema },
      },
      postAgentUnenrollHandler
    );

  // mark as deprecated
  router.versioned
    .put({
      access: 'public',
      path: AGENT_API_ROUTES.REASSIGN_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: PutAgentReassignRequestSchemaDeprecated },
      },
      putAgentsReassignHandlerDeprecated
    );

  router.versioned
    .post({
      access: 'public',
      path: AGENT_API_ROUTES.REASSIGN_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: PostAgentReassignRequestSchema },
      },
      postAgentsReassignHandler
    );

  router.versioned
    .post({
      access: 'public',
      path: AGENT_API_ROUTES.REQUEST_DIAGNOSTICS_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: PostRequestDiagnosticsActionRequestSchema },
      },
      requestDiagnosticsHandler
    );

  router.versioned
    .post({
      access: 'public',
      path: AGENT_API_ROUTES.BULK_REQUEST_DIAGNOSTICS_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: PostBulkRequestDiagnosticsActionRequestSchema },
      },
      bulkRequestDiagnosticsHandler
    );

  router.versioned
    .get({
      access: 'public',
      path: AGENT_API_ROUTES.LIST_UPLOADS_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: ListAgentUploadsRequestSchema },
      },
      getAgentUploadsHandler
    );

  router.versioned
    .get({
      access: 'public',
      path: AGENT_API_ROUTES.GET_UPLOAD_FILE_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: GetAgentUploadFileRequestSchema },
      },
      getAgentUploadFileHandler
    );

  // Get agent status for policy
  router.versioned
    .get({
      access: 'public',
      path: AGENT_API_ROUTES.STATUS_PATTERN,
      fleetAuthz: (fleetAuthz: FleetAuthz): boolean =>
        calculateRouteAuthz(
          fleetAuthz,
          getRouteRequiredAuthz('get', AGENT_API_ROUTES.STATUS_PATTERN)
        ).granted,
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: GetAgentStatusRequestSchema },
      },
      getAgentStatusForAgentPolicyHandler
    );
  router.versioned
    .get({
      access: 'internal',
      path: AGENT_API_ROUTES.STATUS_PATTERN_DEPRECATED,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: GetAgentStatusRequestSchema },
      },
      getAgentStatusForAgentPolicyHandler
    );
  // Agent data
  router.versioned
    .get({
      access: 'public',
      path: AGENT_API_ROUTES.DATA_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: GetAgentDataRequestSchema },
      },
      getAgentDataHandler
    );

  // upgrade agent
  router.versioned
    .post({
      access: 'public',
      path: AGENT_API_ROUTES.UPGRADE_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: PostAgentUpgradeRequestSchema },
      },
      postAgentUpgradeHandler
    );
  // bulk upgrade
  router.versioned
    .post({
      access: 'public',
      path: AGENT_API_ROUTES.BULK_UPGRADE_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: PostBulkAgentUpgradeRequestSchema },
      },
      postBulkAgentsUpgradeHandler
    );

  // Current actions
  router.versioned
    .get({
      access: 'public',
      path: AGENT_API_ROUTES.ACTION_STATUS_PATTERN,

      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: GetActionStatusRequestSchema },
      },
      getActionStatusHandler
    );

  // Bulk reassign
  router.versioned
    .post({
      access: 'public',
      path: AGENT_API_ROUTES.BULK_REASSIGN_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: PostBulkAgentReassignRequestSchema },
      },
      postBulkAgentsReassignHandler
    );

  // Bulk unenroll
  router.versioned
    .post({
      access: 'public',
      path: AGENT_API_ROUTES.BULK_UNENROLL_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: { request: PostBulkAgentUnenrollRequestSchema },
      },
      postBulkAgentsUnenrollHandler
    );

  // Available versions for upgrades
  router.versioned
    .get({
      access: 'public',
      path: AGENT_API_ROUTES.AVAILABLE_VERSIONS_PATTERN,
      fleetAuthz: {
        fleet: { all: true },
      },
    })
    .addVersion(
      {
        version: OLDEST_PUBLIC_VERSION,
        validate: false,
      },
      getAvailableVersionsHandler
    );
};
