/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EndpointActionGenerator } from '../../../../../../../common/endpoint/data_generators/endpoint_action_generator';
import type { HostInfo } from '../../../../../../../common/endpoint/types';
import type { AppContextTestRender } from '../../../../../../common/mock/endpoint';
import { createAppRootMockRenderer } from '../../../../../../common/mock/endpoint';
import { useGetEndpointDetails as _useGetEndpointDetails } from '../../../../../hooks/endpoint/use_get_endpoint_details';
import { useGetEndpointPendingActionsSummary } from '../../../../../hooks/response_actions/use_get_endpoint_pending_actions_summary';
import { mockEndpointDetailsApiResult } from '../../../../../pages/endpoint_hosts/store/mock_endpoint_result_list';
import { HeaderEndpointInfo } from './header_endpoint_info';
import { agentStatusGetHttpMock } from '../../../../../mocks';
import { waitFor } from '@testing-library/react';

jest.mock('../../../../../hooks/endpoint/use_get_endpoint_details');
jest.mock('../../../../../hooks/response_actions/use_get_endpoint_pending_actions_summary');

const useGetEndpointDetailsMock = _useGetEndpointDetails as jest.Mock;
const getPendingActions = useGetEndpointPendingActionsSummary as jest.Mock;

describe('Responder header endpoint info', () => {
  let render: () => ReturnType<AppContextTestRender['render']>;
  let renderResult: ReturnType<typeof render>;
  let mockedContext: AppContextTestRender;
  let endpointDetails: HostInfo;

  beforeEach(async () => {
    mockedContext = createAppRootMockRenderer();
    render = () =>
      (renderResult = mockedContext.render(<HeaderEndpointInfo endpointId={'1234'} />));
    endpointDetails = mockEndpointDetailsApiResult();
    useGetEndpointDetailsMock.mockReturnValue({ data: endpointDetails });
    getPendingActions.mockReturnValue({
      data: {
        data: [
          new EndpointActionGenerator('seed').generateAgentPendingActionsSummary({
            agent_id: '1234',
          }),
        ],
      },
    });
    const apiMock = agentStatusGetHttpMock(mockedContext.coreStart.http);
    render();
    await waitFor(() => {
      expect(apiMock.responseProvider.getAgentStatus).toHaveBeenCalled();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should show endpoint name', async () => {
    const name = await renderResult.findByTestId('responderHeaderHostName');
    expect(name.textContent).toBe(`${endpointDetails.metadata.host.name}`);
  });
  it('should show agent and isolation status', async () => {
    const agentStatus = await renderResult.findByTestId(
      'responderHeaderEndpointAgentIsolationStatus'
    );
    expect(agentStatus.textContent).toBe(`Healthy`);
  });
  it('should show last checkin time', async () => {
    const lastUpdated = await renderResult.findByTestId('responderHeaderLastSeen');
    expect(lastUpdated).toBeTruthy();
  });
  it('should show platform icon', async () => {
    const platformIcon = await renderResult.findByTestId('responderHeaderHostPlatformIcon');
    expect(platformIcon).toBeTruthy();
  });
});
