// /home/user/studio/src/app/tracking/page.tsx
import TrackingClient from './tracking-client';

export default function TrackingPage() {
  return (
    <TrackingClient
      initialAssignees={[]} // Client will fetch this
    />
  );
}
