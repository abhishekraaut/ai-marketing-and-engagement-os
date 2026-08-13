'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/AuthContext';
import { schedulesApi } from '@/lib/api/client';
import { 
  format, parseISO, isToday, isSameMonth, 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, addMonths, subMonths, isSameDay
} from 'date-fns';
import { Calendar as CalendarIcon, Clock, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalendarPage() {
  const { currentOrgId: ORG_ID } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar', ORG_ID],
    queryFn: () => schedulesApi.getCalendarEvents(ORG_ID!),
    enabled: !!ORG_ID
  });

  if (!ORG_ID) return <CalendarSkeleton />;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const getEventsForDay = (day: Date) => {
    if (!events) return [];
    return events.filter((e: any) => isSameDay(parseISO(e.scheduled_at), day));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-[calc(100vh-6rem)]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            Content Calendar
          </h1>
          <p className="text-slate-500 mt-1">Manage and track your scheduled cross-channel campaigns.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
          <button onClick={today} className="px-3 py-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">
            Today
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <button onClick={prevMonth} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="w-32 text-center font-bold text-slate-900">
            {format(currentDate, 'MMMM yyyy')}
          </span>
          <button onClick={nextMonth} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 shrink-0">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 flex-1 min-h-0 overflow-y-auto">
          {days.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            const isCurrMonth = isSameMonth(day, monthStart);
            const isCurrDay = isToday(day);

            return (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "min-h-[120px] p-2 border-b border-r border-slate-100 last:border-r-0 group transition-colors",
                  !isCurrMonth && "bg-slate-50/50",
                  isCurrDay && "bg-indigo-50/10",
                  (i + 1) % 7 === 0 && "border-r-0"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold",
                    isCurrDay ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200" : 
                    !isCurrMonth ? "text-slate-400" : "text-slate-700 group-hover:bg-slate-100 transition-colors"
                  )}>
                    {format(day, 'd')}
                  </span>
                </div>
                
                <div className="space-y-1.5 overflow-y-auto max-h-[100px] scrollbar-hide">
                  {dayEvents.map((evt: any) => (
                    <div 
                      key={evt.schedule_id} 
                      className={cn(
                        "text-xs p-1.5 rounded-md border truncate cursor-pointer transition-colors hover:shadow-sm",
                        evt.status === 'PUBLISHED' ? "bg-emerald-50 border-emerald-100 text-emerald-800" :
                        evt.status === 'FAILED' ? "bg-red-50 border-red-100 text-red-800" :
                        "bg-white border-slate-200 text-slate-700 hover:border-indigo-200"
                      )}
                      title={evt.content}
                    >
                      <div className="flex items-center gap-1 font-semibold mb-0.5 opacity-80">
                        {evt.status === 'PUBLISHED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {format(parseISO(evt.scheduled_at), 'HH:mm')}
                      </div>
                      <div className="truncate">{evt.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-6rem)] animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="h-10 bg-slate-200 rounded-xl w-64" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 flex-1 grid grid-cols-7 grid-rows-5 gap-0">
        {Array.from({length: 35}).map((_, i) => (
          <div key={i} className="border-r border-b border-slate-100 p-2 min-h-[120px]">
            <div className="w-7 h-7 rounded-full bg-slate-100 mb-2" />
            <div className="h-12 bg-slate-50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
