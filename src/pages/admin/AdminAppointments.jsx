import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { dbService } from '../../utils/firebaseService';
import { Calendar, CheckCircle, XCircle, Clock, Video, Building } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAppointments() {
  const { t } = useLanguage();
  const [appointments, setAppointments] = useState([]);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, upcoming, past

  useEffect(() => {
    const unsub = dbService.onValue('appointments', (data) => {
      if (data) {
        const arr = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        arr.sort((a, b) => new Date(`${b.date}T${b.time}`) - new Date(`${a.date}T${a.time}`));
        setAppointments(arr);
      } else {
        setAppointments([]);
      }
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await dbService.update(`appointments/${id}`, { status });
      toast.success(`Appointment marked as ${status}`);
    } catch (err) {
      toast.error(t('somethingWentWrong'));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-700';
      case 'completed': return 'bg-teal-100 text-teal-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-gray-200 text-red-600';
      case 'missed': return 'bg-gray-200 text-gray-600';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredAppts = appointments.filter(a => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchDept = deptFilter === 'all' || (a.department || 'General').toLowerCase() === deptFilter.toLowerCase();
    
    let matchDate = true;
    if (dateFilter === 'today') matchDate = a.date === todayStr;
    if (dateFilter === 'upcoming') matchDate = a.date > todayStr;
    if (dateFilter === 'past') matchDate = a.date < todayStr;

    return matchStatus && matchDept && matchDate;
  });

  return (
    <Layout title={t('appointments')}>
      <div className="max-w-7xl mx-auto py-8">
        
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-medical-blue rounded-xl">
              <Calendar size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{t('appointments')}</h1>
              <p className="text-gray-500 mt-1">Global hospital appointment management</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-medical-blue text-sm"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </select>
            <select 
              value={deptFilter} 
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-medical-blue text-sm"
            >
              <option value="all">All Departments</option>
              <option value="general">General</option>
              <option value="cardiology">Cardiology</option>
              <option value="pediatrics">Pediatrics</option>
            </select>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-medical-blue text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="completed">Completed</option>
              <option value="missed">Missed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 font-bold">
                <tr>
                  <th className="p-4">Date/Time</th>
                  <th className="p-4">Patient</th>
                  <th className="p-4">Doctor</th>
                  <th className="p-4">Department</th>
                  <th className="p-4">Mode</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAppts.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-500">No appointments found.</td>
                  </tr>
                ) : (
                  filteredAppts.map(a => (
                    <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{a.date}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Clock size={12}/> {a.time}</div>
                      </td>
                      <td className="p-4 font-bold text-gray-800">{a.patientName}</td>
                      <td className="p-4 font-medium text-gray-600">{a.doctorName || 'Unassigned'}</td>
                      <td className="p-4 text-gray-600">{a.department || 'General'}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1 text-gray-600">
                          {a.mode === 'online' ? <Video size={16} className="text-blue-500"/> : <Building size={16} className="text-amber-600"/>}
                          <span className="capitalize">{a.mode || 'In-person'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(a.status)}`}>
                          {t(a.status) || a.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => handleUpdateStatus(a.id, 'completed')} disabled={a.status === 'completed' || a.status === 'cancelled'} className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg text-xs transition-colors disabled:opacity-50">
                            {t('complete') || 'Complete'}
                          </button>
                          <button onClick={() => handleUpdateStatus(a.id, 'missed')} disabled={a.status === 'missed' || a.status === 'completed' || a.status === 'cancelled'} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs transition-colors disabled:opacity-50">
                            {t('mark_missed') || 'Mark Missed'}
                          </button>
                          <button onClick={() => handleUpdateStatus(a.id, 'cancelled')} disabled={a.status === 'cancelled' || a.status === 'completed'} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg text-xs transition-colors disabled:opacity-50">
                            {t('cancel_appointment') || 'Cancel'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
}
