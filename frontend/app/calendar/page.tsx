'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthContext';
import { schedulesApi } from '@/lib/api/client';
import { format, parseISO } from 'date-fns';


export default function CalendarPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  if (!ORG_ID) return <div>Loading...</div>;
  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar', ORG_ID],
    queryFn: () => schedulesApi.getCalendarEvents(ORG_ID),
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading calendar...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Content Calendar</h1>
          <p className="text-slate-500">View and manage your scheduled posts.</p>
        </div>
      </div>

      <div className="bg-white rounded shadow border border-slate-200 overflow-hidden">
        {(!events || events.length === 0) ? (
          <div className="p-12 text-center text-slate-500">
            No posts scheduled yet. Go to Campaigns to generate and schedule content.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Platform</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Content Preview</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {events.map((event: any) => (
                <tr key={event.schedule_id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                    {format(parseISO(event.scheduled_at), 'MMM d, yyyy h:mm a')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-semibold">
                    {event.platform}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    <div className="line-clamp-2">{event.content}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${event.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 
                        event.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                      {event.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
