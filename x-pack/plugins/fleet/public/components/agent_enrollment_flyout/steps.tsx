/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { EuiText, EuiButton, EuiSpacer, EuiRadioGroup, EuiLink } from '@elastic/eui';
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

import type { FlyoutMode } from './types';

import { AdvancedAgentAuthenticationSettings } from './advanced_agent_authentication_settings';
import { SelectCreateAgentPolicy } from './agent_policy_select_create';

import { ConfirmAgentEnrollment } from './confirm_agent_enrollment';

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
  setSelectedPolicyId,
  selectedApiKeyId,
  setSelectedAPIKeyId,
  excludeFleetServer,
  refreshAgentPolicies,
}: {
  agentPolicies: AgentPolicy[];
  setSelectedPolicyId?: (policyId?: string) => void;
  selectedApiKeyId?: string;
  setSelectedAPIKeyId?: (key?: string) => void;
  excludeFleetServer?: boolean;
  refreshAgentPolicies: () => void;
}) => {
  // storing the created agent policy id as the child component is being recreated
  const [policyId, setPolicyId] = useState<string | undefined>(undefined);
  // const findPolicyById = (policies: AgentPolicy[], id: string) => policies.find((p) => p.id === id);

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
      if (setSelectedPolicyId) {
        // const selectedPolicy = findPolicyById(agentPolicies, key);
        // setSelectedPolicy(selectedPolicy);
        // console.log('2', key, selectedPolicy);
      }
      setSelectedPolicyId(key);
      setPolicyId(key);
    },
    [setSelectedPolicyId, refreshAgentPolicies]
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

export const InstallStandaloneAgentStep = ({
  installCommand,
  isK8s,
}: {
  installCommand: CommandsByPlatform;
  isK8s: string;
}) => {
  const link1 = '';
  const link2 = '';
  return {
    title: i18n.translate('xpack.fleet.agentEnrollment.stepEnrollAndRunAgentTitle', {
      defaultMessage: 'Install Elastic Agent on your host',
    }),
    children: (
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
  policyId,
  onClickViewAgents,
  troubleshootLink,
}: {
  policyId?: string;
  onClickViewAgents: () => void;
  troubleshootLink: string;
}) => {
  return {
    title: i18n.translate('xpack.fleet.agentEnrollment.stepAgentEnrollmentConfirmation', {
      defaultMessage: 'Confirm agent Enrollment',
    }),
    children: (
      <ConfirmAgentEnrollment
        policyId={policyId}
        onClickViewAgents={onClickViewAgents}
        troubleshootLink={troubleshootLink}
      />
    ),
  };
};
