/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState, useMemo } from 'react';
import { EuiSteps, EuiLink, EuiText, EuiSpacer } from '@elastic/eui';
import type { EuiContainedStepProps } from '@elastic/eui/src/components/steps/steps';
import { FormattedMessage } from '@kbn/i18n-react';

import {
  useGetOneEnrollmentAPIKey,
  useLink,
  useFleetStatus,
  useGetAgents,
  useStartServices,
} from '../../hooks';

import {
  deploymentModeStep,
  ServiceTokenStep,
  FleetServerCommandStep,
  useFleetServerInstructions,
  addFleetServerHostStep,
} from '../../applications/fleet/sections/agents/agent_requirements_page/components';
import { FleetServerRequirementPage } from '../../applications/fleet/sections/agents/agent_requirements_page';

import { policyHasFleetServer } from '../../applications/fleet/sections/agents/services/has_fleet_server';

import { FLEET_SERVER_PACKAGE } from '../../constants';

import {
  InstallationModeSelectionStep,
  AgentPolicySelectionStep,
  AgentEnrollmentKeySelectionStep,
  AgentEnrollmentConfirmationStep,
  InstallManagedAgentStep,
} from './steps';
import type { InstructionProps } from './types';

const DefaultMissingRequirements = () => {
  const { getHref } = useLink();

  return (
    <>
      <FormattedMessage
        id="xpack.fleet.agentEnrollment.agentsNotInitializedText"
        defaultMessage="Before enrolling agents, {link}."
        values={{
          link: (
            <EuiLink href={getHref('overview')}>
              <FormattedMessage
                id="xpack.fleet.agentEnrollment.setUpAgentsLink"
                defaultMessage="set up central management for Elastic Agents"
              />
            </EuiLink>
          ),
        }}
      />
    </>
  );
};

const FleetServerMissingRequirements = () => {
  return <FleetServerRequirementPage />;
};

export const ManagedInstructions = React.memo<InstructionProps>(
  ({
    agentPolicy,
    agentPolicies,
    policyId,
    setSelectedPolicyId,
    isFleetServerPolicySelected,
    settings,
    refreshAgentPolicies,
    isLoadingAgentPolicies,
    mode,
    setMode,
    onClickViewAgents,
  }) => {
    const fleetStatus = useFleetStatus();
    const { docLinks } = useStartServices();
    const link = docLinks.links.fleet.troubleshooting;
    const [selectedApiKeyId, setSelectedAPIKeyId] = useState<string | undefined>();

    const apiKey = useGetOneEnrollmentAPIKey(selectedApiKeyId);
    const fleetServerInstructions = useFleetServerInstructions(apiKey?.data?.item?.policy_id);

    const { data: agents, isLoading: isLoadingAgents } = useGetAgents({
      page: 1,
      perPage: 1000,
      showInactive: false,
    });

    const fleetServers = useMemo(() => {
      const fleetServerAgentPolicies: string[] = agentPolicies
        .filter((pol) => policyHasFleetServer(pol))
        .map((pol) => pol.id);
      return (agents?.items ?? []).filter((agent) =>
        fleetServerAgentPolicies.includes(agent.policy_id ?? '')
      );
    }, [agents, agentPolicies]);

    const fleetServerSteps = useMemo(() => {
      const {
        serviceToken,
        getServiceToken,
        isLoadingServiceToken,
        installCommand,
        platform,
        setPlatform,
        deploymentMode,
        setDeploymentMode,
        addFleetServerHost,
      } = fleetServerInstructions;

      return [
        deploymentModeStep({ deploymentMode, setDeploymentMode }),
        addFleetServerHostStep({ addFleetServerHost }),
        ServiceTokenStep({ serviceToken, getServiceToken, isLoadingServiceToken }),
        FleetServerCommandStep({ serviceToken, installCommand, platform, setPlatform }),
      ];
    }, [fleetServerInstructions]);

    const steps = useMemo(() => {
      const fleetServerHosts = settings?.fleet_server_hosts || [];
      console.log('MANAGED agentPolicy', agentPolicy);
      console.log('MANAGED policyId,', policyId);
      const baseSteps: EuiContainedStepProps[] = [
        !agentPolicy
          ? AgentPolicySelectionStep({
              agentPolicies,
              selectedApiKeyId,
              setSelectedAPIKeyId,
              setSelectedPolicyId,
              refreshAgentPolicies,
            })
          : AgentEnrollmentKeySelectionStep({ agentPolicy, selectedApiKeyId, setSelectedAPIKeyId }),

        InstallationModeSelectionStep({ mode, setMode }),
      ];

      if (isFleetServerPolicySelected) {
        baseSteps.push(...fleetServerSteps);
      } else {
        baseSteps.push(
          InstallManagedAgentStep({
            apiKeyData: apiKey?.data,
            selectedApiKeyId,
            fleetServerHosts,
          })
        );
      }
      baseSteps.push(
        AgentEnrollmentConfirmationStep({
          policyId,
          onClickViewAgents,
          troubleshootLink: link,
        })
      );

      return baseSteps;
    }, [
      agentPolicy,
      selectedApiKeyId,
      policyId,
      setSelectedPolicyId,
      setSelectedAPIKeyId,
      agentPolicies,
      refreshAgentPolicies,
      apiKey.data,
      fleetServerSteps,
      isFleetServerPolicySelected,
      settings?.fleet_server_hosts,
      mode,
      setMode,
      link,
      onClickViewAgents,
    ]);

    if (fleetStatus.isReady && settings?.fleet_server_hosts.length === 0) {
      return null;
    }

    if (
      fleetStatus.isReady &&
      (isLoadingAgents || isLoadingAgentPolicies || fleetServers.length > 0)
    ) {
      return (
        <>
          <EuiText>
            <FormattedMessage
              id="xpack.fleet.agentEnrollment.managedDescription"
              defaultMessage="Enroll an Elastic Agent in Fleet to automatically deploy updates and centrally manage the agent."
            />
          </EuiText>
          <EuiSpacer size="l" />
          <EuiSteps steps={steps} />
        </>
      );
    }

    const showFleetMissingRequirements =
      fleetServers.length === 0 ||
      (fleetStatus.missingRequirements ?? []).some((r) => r === FLEET_SERVER_PACKAGE);

    return (
      <>
        {showFleetMissingRequirements ? (
          <FleetServerMissingRequirements />
        ) : (
          <DefaultMissingRequirements />
        )}
      </>
    );
  }
);
