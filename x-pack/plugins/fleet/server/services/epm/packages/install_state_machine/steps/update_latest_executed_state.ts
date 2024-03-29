/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { SavedObjectsErrorHelpers } from '@kbn/core/server';

import { PACKAGES_SAVED_OBJECT_TYPE } from '../../../../../constants';

import { auditLoggingService } from '../../../../audit_logging';

import type { InstallContext } from '../_state_machine_package_install';

// Function invoked after each transition
export const updateLatestExecutedState = async (context: InstallContext) => {
  const { logger, savedObjectsClient, packageInstallContext, latestExecutedState } = context;
  const { packageInfo } = packageInstallContext;
  const { name: pkgName } = packageInfo;

  auditLoggingService.writeCustomSoAuditLog({
    action: 'update',
    id: pkgName,
    savedObjectType: PACKAGES_SAVED_OBJECT_TYPE,
  });
  try {
    return await savedObjectsClient.update(PACKAGES_SAVED_OBJECT_TYPE, pkgName, {
      latest_executed_state: latestExecutedState,
    });
  } catch (err) {
    if (!SavedObjectsErrorHelpers.isNotFoundError(err)) {
      logger.error(`failed to update package install state to: latest_executed_state  ${err}`);
    }
  }
};
