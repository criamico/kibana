/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  EuiText,
  EuiButton,
  EuiSpacer,
  EuiRadioGroup,
  EuiLink,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCodeBlock,
  EuiCopy,
  EuiCode,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';
import { i18n } from '@kbn/i18n';
import semverMajor from 'semver/functions/major';
import semverMinor from 'semver/functions/minor';
import semverPatch from 'semver/functions/patch';

import type { AgentPolicy } from '../../types';
import { useKibanaVersion } from '../../hooks';
import type { GetOneEnrollmentAPIKeyResponse } from '../../../common/types/rest_spec/enrollment_api_key';

import { ManualInstructions } from '../enrollment_instructions';
import type { CommandsByPlatform } from '../../applications/fleet/sections/agents/agent_requirements_page/components/install_command_utils';
import { PlatformSelector } from '../enrollment_instructions/manual/platform_selector';

import type { InstalledIntegrationPolicy } from '../../hooks';

import type { FlyoutMode } from './types';

import { AdvancedAgentAuthenticationSettings } from './advanced_agent_authentication_settings';
import { SelectCreateAgentPolicy } from './agent_policy_select_create';

import { ConfirmAgentEnrollment } from './confirm_agent_enrollment';
import { ConfirmIncomingData } from './confirm_incoming_data';

export const DownloadStep = (hasFleetServer: boolean) => {
  const kibanaVersion = useKibanaVersion();
  const kibanaVersionURLString = useMemo(
    () =>
      `${semverMajor(kibanaVersion)}-${semverMinor(kibanaVersion)}-${semverPatch(kibanaVersion)}`,
    [kibanaVersion]
  );
  const title = hasFleetServer
    ? i18n.translate('xpack.fleet.agentEnrollment.stepDownloadAgentForFleetServerTitle', {
        defaultMessage: 'Download the Fleet Server to a centralized host',
      })
    : i18n.translate('xpack.fleet.agentEnrollment.stepDownloadAgentTitle', {
        defaultMessage: 'Download the Elastic Agent to your host',
      });
  const downloadDescription = hasFleetServer ? (
    <FormattedMessage
      id="xpack.fleet.agentEnrollment.downloadDescriptionForFleetServer"
      defaultMessage="Fleet Server runs on an Elastic Agent. Install this agent on a centralized host so that other hosts you wish to monitor can connect to it. In production, we recommend using one or more dedicated hosts. You can download the Elastic Agent binaries and verification signatures from Elastic’s download page."
    />
  ) : (
    <FormattedMessage
      id="xpack.fleet.agentEnrollment.downloadDescription"
      defaultMessage="Install the Elastic Agent on the hosts you wish to monitor. Do not install this agent policy on a host containing Fleet Server. You can download the Elastic Agent binaries and verification signatures from Elastic’s download page."
    />
  );
  return {
    title,
    children: (
      <>
        <EuiText>{downloadDescription}</EuiText>
        <EuiSpacer size="s" />
        <EuiText size="s">
          <FormattedMessage
            id="xpack.fleet.agentEnrollment.downloadUseLinuxInstaller"
            defaultMessage="Linux users: We recommend the installer (TAR) over system packages (RPM/DEB) because it lets you upgrade your agent in Fleet."
          />
        </EuiText>
        <EuiSpacer size="l" />
        <EuiButton
          href={`https://www.elastic.co/downloads/past-releases/elastic-agent-${kibanaVersionURLString}`}
          target="_blank"
          iconSide="right"
          iconType="popout"
        >
          <FormattedMessage
            id="xpack.fleet.agentEnrollment.downloadLink"
            defaultMessage="Go to download page"
          />
        </EuiButton>
      </>
    ),
  };
};

