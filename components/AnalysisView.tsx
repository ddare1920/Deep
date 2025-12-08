import React, { useMemo } from 'react';
import { MaintenanceItem } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { ClipboardList, AlertOctagon, Activity } from 'lucide-react';

interface AnalysisViewProps {
  maintenanceData: MaintenanceItem[];
  isLoading: boolean;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ maintenanceData, isLoading }) => {
  
  const chartData = useMemo(() => {
    // Aggregate by Priority
    const counts = { High: 0, Medium: 0, Low: 0 };
    maintenanceData.forEach(item => {
        if (counts[item.priority] !== undefined) {
            counts[item.priority]++;
        }
    });
    return [
        { name: 'High Priority', value: counts.High, color: '#EF4444' },
        { name: 'Medium Priority', value: counts.Medium, color: '#F59E0B' },
        { name: 'Low Priority', value: counts.Low, color: '#3B82F6' },
    ];
  }, [maintenanceData]);

  if (isLoading) {
      return (
          <div className="flex items-center justify-center h-full text-industrial-400">
              <div className="text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 animate-bounce text-brand-blue"/>
                  <p>Extracting structured data from manual...</p>
              </div>
          </div>
      );
  }

  if (maintenanceData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-industrial-400 p-8">
            <ClipboardList className="w-16 h-16 mb-4 opacity-50"/>
            <h3 className="text-xl font-semibold mb-2">No Data Extracted</h3>
            <p className="text-center max-w-md">
                Upload a manual and ask the agent to "Generate maintenance schedule" or "Analyze parts" to populate this dashboard.
            </p>
        </div>
      );
  }

  return (
    <div className="h-full overflow-y-auto bg-industrial-900 p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <ClipboardList className="text-brand-blue"/> Maintenance Dashboard
        </h2>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-industrial-800 p-5 rounded-xl border border-industrial-700 shadow-lg col-span-2">
                <h3 className="text-lg font-semibold text-industrial-200 mb-4">Task Priority Distribution</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                            <XAxis type="number" stroke="#9CA3AF" />
                            <YAxis dataKey="name" type="category" stroke="#9CA3AF" width={100} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#F3F4F6' }}
                                itemStyle={{ color: '#F3F4F6' }}
                                cursor={{fill: '#374151', opacity: 0.4}}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-industrial-800 p-5 rounded-xl border border-industrial-700 shadow-lg flex flex-col justify-center">
                 <h3 className="text-lg font-semibold text-industrial-200 mb-4">Summary</h3>
                 <div className="space-y-4">
                     <div className="flex justify-between items-center p-3 bg-industrial-700/30 rounded-lg">
                         <span className="text-industrial-400">Total Tasks</span>
                         <span className="text-2xl font-mono font-bold text-white">{maintenanceData.length}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 bg-red-900/20 rounded-lg border border-red-900/30">
                         <span className="text-red-400 flex items-center gap-2"><AlertOctagon size={16}/> Critical</span>
                         <span className="text-2xl font-mono font-bold text-red-400">{chartData[0].value}</span>
                     </div>
                 </div>
            </div>
        </div>

        {/* Data Table */}
        <div className="bg-industrial-800 rounded-xl border border-industrial-700 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-industrial-300">
                    <thead className="bg-industrial-900 text-industrial-100 uppercase font-mono text-xs">
                        <tr>
                            <th className="px-6 py-4">Priority</th>
                            <th className="px-6 py-4">Component</th>
                            <th className="px-6 py-4">Interval</th>
                            <th className="px-6 py-4">Task</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-industrial-700">
                        {maintenanceData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-industrial-700/50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className={`
                                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                        ${item.priority === 'High' ? 'bg-red-900/50 text-red-400 border border-red-900' : ''}
                                        ${item.priority === 'Medium' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-900' : ''}
                                        ${item.priority === 'Low' ? 'bg-blue-900/50 text-blue-400 border border-blue-900' : ''}
                                    `}>
                                        {item.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-white">{item.component}</td>
                                <td className="px-6 py-4 font-mono text-xs">{item.interval}</td>
                                <td className="px-6 py-4">{item.task}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};
