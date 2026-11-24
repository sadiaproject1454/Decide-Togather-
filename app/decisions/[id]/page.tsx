// PAGE 7: Decision Details Page  →  Route: /decisions/[id]
// Server Component wrapper — exports generateStaticParams and passes id to client UI
// (Cannot mix 'use client' with generateStaticParams, so we split into two files)

import { SAMPLE_DECISIONS } from '@/app/lib/data';
import DecisionDetailClient from './DecisionDetailClient';

// Tell Next.js which decision IDs to pre-render at build time
export function generateStaticParams() {
  return SAMPLE_DECISIONS.map((d) => ({ id: d.id }));
}

export default async function DecisionDetailPage(props: PageProps<'/decisions/[id]'>) {
  const { id } = await props.params;
  return <DecisionDetailClient id={id} />;
}