export const AgentPolicySelectionStep = ({
  agentPolicies,
  selectedPolicy,
  setSelectedPolicy,
  selectedApiKeyId,
  setSelectedAPIKeyId,
  excludeFleetServer,
  refreshAgentPolicies,
}: {
  agentPolicies: AgentPolicy[];
  selectedPolicy?: AgentPolicy;
  setSelectedPolicy?: (agentPolicy?: AgentPolicy) => void;
  selectedApiKeyId?: string;
  setSelectedAPIKeyId?: (key?: string) => void;
  excludeFleetServer?: boolean;
  refreshAgentPolicies: () => void;
}) => {
  // storing the created agent policy id as the child component is being recreated
  const [policyId, setPolicyId] = useState<string | undefined>(selectedPolicy?.id);
  const findPolicyById = (policies: AgentPolicy[], id: string) => policies.find((p) => p.id === id);

  const regularAgentPolicies = useMemo(() => {
    return agentPolicies.filter(
      (policy) =>
        policy && !policy.is_managed && (!excludeFleetServer || !policy.is_default_fleet_server)
    );
  }, [agentPolicies, excludeFleetServer]);

  const onAgentPolicyChange = useCallback(
    async (key?: string, policy?: AgentPolicy) => {
      if (policy) {
        refreshAgentPolicies();
      }
      if (setSelectedPolicy && key) {
        const agentPolicy = findPolicyById(agentPolicies, key);
        setSelectedPolicy(agentPolicy);
        setPolicyId(key);
      }
    },
    [setSelectedPolicy, refreshAgentPolicies, agentPolicies]
  );
  return {
    title: i18n.translate('xpack.fleet.agentEnrollment.stepChooseAgentPolicyTitle', {
      defaultMessage: 'What type of host are you adding?',
    }),
    children: (
      <>
        <SelectCreateAgentPolicy
          agentPolicies={regularAgentPolicies}
          withKeySelection={setSelectedAPIKeyId ? true : false}
          selectedApiKeyId={selectedApiKeyId}
          onKeyChange={setSelectedAPIKeyId}
          onAgentPolicyChange={onAgentPolicyChange}
          excludeFleetServer={excludeFleetServer}
          policyId={policyId}
        />
      </>
    ),
  };
};

export const AgentEnrollmentKeySelectionStep = ({
  agentPolicy,
  selectedApiKeyId,
  setSelectedAPIKeyId,
}: {
  agentPolicy: AgentPolicy;
  selectedApiKeyId?: string;
  setSelectedAPIKeyId: (key?: string) => void;
}) => {
  return {
    title: i18n.translate('xpack.fleet.agentEnrollment.stepConfigurePolicyAuthenticationTitle', {
      defaultMessage: 'Select enrollment token',
    }),
    children: (
      <>
        <EuiText>
          <FormattedMessage
            id="xpack.fleet.agentEnrollment.agentAuthenticationSettings"
            defaultMessage="{agentPolicyName} has been selected. Select which enrollment token to use when enrolling agents."
            values={{
              agentPolicyName: <strong>{agentPolicy.name}</strong>,
            }}
          />
        </EuiText>
        <EuiSpacer size="l" />
        <AdvancedAgentAuthenticationSettings
          agentPolicyId={agentPolicy.id}
          selectedApiKeyId={selectedApiKeyId}
          initialAuthenticationSettingsOpen
          onKeyChange={setSelectedAPIKeyId}
        />
      </>
    ),
  };
};

