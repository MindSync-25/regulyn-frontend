import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import * as api from './api';
import type { ListTenantsParams } from './types';

export function useTenantsListQuery(params: ListTenantsParams) {
  return useQuery({
    queryKey: ['platformTenants', params.page, params.size, params.status],
    queryFn: () => api.listTenants(params),
  });
}

export function useTenantDetailQuery(tenantId: string) {
  return useQuery({
    queryKey: ['platformTenant', tenantId],
    queryFn: () => api.getTenant(tenantId),
    enabled: !!tenantId,
  });
}

export function useActivateTenantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.activateTenant,
    onSuccess: (_, tenantId) => {
      toast.success('Tenant activated successfully');
      queryClient.invalidateQueries({ queryKey: ['platformTenants'] });
      queryClient.invalidateQueries({ queryKey: ['platformTenant', tenantId] });
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to activate tenant');
    },
  });
}

export function useSuspendTenantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.suspendTenant,
    onSuccess: (_, tenantId) => {
      toast.success('Tenant suspended successfully');
      queryClient.invalidateQueries({ queryKey: ['platformTenants'] });
      queryClient.invalidateQueries({ queryKey: ['platformTenant', tenantId] });
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to suspend tenant');
    },
  });
}

export function useResumeTenantMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.resumeTenant,
    onSuccess: (_, tenantId) => {
      toast.success('Tenant resumed successfully');
      queryClient.invalidateQueries({ queryKey: ['platformTenants'] });
      queryClient.invalidateQueries({ queryKey: ['platformTenant', tenantId] });
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to resume tenant');
    },
  });
}
