/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import fetch from 'node-fetch';
import pRetry from 'p-retry';
import { OLDEST_INTERNAL_VERSION } from '@kbn/fleet-plugin/common/constants';
import { Logger } from '../../utils/create_logger';

export class ApmSynthtraceKibanaClient {
  private readonly logger: Logger;
  private target: string;

  constructor(options: { logger: Logger; target: string }) {
    this.logger = options.logger;
    this.target = options.target;
  }

  async fetchLatestApmPackageVersion() {
    this.logger.debug(`Fetching latest APM package version`);
    const fleetPackageApiUrl = `${this.target}/api/fleet/epm/packages/apm?prerelease=true`;
    const response = await fetch(fleetPackageApiUrl, {
      method: 'GET',
      headers: kibanaHeaders(),
    });

    const responseJson = await response.json();

    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch latest APM package version, received HTTP ${response.status} and message: ${responseJson.message}`
      );
    }

    const { latestVersion } = responseJson.item;

    return latestVersion as string;
  }

  async installApmPackage(packageVersion: string) {
    this.logger.debug(`Installing APM package ${packageVersion}`);

    const url = `${this.target}/api/fleet/epm/packages/apm/${packageVersion}`;
    const response = await pRetry(() => {
      return fetch(url, {
        method: 'POST',
        headers: kibanaHeaders(),
        body: '{"force":true}',
      });
    });

    const responseJson = await response.json();

    if (!responseJson.items) {
      throw new Error(
        `Failed to install APM package version ${packageVersion}, received HTTP ${response.status} and message: ${responseJson.message} for url ${url}`
      );
    }

    this.logger.info(`Installed APM package ${packageVersion}`);
  }
}

function kibanaHeaders() {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'kbn-xsrf': 'kibana',
    'Elastic-Api-Version': `${OLDEST_INTERNAL_VERSION}`,
  };
}