export const InstallationModeSelectionStep = ({
  mode,
  setMode,
}: {
  mode: FlyoutMode;
  setMode: (v: FlyoutMode) => void;
}) => {
  // radio id has to be unique so that the component works even if appears twice in DOM
  const radioSuffix = useMemo(() => Date.now(), []);

  const onChangeCallback = useCallback(
    (v: string) => {
      const value = v.split('_')[0];
      if (value === 'managed' || value === 'standalone') {
        setMode(value);
      }
    },
    [setMode]
  );
  return {
    title: i18n.translate('xpack.fleet.agentEnrollment.stepInstallType', {
      defaultMessage: 'Enroll in Fleet?',
    }),
    children: (
      <EuiRadioGroup
        options={[
          {
            id: `managed_${radioSuffix}`,
            label: (
              <FormattedMessage
                id="xpack.fleet.agentFlyout.managedRadioOption"
                defaultMessage="{managed} – Enroll in Elastic Agent in Fleet to automatically deploy updates and centrally manage the agent."
                values={{
                  managed: (
                    <strong>
                      <FormattedMessage
                        id="xpack.fleet.agentFlyout.managedMessage"
                        defaultMessage="Enroll in Fleet (recommended)"
                      />
                    </strong>
                  ),
                }}
              />
            ),
          },
          {
            id: `standalone_${radioSuffix}`,
            label: (
              <FormattedMessage
                id="xpack.fleet.agentFlyout.standaloneRadioOption"
                defaultMessage="{standaloneMessage} – Run an Elastic Agent standalone to configure and update the agent manually on the host where the agent is installed."
                values={{
                  standaloneMessage: (
                    <strong>
                      <FormattedMessage
                        id="xpack.fleet.agentFlyout.standaloneMessage"
                        defaultMessage="Run standalone"
                      />
                    </strong>
                  ),
                }}
              />
            ),
          },
        ]}
        idSelected={`${mode}_${radioSuffix}`}
        onChange={onChangeCallback}
        name={`radio group ${radioSuffix}`}
      />
    ),
  };
};

export const InstallManagedAgentStep = ({
  selectedApiKeyId,
  apiKeyData,
  fleetServerHosts,
}: {
  fleetServerHosts: string[];
  selectedApiKeyId?: string;
  apiKeyData?: GetOneEnrollmentAPIKeyResponse | null;
}) => {
  return {
    title: i18n.translate('xpack.fleet.agentEnrollment.stepEnrollAndRunAgentTitle', {
      defaultMessage: 'Install Elastic Agent on your host',
    }),
    children: selectedApiKeyId && apiKeyData && (
      <ManualInstructions apiKey={apiKeyData.item} fleetServerHosts={fleetServerHosts} />
    ),
  };
};

export const ConfigureStandaloneAgentStep = ({
  isK8s,
  selectedPolicyId,
  yaml,
  downloadLink,
}: {
  isK8s: string;
  selectedPolicyId?: string;
  yaml: string;
  downloadLink: string;
}) => {
  const policyMsg =
    isK8s === 'IS_KUBERNETES' ? (
      <FormattedMessage
        id="xpack.fleet.agentEnrollment.stepConfigureAgentDescriptionk8s"
        defaultMessage="Copy or download the Kubernetes manifest inside the Kubernetes cluster. Modify {ESUsernameVariable} and {ESPasswordVariable} in the Daemonset environment variables and apply the manifest."
        values={{
          ESUsernameVariable: <EuiCode>ES_USERNAME</EuiCode>,
          ESPasswordVariable: <EuiCode>ES_PASSWORD</EuiCode>,
        }}
      />
    ) : (
      <FormattedMessage
        id="xpack.fleet.agentEnrollment.stepConfigureAgentDescription"
        defaultMessage="Copy this policy to the {fileName} on the host where the Elastic Agent is installed. Modify {ESUsernameVariable} and {ESPasswordVariable} in the {outputSection} section of {fileName} to use your Elasticsearch credentials."
        values={{
          fileName: <EuiCode>elastic-agent.yml</EuiCode>,
          ESUsernameVariable: <EuiCode>ES_USERNAME</EuiCode>,
          ESPasswordVariable: <EuiCode>ES_PASSWORD</EuiCode>,
          outputSection: <EuiCode>outputs</EuiCode>,
        }}
      />
    );

  const downloadMsg =
    isK8s === 'IS_KUBERNETES' ? (
      <FormattedMessage
        id="xpack.fleet.agentEnrollment.downloadPolicyButtonk8s"
        defaultMessage="Download Manifest"
      />
    ) : (
      <FormattedMessage
        id="xpack.fleet.agentEnrollment.downloadPolicyButton"
        defaultMessage="Download Policy"
      />
    );
  return {
    title: i18n.translate('xpack.fleet.agentEnrollment.stepConfigureAgentTitle', {
      defaultMessage: 'Configure the agent',
    }),
    children: (
      <>
        <EuiText>
          <>{policyMsg}</>
          <EuiSpacer size="m" />
          <EuiFlexGroup gutterSize="m">
            <EuiFlexItem grow={false}>
              <EuiCopy textToCopy={yaml}>
                {(copy) => (
                  <EuiButton onClick={copy} iconType="copyClipboard">
                    <FormattedMessage
                      id="xpack.fleet.agentEnrollment.copyPolicyButton"
                      defaultMessage="Copy to clipboard"
                    />
                  </EuiButton>
                )}
              </EuiCopy>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton iconType="download" href={downloadLink} isDisabled={!downloadLink}>
                <>{downloadMsg}</>
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="m" />
          <EuiCodeBlock language="yaml" style={{ maxHeight: 300 }} fontSize="m">
            {yaml}
          </EuiCodeBlock>
        </EuiText>
      </>
    ),
  };
};

