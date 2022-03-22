/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState, useEffect } from 'react';
import { EuiSteps, EuiText, EuiSpacer } from '@elastic/eui';
import type { EuiContainedStepProps } from '@elastic/eui/src/components/steps/steps';

import { FormattedMessage } from '@kbn/i18n-react';

import type { CommandsByPlatform } from '../../applications/fleet/sections/agents/agent_requirements_page/components/install_command_utils';

import { useStartServices, sendGetOneAgentPolicy, useKibanaVersion } from '../../hooks';

import type { PackagePolicy } from '../../../common';

import { FLEET_KUBERNETES_PACKAGE } from '../../../common';

import {
  AgentPolicySelectionStep,
  InstallationModeSelectionStep,
  AgentEnrollmentConfirmationStep,
  InstallStandaloneAgentStep,
} from './steps';
import type { InstructionProps } from './types';

export const StandaloneInstructions = React.memo<InstructionProps>(
  ({
    agentPolicy,
    policyId,
    setSelectedPolicyId,
    agentPolicies,
    refreshAgentPolicies,
    mode,
    setMode,
    onClickViewAgents,
  }) => {
    const core = useStartServices();
    const { notifications } = core;

    const [isK8s, setIsK8s] = useState<'IS_LOADING' | 'IS_KUBERNETES' | 'IS_NOT_KUBERNETES'>(
      'IS_LOADING'
    );
    const kibanaVersion = useKibanaVersion();

    const KUBERNETES_RUN_INSTRUCTIONS = 'kubectl apply -f elastic-agent-standalone-kubernetes.yaml';

    const STANDALONE_RUN_INSTRUCTIONS_LINUX = `curl -L -O https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-${kibanaVersion}-linux-x86_64.tar.gz
tar xzvf elastic-agent-${kibanaVersion}-linux-x86_64.tar.gz
sudo ./elastic-agent install`;

    const STANDALONE_RUN_INSTRUCTIONS_MAC = `curl -L -O https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-${kibanaVersion}-darwin-x86_64.tar.gz
tar xzvf elastic-agent-${kibanaVersion}-darwin-x86_64.tar.gz
sudo ./elastic-agent install`;

    const STANDALONE_RUN_INSTRUCTIONS_WINDOWS = `wget https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-${kibanaVersion}-windows-x86_64.zip -OutFile elastic-agent-${kibanaVersion}-windows-x86_64.zip
Expand-Archive .\elastic-agent-${kibanaVersion}-windows-x86_64.zip
.\\elastic-agent.exe install`;

    const linuxDebCommand = `curl -L -O https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-${kibanaVersion}-amd64.deb
sudo dpkg -i elastic-agent-${kibanaVersion}-amd64.deb \nsudo systemctl enable elastic-agent \nsudo systemctl start elastic-agent`;

    const linuxRpmCommand = `curl -L -O https://artifacts.elastic.co/downloads/beats/elastic-agent/elastic-agent-${kibanaVersion}-x86_64.rpm
sudo rpm -vi elastic-agent-${kibanaVersion}-x86_64.rpm \nsudo systemctl enable elastic-agent \nsudo systemctl start elastic-agent`;

    const linuxCommand =
      isK8s === 'IS_KUBERNETES' ? KUBERNETES_RUN_INSTRUCTIONS : STANDALONE_RUN_INSTRUCTIONS_LINUX;
    const macCommand =
      isK8s === 'IS_KUBERNETES' ? KUBERNETES_RUN_INSTRUCTIONS : STANDALONE_RUN_INSTRUCTIONS_MAC;
    const windowsCommand =
      isK8s === 'IS_KUBERNETES' ? KUBERNETES_RUN_INSTRUCTIONS : STANDALONE_RUN_INSTRUCTIONS_WINDOWS;

    const installCommand: CommandsByPlatform = {
      linux: linuxCommand,
      mac: macCommand,
      windows: windowsCommand,
      deb: linuxDebCommand,
      rpm: linuxRpmCommand,
    };

    const { docLinks } = useStartServices();
    const link = docLinks.links.fleet.troubleshooting;
    console.log('STANDALONE agentPolicy', agentPolicy);
    console.log('STANDALONE policyId', policyId);

    useEffect(() => {
      async function checkifK8s() {
        if (!agentPolicy?.id) {
          return;
        }
        const agentPolicyRequest = await sendGetOneAgentPolicy(agentPolicy?.id);
        const agentPol = agentPolicyRequest.data ? agentPolicyRequest.data.item : null;

        if (!agentPol) {
          setIsK8s('IS_NOT_KUBERNETES');
          return;
        }
        const k8s = (pkg: PackagePolicy) => pkg.package?.name === FLEET_KUBERNETES_PACKAGE;
        setIsK8s(
          (agentPol.package_policies as PackagePolicy[]).some(k8s)
            ? 'IS_KUBERNETES'
            : 'IS_NOT_KUBERNETES'
        );
      }
      checkifK8s();
    }, [agentPolicy, notifications.toasts]);

    const steps = [
      !agentPolicy
        ? AgentPolicySelectionStep({
            agentPolicies,
            setSelectedPolicyId,
            excludeFleetServer: true,
            refreshAgentPolicies,
          })
        : undefined,
      InstallationModeSelectionStep({ mode, setMode }),
      InstallStandaloneAgentStep({ installCommand, isK8s, agentPolicyId: policyId }),
      AgentEnrollmentConfirmationStep({
        policyId,
        troubleshootLink: link,
        onClickViewAgents,
      }),
    ].filter(Boolean) as EuiContainedStepProps[];

    return (
      <>
        <EuiText>
          <FormattedMessage
            id="xpack.fleet.agentEnrollment.standaloneDescription"
            defaultMessage="Run an Elastic Agent standalone to configure and update the agent manually on the host where the agent is installed."
          />
        </EuiText>
        <EuiSpacer size="l" />
        <EuiSteps steps={steps} />
      </>
    );
  }
);
