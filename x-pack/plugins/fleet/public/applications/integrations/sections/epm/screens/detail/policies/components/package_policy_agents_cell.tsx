/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState } from 'react';

import { EuiButton } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';

import { LinkedAgentCount, AddAgentHelpPopover } from '../../../../../../components';
import type { AgentPolicy } from '../../../../../../types';
import { policyHasFleetServer } from '../../../../../../services';
import { useAuthz, useMultipleAgentPolicies } from '../../../../../../hooks';

const AddAgentButton = ({
  onAddAgent,
  canAddAgents,
  withPopover,
}: {
  onAddAgent: () => void;
  canAddAgents: boolean;
  withPopover?: boolean;
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(true);
  const onAddAgentCloseHelp = () => {
    setIsHelpOpen(false);
    onAddAgent();
  };

  const button = (
    <EuiButton
      iconType="plusInCircle"
      data-test-subj="addAgentButton"
      onClick={onAddAgentCloseHelp}
      size="s"
      isDisabled={!canAddAgents}
    >
      <FormattedMessage
        id="xpack.fleet.epm.packageDetails.integrationList.addAgent"
        defaultMessage="Add agent"
      />
    </EuiButton>
  );
  return withPopover ? (
    <AddAgentHelpPopover
      button={button}
      isOpen={isHelpOpen}
      closePopover={() => setIsHelpOpen(false)}
    />
  ) : (
    <EuiButton
      iconType="plusInCircle"
      data-test-subj="addAgentButton"
      onClick={onAddAgent}
      size="s"
      isDisabled={!canAddAgents}
    >
      <FormattedMessage
        id="xpack.fleet.epm.packageDetails.integrationList.addAgent"
        defaultMessage="Add agent"
      />
    </EuiButton>
  );
};

export const PackagePolicyAgentsCell = ({
  agentPolicies,
  onAddAgent,
  hasHelpPopover = false,
}: {
  agentPolicies: AgentPolicy[];
  hasHelpPopover?: boolean;
  onAddAgent: () => void;
}) => {
  const { canUseMultipleAgentPolicies } = useMultipleAgentPolicies();

  const agentCount = agentPolicies.reduce((acc, curr) => {
    return (acc += curr?.agents || 0);
  }, 0);

  const canAddAgents = useAuthz().fleet.addAgents;
  const canAddFleetServers = useAuthz().fleet.addFleetServers;

  if (canUseMultipleAgentPolicies && agentCount > 0 && agentPolicies.length > 1) {
    return (
      <LinkedAgentCount
        count={agentCount}
        agentPolicyId={agentPolicies[0].id} // fix me
        className="eui-textTruncate"
      />
    ); // Build new component with agents count break down
  }

  if (!canUseMultipleAgentPolicies || (agentCount > 0 && agentPolicies.length === 1)) {
    const agentPolicy = agentPolicies[0];
    const canAddAgentsForPolicy = policyHasFleetServer(agentPolicy)
      ? canAddFleetServers
      : canAddAgents;
    if (agentCount > 0 || agentPolicy.is_managed)
      return (
        <LinkedAgentCount
          count={agentCount}
          agentPolicyId={agentPolicy.id}
          className="eui-textTruncate"
        />
      );
    else {
      <AddAgentButton onAddAgent={onAddAgent} canAddAgents={canAddAgentsForPolicy} />;
    }
  }
  // || agentPolicy.is_managed - handle case where some agent policies were managed and when some agent policies cannot add agents
  return (
    <AddAgentButton
      onAddAgent={onAddAgent}
      canAddAgents={canAddAgents && canAddFleetServers}
      withPopover={hasHelpPopover}
    />
  );
};
