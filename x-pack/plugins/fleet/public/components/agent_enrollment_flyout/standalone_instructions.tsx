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

import { safeDump } from 'js-yaml';

import type { CommandsByPlatform } from '../../applications/fleet/sections/agents/agent_requirements_page/components/install_command_utils';

import {
  useStartServices,
  sendGetOneAgentPolicy,
  useKibanaVersion,
  sendGetOneAgentPolicyFull,
} from '../../hooks';

import type { PackagePolicy } from '../../../common';

import { FLEET_KUBERNETES_PACKAGE } from '../../../common';

import { fullAgentPolicyToYaml } from '../../services';

import { agentPolicyRouteService } from '../../services';

import type { FullAgentPolicy } from '../../../common/types/models/agent_policy';

import {
  AgentPolicySelectionStep,
  InstallationModeSelectionStep,
  AgentEnrollmentConfirmationStep,
  InstallStandaloneAgentStep,
  IncomingDataConfirmationStep,
  ConfigureStandaloneAgentStep,
} from './steps';
import type { InstructionProps } from './types';

export const StandaloneInstructions = React.memo<InstructionProps>(
  ({
    agentPolicy,
    selectedPolicy,
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
    const [fullAgentPolicy, setFullAgentPolicy] = useState<FullAgentPolicy | undefined>();
    const [yaml, setYaml] = useState<any | undefined>('');
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

    let downloadLink = '';

    if (agentPolicy?.id) {
      downloadLink =
        isK8s === 'IS_KUBERNETES'
          ? core.http.basePath.prepend(
              `${agentPolicyRouteService.getInfoFullDownloadPath(agentPolicy?.id)}?kubernetes=true`
            )
          : core.http.basePath.prepend(
              `${agentPolicyRouteService.getInfoFullDownloadPath(agentPolicy?.id)}?standalone=true`
            );
    }

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

    useEffect(() => {
      async function fetchFullPolicy() {
        try {
          if (!agentPolicy?.id) {
            return;
          }
          let query = { standalone: true, kubernetes: false };
          if (isK8s === 'IS_KUBERNETES') {
            query = { standalone: true, kubernetes: true };
          }
          const res = await sendGetOneAgentPolicyFull(agentPolicy?.id, query);
          if (res.error) {
            throw res.error;
          }

          if (!res.data) {
            throw new Error('No data while fetching full agent policy');
          }
          setFullAgentPolicy(res.data.item);
        } catch (error) {
          notifications.toasts.addError(error, {
            title: 'Error',
          });
        }
      }
      if (isK8s !== 'IS_LOADING') {
        fetchFullPolicy();
      }
    }, [agentPolicy, notifications.toasts, isK8s, core.http.basePath]);

    useEffect(() => {
      if (!fullAgentPolicy) {
        return;
      }
      if (isK8s === 'IS_KUBERNETES') {
        if (typeof fullAgentPolicy === 'object') {
          return;
        }
        setYaml(fullAgentPolicy);
      } else {
        if (typeof fullAgentPolicy === 'string') {
          return;
        }
        setYaml(fullAgentPolicyToYaml(fullAgentPolicy, safeDump));
      }
    }, [fullAgentPolicy, isK8s]);

    const steps = [
      !agentPolicy
        ? AgentPolicySelectionStep({
            agentPolicies,
            selectedPolicy,
            setSelectedPolicyId,
            excludeFleetServer: true,
            refreshAgentPolicies,
          })
        : undefined,
      InstallationModeSelectionStep({ mode, setMode }),
      ConfigureStandaloneAgentStep({
        isK8s,
        selectedPolicyId: agentPolicy?.id,
        yaml,
        downloadLink,
      }),
      InstallStandaloneAgentStep({
        installCommand,
        isK8s,
        selectedPolicyId: agentPolicy?.id,
        downloadLink,
      }),
      AgentEnrollmentConfirmationStep({
        selectedPolicyId: agentPolicy?.id,
        troubleshootLink: link,
        onClickViewAgents,
      }),
      agentPolicy
        ? IncomingDataConfirmationStep({
            agentsIds: [agentPolicy.id],
          })
        : undefined,
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
