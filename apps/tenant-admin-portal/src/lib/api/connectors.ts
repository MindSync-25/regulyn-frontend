/**
 * Connector-service API Client
 *
 * Strict rules:
 * - Do NOT invent endpoints; mirrors services/connector-service controllers.
 * - Tenant scoped only from authenticated context (handled by http client).
 */

import { http } from './http';

// Local dev base URL (from connector-service application.yml)
// TODO: move to env config if/when frontend introduces per-service base URLs.
const CONNECTOR_API_BASE = 'http://localhost:8093';

export interface ConnectorResponse {
  connectorId: string;
  tenantId: string;
  connectorName: string;
  connectorType: string;
  status: string;
  baseUrl: string | null;
  authType: string | null;
  authRef: string | null;
  metadata: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface ListConnectorsParams {
  status?: string;
  type?: string;
  q?: string;
}

export async function listConnectors(params: ListConnectorsParams = {}): Promise<ConnectorResponse[]> {
  const search = new URLSearchParams();
  if (params.status) search.set('status', params.status);
  if (params.type) search.set('type', params.type);
  if (params.q) search.set('q', params.q);

  const suffix = search.toString() ? `?${search.toString()}` : '';
  return http.get<ConnectorResponse[]>(`/connectors${suffix}`, { baseUrl: CONNECTOR_API_BASE });
}

export async function getConnector(connectorId: string): Promise<ConnectorResponse> {
  return http.get<ConnectorResponse>(`/connectors/${encodeURIComponent(connectorId)}`, { baseUrl: CONNECTOR_API_BASE });
}

export const CONNECTOR_SERVICE_INFO = {
  baseUrl: CONNECTOR_API_BASE,
  note: 'Local dev base URL; access may require CONNECTOR_AGENT role.',
};
