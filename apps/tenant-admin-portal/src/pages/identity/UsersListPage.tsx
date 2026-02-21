/**
 * UsersListPage - Tenant users management
 */

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Search, Lock, Unlock, Mail, User as UserIcon, UserPlus, Activity, FileText, Send } from 'lucide-react';
import { getUsers, createUser, inviteUser, lockUser, unlockUser, type User, type CreateUserRequest, type CreateInviteRequest, type InviteResponse, type LockUserRequest, type UnlockUserRequest } from '@/lib/api/identity';
import { getAuditTimeline } from '@/lib/api/evidence';
import { EvidenceDrawer } from '@/components/evidence/EvidenceDrawer';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AuditTimeline } from '@/components/evidence/AuditTimeline';
import { ROLES, type RoleName } from '@/lib/auth/roles';

export function UsersListPage() {
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteResult, setInviteResult] = useState<InviteResponse | null>(null);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [evidenceDrawerOpen, setEvidenceDrawerOpen] = useState(false);
  const [lockReason, setLockReason] = useState('');
  const [unlockReason, setUnlockReason] = useState('');

  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [auditPage, setAuditPage] = useState(0);
  const auditPageSize = 20;
  
  // Create user form state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');

  // Invite user form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRoles, setInviteRoles] = useState<RoleName[]>([ROLES.OPERATOR]);
  const [inviteExpiresInMinutes, setInviteExpiresInMinutes] = useState<string>('');

  // Fetch users with optional email filter
  const usersQuery = useQuery({
    queryKey: ['users', debouncedSearch],
    queryFn: () => getUsers(debouncedSearch || undefined),
  });

  const pagedUsers = useMemo(() => {
    const users = usersQuery.data ?? [];
    const start = page * pageSize;
    return users.slice(start, start + pageSize);
  }, [usersQuery.data, page, pageSize]);

  const totalPages = useMemo(() => {
    const total = (usersQuery.data ?? []).length;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [usersQuery.data, pageSize]);

  // Lock user mutation
  const lockMutation = useMutation({
    mutationFn: ({ userId, request }: { userId: string; request?: LockUserRequest }) => {
      return lockUser(userId, request);
    },
    onSuccess: () => {
      toast.success('User locked successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setLockDialogOpen(false);
      setLockReason('');
      setSelectedUser(null);
    },
    onError: (err: Error) => {
      toast.error(`Failed to lock user: ${err.message}`);
    },
  });

  // Unlock user mutation
  const unlockMutation = useMutation({
    mutationFn: ({ userId, request }: { userId: string; request?: UnlockUserRequest }) => {
      return unlockUser(userId, request);
    },
    onSuccess: () => {
      toast.success('User unlocked successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUnlockDialogOpen(false);
      setUnlockReason('');
      setSelectedUser(null);
    },
    onError: (err: Error) => {
      toast.error(`Failed to unlock user: ${err.message}`);
    },
  });

  // Create user mutation
  const createMutation = useMutation({
    mutationFn: (request: CreateUserRequest) => {
      return createUser(request);
    },
    onSuccess: () => {
      toast.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreateDialogOpen(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserFirstName('');
      setNewUserLastName('');
    },
    onError: (err: Error) => {
      toast.error(`Failed to create user: ${err.message}`);
    },
  });

  const inviteMutation = useMutation({
    mutationFn: (request: CreateInviteRequest) => {
      const idempotencyKey = `invite-user-${Date.now()}-${Math.random()}`;
      return inviteUser(request, idempotencyKey);
    },
    onSuccess: (data) => {
      toast.success(`Invite created for ${data.email}`);
      setInviteResult(data);
      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteRoles([ROLES.OPERATOR]);
      setInviteExpiresInMinutes('');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err: Error) => {
      toast.error(`Failed to invite user: ${err.message}`);
    },
  });

  const auditQuery = useQuery({
    queryKey: ['user-audit', selectedUser?.userId, auditPage, auditPageSize],
    queryFn: () => {
      if (!selectedUser?.userId) throw new Error('No user selected');
      return getAuditTimeline({ page: auditPage, size: auditPageSize, userId: selectedUser.userId });
    },
    enabled: auditDialogOpen && !!selectedUser?.userId,
  });

  const handleSearch = () => {
    setDebouncedSearch(searchEmail);
    setPage(0);
  };

  const handleLock = (user: User) => {
    setSelectedUser(user);
    setLockDialogOpen(true);
  };

  const handleUnlock = (user: User) => {
    setSelectedUser(user);
    setUnlockDialogOpen(true);
  };

  const handleOpenAudit = (user: User) => {
    setSelectedUser(user);
    setAuditPage(0);
    setAuditDialogOpen(true);
  };

  const handleOpenEvidence = (user: User) => {
    setSelectedUser(user);
    setEvidenceDrawerOpen(true);
  };

  const confirmLock = () => {
    if (selectedUser) {
      lockMutation.mutate({
        userId: selectedUser.userId,
        request: lockReason ? { reason: lockReason } : undefined,
      });
    }
  };

  const confirmUnlock = () => {
    if (selectedUser) {
      unlockMutation.mutate({
        userId: selectedUser.userId,
        request: unlockReason ? { reason: unlockReason } : undefined,
      });
    }
  };

  const handleCreateUser = () => {
    if (!newUserEmail || !newUserPassword) {
      toast.error('Email and password are required');
      return;
    }
    createMutation.mutate({
      email: newUserEmail,
      password: newUserPassword,
      firstName: newUserFirstName || undefined,
      lastName: newUserLastName || undefined,
    });
  };

  const handleInviteUser = () => {
    if (!inviteEmail) {
      toast.error('Email is required');
      return;
    }
    if (!inviteRoles.length) {
      toast.error('Select at least one role');
      return;
    }

    let expiresInMinutes: number | undefined;
    if (inviteExpiresInMinutes) {
      const parsed = Number(inviteExpiresInMinutes);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        toast.error('Expires (minutes) must be a positive number');
        return;
      }
      expiresInMinutes = parsed;
    }

    inviteMutation.mutate({
      email: inviteEmail,
      roles: inviteRoles,
      expiresInMinutes,
    });
  };

  const handleCopyInviteToken = async () => {
    if (!inviteResult?.token) return;
    await navigator.clipboard.writeText(inviteResult.token);
    toast.success('Invite token copied');
  };

  const toggleInviteRole = (role: RoleName) => {
    setInviteRoles((prev) => {
      if (prev.includes(role)) return prev.filter(r => r !== role);
      return [...prev, role];
    });
  };

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-6 w-6 text-gray-900" />
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        </div>
        <p className="text-gray-600">
          Manage tenant users, lock/unlock accounts
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} disabled={usersQuery.isLoading}>
          Search
        </Button>
        <Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
          <Send className="h-4 w-4 mr-2" />
          Invite User
        </Button>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
        {debouncedSearch && (
          <Button
            variant="outline"
            onClick={() => {
              setSearchEmail('');
              setDebouncedSearch('');
              setPage(0);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {usersQuery.data && usersQuery.data.length > pageSize && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Backend currently returns the full user list (no server-side pagination params).
          This UI is using client-side paging ({pageSize}/page).
        </div>
      )}

      {inviteResult && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-green-900">Invite created for {inviteResult.email}</div>
              <div className="mt-1 text-xs text-green-800">Save this token now — it may not be shown again.</div>
              <div className="mt-3 rounded bg-white p-3 font-mono text-xs text-gray-900 border border-green-300 break-all">
                {inviteResult.token}
              </div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={handleCopyInviteToken}>
                  Copy token
                </Button>
                <Button size="sm" variant="outline" onClick={() => setInviteResult(null)}>
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="rounded-lg border border-gray-200 bg-white">
        {usersQuery.isLoading && (
          <div className="p-8 text-center text-gray-500">Loading users...</div>
        )}

        {usersQuery.error && (
          <div className="p-8 text-center text-red-600">
            Error loading users: {(usersQuery.error as Error).message}
          </div>
        )}

        {usersQuery.data && usersQuery.data.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {debouncedSearch
              ? `No users found matching "${debouncedSearch}"`
              : 'No users found'}
          </div>
        )}

        {usersQuery.data && usersQuery.data.length > 0 && (
          <div className="divide-y divide-gray-200">
            {pagedUsers.map((user) => (
              <div key={user.userId} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                      <UserIcon className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`
                            : user.email}
                        </span>
                        {user.enabled ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="destructive">Locked</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        ID: {user.userId}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAudit(user)}
                    >
                      <Activity className="h-4 w-4 mr-1" />
                      Audit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEvidence(user)}
                    >
                      <FileText className="h-4 w-4 mr-1" />
                      Evidence
                    </Button>
                    {user.enabled ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLock(user)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Lock className="h-4 w-4 mr-1" />
                        Lock
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnlock(user)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Unlock className="h-4 w-4 mr-1" />
                        Unlock
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {usersQuery.data && usersQuery.data.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {page + 1} of {totalPages} ({usersQuery.data.length} users)
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Lock User Dialog */}
      <Dialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock User</DialogTitle>
            <DialogDescription>
              Lock {selectedUser?.email}? They will not be able to log in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="lock-reason">Reason (optional)</Label>
              <Textarea
                id="lock-reason"
                value={lockReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setLockReason(e.target.value)}
                placeholder="e.g., Security violation, Policy breach"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLockDialogOpen(false);
                setLockReason('');
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmLock}
              disabled={lockMutation.isPending}
            >
              {lockMutation.isPending ? 'Locking...' : 'Lock User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlock User Dialog */}
      <Dialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unlock User</DialogTitle>
            <DialogDescription>
              Unlock {selectedUser?.email}? They will be able to log in again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="unlock-reason">Reason (optional)</Label>
              <Textarea
                id="unlock-reason"
                value={unlockReason}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUnlockReason(e.target.value)}
                placeholder="e.g., Issue resolved, Account verified"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUnlockDialogOpen(false);
                setUnlockReason('');
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmUnlock}
              disabled={unlockMutation.isPending}
            >
              {unlockMutation.isPending ? 'Unlocking...' : 'Unlock User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to your tenant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                value={newUserFirstName}
                onChange={(e) => setNewUserFirstName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                value={newUserLastName}
                onChange={(e) => setNewUserLastName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={createMutation.isPending || !newUserEmail || !newUserPassword}
            >
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Create an invite token for a new user (token should be shared securely).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email *</Label>
              <Input
                id="inviteEmail"
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Roles *</Label>
              <div className="grid grid-cols-2 gap-2">
                {[ROLES.TENANT_ADMIN, ROLES.DPO, ROLES.REVIEWER, ROLES.OPERATOR, ROLES.AUDITOR].map((role) => (
                  <label key={role} className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={inviteRoles.includes(role)}
                      onChange={() => toggleInviteRole(role)}
                    />
                    {role}
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500">Role strings match backend exactly (from roles constants).</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">Expires (minutes, optional)</Label>
              <Input
                id="expires"
                type="number"
                min={1}
                placeholder="e.g., 1440"
                value={inviteExpiresInMinutes}
                onChange={(e) => setInviteExpiresInMinutes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)} disabled={inviteMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleInviteUser}
              disabled={inviteMutation.isPending || !inviteEmail || inviteRoles.length === 0}
            >
              {inviteMutation.isPending ? 'Inviting...' : 'Create Invite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Audit Dialog */}
      <Dialog open={auditDialogOpen} onOpenChange={setAuditDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>User Audit</DialogTitle>
            <DialogDescription>
              Audit events for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <AuditTimeline
              events={auditQuery.data?.content ?? []}
              isLoading={auditQuery.isLoading}
              error={auditQuery.error as Error}
              currentPage={auditPage}
              totalPages={auditQuery.data?.totalPages ?? 0}
              pageSize={auditPageSize}
              totalElements={auditQuery.data?.totalElements ?? 0}
              onPageChange={setAuditPage}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAuditDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EvidenceDrawer
        isOpen={evidenceDrawerOpen}
        onClose={() => setEvidenceDrawerOpen(false)}
        objectType="USER"
        objectId={selectedUser?.userId}
        title={selectedUser ? `Evidence Context: ${selectedUser.email}` : 'Evidence Context'}
      />
    </>
  );
}

export default UsersListPage;
