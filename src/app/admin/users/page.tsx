'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import UserManagement from '@/components/UserManagement';

function UserManagementWithParams() {
  const searchParams = useSearchParams();
  const editUserId = searchParams.get('edit');

  return <UserManagement preSelectedUserId={editUserId || undefined} />;
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <UserManagementWithParams />
    </Suspense>
  );
}