export const InstallStandaloneAgentStep = ({
  installCommand,
  isK8s,
  selectedPolicyId,
  downloadLink,
}: {
  installCommand: CommandsByPlatform;
  isK8s: string;
  downloadLink: string;
  selectedPolicyId?: string;
}) => {
  const link1 = '';

  return {
    title: i18n.translate('xpack.fleet.agentEnrollment.stepEnrollAndRunAgentTitle', {
      defaultMessage: 'Install Elastic Agent on your host',
    }),
    children: (
      <>
        <EuiText>
          <FormattedMessage
            id="xpack.fleet.enrollmentInstructions.troubleshootingText"
            defaultMessage="Select the appropriate platform and run commands to install, enroll, and start Elastic Agent. Reuse commands to set up agents on more than one host. For aarch64, see our {link1}. For additional guidance, see our {downloadLink}."
            values={{
              link1: (
                <EuiLink target="_blank" external href={link1}>
                  <FormattedMessage
                    id="xpack.fleet.enrollmentInstructions.downloadLink"
                    defaultMessage="downloads page"
                  />
                </EuiLink>
              ),
              downloadLink: (
                <EuiLink target="_blank" external href={downloadLink}>
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
          linuxCommand={installCommand.linux}
          macCommand={installCommand.mac}
          windowsCommand={installCommand.windows}
          linuxDebCommand={installCommand.deb}
          linuxRpmCommand={installCommand.rpm}
          isK8s={isK8s === 'IS_KUBERNETES'}
        />
      </>
    ),
  };
};

export const AgentEnrollmentConfirmationStep = ({
  selectedPolicyId,
  onClickViewAgents,
  troubleshootLink,
}: {
  selectedPolicyId?: string;
  onClickViewAgents: () => void;
  troubleshootLink: string;
}) => {
  return {
    title: i18n.translate('xpack.fleet.agentEnrollment.stepAgentEnrollmentConfirmation', {
      defaultMessage: 'Confirm agent Enrollment',
    }),
    children: (
      <ConfirmAgentEnrollment
        policyId={selectedPolicyId}
        onClickViewAgents={onClickViewAgents}
        troubleshootLink={troubleshootLink}
      />
    ),
  };
};

export const IncomingDataConfirmationStep = ({
  agentsIds,
  installedPolicy,
}: {
  agentsIds: string[];
  installedPolicy?: InstalledIntegrationPolicy;
}) => {
  return {
    title: i18n.translate('xpack.fleet.agentEnrollment.stepConfirmIncomingData', {
      defaultMessage: 'Confirm incoming data',
    }),
    children: <ConfirmIncomingData agentsIds={agentsIds} installedPolicy={installedPolicy} />,
  };
};
