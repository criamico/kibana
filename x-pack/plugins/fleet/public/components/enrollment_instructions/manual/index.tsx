/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { EuiText, EuiLink } from '@elastic/eui';

import { FormattedMessage } from '@kbn/i18n-react';

import { useKibanaVersion } from '../../../hooks';
import type { EnrollmentAPIKey } from '../../../types';

import { PlatformSelector } from './platform_selector';

interface Props {
  fleetServerHosts: string[];
  apiKey: EnrollmentAPIKey;
}

function getfleetServerHostsEnrollArgs(apiKey: EnrollmentAPIKey, fleetServerHosts: string[]) {
  return `--url=${fleetServerHosts[0]} --enrollment-token=${apiKey.api_key}`;
}

export const ManualInstructions: React.FunctionComponent<Props> = ({
  apiKey,
  fleetServerHosts,
}) => {
  const enrollArgs = getfleetServerHostsEnrollArgs(apiKey, fleetServerHosts);
  const kibanaVersion = useKibanaVersion();

  const linuxCommand = `curl -L -O https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-${kibanaVersion}-linux-x86_64.tar.gz
tar xzvf elastic-agent-${kibanaVersion}-linux-x86_64.tar.gz
cd elastic-agent-${kibanaVersion}-linux-x86_64
sudo ./elastic-agent install ${enrollArgs}`;

  const macCommand = `curl -L -O https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-${kibanaVersion}-darwin-x86_64.tar.gz
tar xzvf elastic-agent-${kibanaVersion}-darwin-x86_64.tar.gz
cd elastic-agent-${kibanaVersion}-darwin-x86_64
sudo ./elastic-agent install ${enrollArgs}`;

  const windowsCommand = `wget https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-${kibanaVersion}-windows-x86_64.zip -OutFile elastic-agent-${kibanaVersion}-windows-x86_64.zip
Expand-Archive .\elastic-agent-${kibanaVersion}-windows-x86_64.zip
.\\elastic-agent.exe install ${enrollArgs}`;

  const linuxDebCommand = `curl -L -O https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-${kibanaVersion}-amd64.deb
sudo dpkg -i elastic-agent-${kibanaVersion}-amd64.deb
sudo elastic-agent enroll ${enrollArgs} \nsudo systemctl enable elastic-agent \nsudo systemctl start elastic-agent`;

  const linuxRpmCommand = `curl -L -O https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-${kibanaVersion}-x86_64.rpm
sudo rpm -vi elastic-agent-${kibanaVersion}-x86_64.rpm
sudo elastic-agent enroll ${enrollArgs} \nsudo systemctl enable elastic-agent \nsudo systemctl start elastic-agent`;

  const link1 = '';
  const link2 = '';

  return (
    <>
      <EuiText>
        <FormattedMessage
          id="xpack.fleet.enrollmentInstructions.troubleshootingText"
          defaultMessage="Select the appropriate platform and run commands to install, enroll, and start Elastic Agent. Reuse commands to set up agents on more than one host. For aarch64, see our {link1}. For additional guidance, see our {link2}."
          values={{
            link1: (
              <EuiLink target="_blank" external href={link1}>
                <FormattedMessage
                  id="xpack.fleet.enrollmentInstructions.downloadLink"
                  defaultMessage="downloads page"
                />
              </EuiLink>
            ),
            link2: (
              <EuiLink target="_blank" external href={link2}>
                <FormattedMessage
                  id="xpack.fleet.enrollmentInstructions.installationLink"
                  defaultMessage="installation docs"
                />
              </EuiLink>
            ),
          }}
        />
      </EuiText>
      <PlatformSelector
        linuxCommand={linuxCommand}
        macCommand={macCommand}
        windowsCommand={windowsCommand}
        linuxDebCommand={linuxDebCommand}
        linuxRpmCommand={linuxRpmCommand}
        isK8s={false}
      />
    </>
  );
};
