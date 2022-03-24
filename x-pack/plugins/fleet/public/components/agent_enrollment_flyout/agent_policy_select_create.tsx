/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState, useCallback, useEffect } from 'react';

import type { AgentPolicyCreateState } from '../../applications/fleet/sections/agents/components';
import {
  AgentPolicyCreatedCallOut,
  CREATE_STATUS,
} from '../../applications/fleet/sections/agents/components';
import { AgentPolicyCreateInlineForm } from '../../applications/fleet/sections/agent_policy/components';
import type { AgentPolicy } from '../../types';
import { incrementPolicyName } from '../../services';

import { AgentPolicySelection } from '.';

interface Props {
  agentPolicies: AgentPolicy[];
  selectedPolicy: AgentPolicy;
  setSelectedPolicyId: (agentPolicyId?: string) => void;
  excludeFleetServer?: boolean;
  onAgentPolicyChange: (key?: string, policy?: AgentPolicy) => void;
  withKeySelection: boolean;
  selectedApiKeyId?: string;
  onKeyChange?: (key?: string) => void;
  isFleetServerPolicy?: boolean;
}

export const SelectCreateAgentPolicy: React.FC<Props> = ({
  agentPolicies,
  excludeFleetServer,
  setSelectedPolicyId,
  selectedPolicy,
  onAgentPolicyChange,
  withKeySelection,
  selectedApiKeyId,
  onKeyChange,
  isFleetServerPolicy,
}) => {
  const [showCreatePolicy, setShowCreatePolicy] = useState(agentPolicies.length === 0);

  const [createState, setCreateState] = useState<AgentPolicyCreateState>({
    status: CREATE_STATUS.INITIAL,
  });

  const [newName, setNewName] = useState(incrementPolicyName(agentPolicies, isFleetServerPolicy));

  useEffect(() => {
    setShowCreatePolicy(agentPolicies.length === 0);
    setNewName(incrementPolicyName(agentPolicies, isFleetServerPolicy));
  }, [agentPolicies, isFleetServerPolicy]);

  const onAgentPolicyCreated = useCallback(
    async (policy: AgentPolicy | null, errorMessage?: JSX.Element) => {
      if (!policy) {
        setCreateState({ status: CREATE_STATUS.FAILED, errorMessage });
        return;
      }
      setShowCreatePolicy(false);
      setCreateState({ status: CREATE_STATUS.CREATED });
      if (onAgentPolicyChange) {
        onAgentPolicyChange(policy.id, policy!);
      }
      setSelectedPolicyId(policy.id);
    },
    [setSelectedPolicyId, onAgentPolicyChange]
  );

  const onClickCreatePolicy = () => {
    setCreateState({ status: CREATE_STATUS.INITIAL });
    setShowCreatePolicy(true);
    if (withKeySelection && onKeyChange) {
      onKeyChange(undefined);
    }
  };

  return (
    <>
      {showCreatePolicy ? (
        <AgentPolicyCreateInlineForm
          updateAgentPolicy={onAgentPolicyCreated}
          isFleetServerPolicy={isFleetServerPolicy}
          agentPolicyName={newName}
        />
      ) : (
        <AgentPolicySelection
          agentPolicies={agentPolicies}
          withKeySelection={withKeySelection}
          selectedApiKeyId={selectedApiKeyId}
          onKeyChange={onKeyChange}
          excludeFleetServer={excludeFleetServer}
          onClickCreatePolicy={onClickCreatePolicy}
          selectedPolicy={selectedPolicy}
          setSelectedPolicyId={setSelectedPolicyId}
          isFleetServerPolicy={isFleetServerPolicy}
        />
      )}
      {createState.status !== CREATE_STATUS.INITIAL && (
        <AgentPolicyCreatedCallOut createState={createState} />
      )}
    </>
  );
};
