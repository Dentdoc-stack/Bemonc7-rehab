'use client';

import { IPCData, IPCStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface IPCCardProps {
  ipcData: IPCData;
}

export default function IPCCard({ ipcData }: IPCCardProps) {
  console.log('[IPCCard] Received ipcData:', ipcData);
  console.log('[IPCCard] Records count:', ipcData?.records?.length);

  if (!ipcData || !ipcData.records || ipcData.records.length === 0) {
    return null;
  }

  // Status styling
  const getStatusStyle = (status: IPCStatus | null): string => {
    if (!status) return 'bg-gray-100 text-gray-700';
    
    switch (status) {
      case 'not submitted':
        return 'bg-red-100 text-red-700';
      case 'submitted':
        return 'bg-amber-100 text-amber-700';
      case 'in process':
        return 'bg-blue-100 text-blue-700';
      case 'released':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Calculate summary counts
  const statusCounts = {
    released: ipcData.records.filter(r => r.status === 'released').length,
    inProcess: ipcData.records.filter(r => r.status === 'in process').length,
    submitted: ipcData.records.filter(r => r.status === 'submitted').length,
    notSubmitted: ipcData.records.filter(r => r.status === 'not submitted').length,
    unknown: ipcData.records.filter(r => r.status === null).length,
  };

  const summaryParts = [];
  if (statusCounts.released > 0) summaryParts.push(`${statusCounts.released} Released`);
  if (statusCounts.inProcess > 0) summaryParts.push(`${statusCounts.inProcess} In Process`);
  if (statusCounts.submitted > 0) summaryParts.push(`${statusCounts.submitted} Submitted`);
  if (statusCounts.notSubmitted > 0) summaryParts.push(`${statusCounts.notSubmitted} Not Submitted`);

  const summary = summaryParts.join(', ') || 'No IPC data available';

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Interim Payment Certificates (IPC)</CardTitle>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {ipcData.records.map((record) => (
            <div
              key={record.ipcNumber}
              className="border rounded-lg p-4 text-center"
            >
              <div className="text-sm font-semibold text-foreground mb-2">
                {record.ipcNumber}
              </div>
              <Badge
                className={`${getStatusStyle(record.status)} font-medium text-xs px-2 py-1`}
              >
                {record.status || 'Unknown'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
