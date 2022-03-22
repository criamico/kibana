/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect, useState } from 'react';
import {
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButtonEmpty,
  EuiFlyoutFooter,
} from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';

import {
  useGetSettings,
  sendGetOneAgentPolicy,
  useFleetStatus,
  useAgentEnrollmentFlyoutData,
} from '../../hooks';
import { FLEET_SERVER_PACKAGE } from '../../constants';
import type { PackagePolicy } from '../../types';

import { Loading } from '..';

import { ManagedInstructions } from './managed_instructions';
import { StandaloneInstructions } from './standalone_instructions';
import { MissingFleetServerHostCallout } from './missing_fleet_server_host_callout';
import type { BaseProps } from './types';

type FlyoutMode = 'managed' | 'standalone';

export interface Props extends BaseProps {
  onClose: () => void;
  defaultMode?: FlyoutMode;
}

export * from './agent_policy_selection';
export * from './agent_policy_select_create';
export * from './managed_instructions';
export * from './standalone_instructions';
export * from './steps';

export const AgentEnrollmentFlyout: React.FunctionComponent<Props> = ({
  onClose,
  agentPolicy,
  viewDataStep,
  defaultMode = 'managed',
}) => {
  const [mode, setMode] = useState<FlyoutMode>(defaultMode);

  const settings = useGetSettings();
  const fleetServerHosts = settings.data?.item?.fleet_server_hosts || [];

  const fleetStatus = useFleetStatus();
  const [policyId, setSelectedPolicyId] = useState(agentPolicy?.id);
  console.log('agentPolicy', policyId);
  const [isFleetServerPolicySelected, setIsFleetServerPolicySelected] = useState<boolean>(false);

  const {
    agentPolicies,
    isLoadingInitialAgentPolicies,
    isLoadingAgentPolicies,
    refreshAgentPolicies,
  } = useAgentEnrollmentFlyoutData();

  useEffect(() => {
    async function checkPolicyIsFleetServer() {
      if (policyId && setIsFleetServerPolicySelected) {
        const agentPolicyRequest = await sendGetOneAgentPolicy(policyId);
        if (
          agentPolicyRequest.data?.item &&
          (agentPolicyRequest.data.item.package_policies as PackagePolicy[]).some(
            (packagePolicy) => packagePolicy.package?.name === FLEET_SERVER_PACKAGE
          )
        ) {
          setIsFleetServerPolicySelected(true);
        } else {
          setIsFleetServerPolicySelected(false);
        }
      }
    }

    checkPolicyIsFleetServer();
  }, [policyId]);

  const isLoadingInitialRequest = settings.isLoading && settings.isInitialRequest;

  return (
    <EuiFlyout data-test-subj="agentEnrollmentFlyout" onClose={onClose} size="m">
      <EuiFlyoutHeader hasBorder aria-labelledby="FleetAgentEnrollmentFlyoutTitle">
        <EuiTitle size="m">
          <h2 id="FleetAgentEnrollmentFlyoutTitle">
            <FormattedMessage
              id="xpack.fleet.agentEnrollment.flyoutTitle"
              defaultMessage="Add agent"
            />
          </h2>
        </EuiTitle>
        <EuiSpacer size="l" />
        <EuiText>
          <FormattedMessage
            id="xpack.fleet.agentEnrollment.agentDescription"
            defaultMessage="Add Elastic Agents to your hosts to collect data and send it to the Elastic Stack."
          />
        </EuiText>
      </EuiFlyoutHeader>
      <EuiFlyoutBody
        banner={
          fleetStatus.isReady &&
          !isLoadingInitialRequest &&
          fleetServerHosts.length === 0 &&
          mode === 'managed' ? (
            <MissingFleetServerHostCallout />
          ) : undefined
        }
      >
        {isLoadingInitialAgentPolicies ? (
          <Loading />
        ) : mode === 'managed' ? (
          <ManagedInstructions
            settings={settings.data?.item}
            policyId={policyId}
            setSelectedPolicyId={setSelectedPolicyId}
            agentPolicy={agentPolicy}
            agentPolicies={agentPolicies}
            viewDataStep={viewDataStep}
            isFleetServerPolicySelected={isFleetServerPolicySelected}
            refreshAgentPolicies={refreshAgentPolicies}
            isLoadingAgentPolicies={isLoadingAgentPolicies}
            mode={mode}
            setMode={setMode}
            onClickViewAgents={onClose}
          />
        ) : (
          <StandaloneInstructions
            agentPolicy={agentPolicy}
            policyId={policyId}
            setSelectedPolicyId={setSelectedPolicyId}
            agentPolicies={agentPolicies}
            refreshAgentPolicies={refreshAgentPolicies}
            mode={mode}
            setMode={setMode}
            onClickViewAgents={onClose}
          />
        )}
      </EuiFlyoutBody>
      <EuiFlyoutFooter>
        <EuiFlexGroup justifyContent="flexStart">
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty onClick={onClose}>
              <FormattedMessage
                id="xpack.fleet.agentEnrollment.closeFlyoutButtonLabel"
                defaultMessage="Close"
              />
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlyoutFooter>
    </EuiFlyout>
  );
};
