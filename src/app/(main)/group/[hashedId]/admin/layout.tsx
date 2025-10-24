import React from 'react';

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ hashedId: string }>;
}) {
  const resolvedParams = await params;
  console.log('AdminLayout params:', resolvedParams);
  return <>{children}</>;
}
