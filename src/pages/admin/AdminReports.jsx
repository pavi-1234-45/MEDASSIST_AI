import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { useLanguage } from '../../context/LanguageContext';
import { dbService } from '../../utils/firebaseService';
import { FileText, Download, Activity, AlertTriangle, Pill, Calendar, Heart } from 'lucide-react';

export default function AdminReports() {
  const { t } = useLanguage();
  
  const [metrics, setMetrics] = useState({
    adherencePct: 0,
    taken: 0,
    skipped: 0,
    emergencies: 0,
    missedAlerts: 0,
    appts: { pending: 0, accepted: 0, completed: 0, missed: 0, cancelled: 0 },
    docsWorkload: [], // { name, count }
    conditionsCount: [] // { name, count, pct }
  });

  useEffect(() => {
    let taken = 0, skipped = 0;
    let emergCount = 0;
    let missedCount = 0;
    let totalPatients = 0;
    const apptCounts = { pending: 0, accepted: 0, completed: 0, missed: 0, cancelled: 0 };
    const docsAppts = {};
    const condMap = { 'diabetes': 0, 'hypertension': 0, 'asthma': 0, 'none': 0 };

    const unsubUsers = dbService.onValue('users', (data) => {
      if (data) {
        Object.keys(data).forEach(k => {
          if (data[k].role === 'doctor') {
            docsAppts[data[k].displayName] = 0;
          }
          if (data[k].role === 'patient') {
            totalPatients++;
          }
        });
      }
    });

    const unsubProfiles = dbService.onValue('profiles', (data) => {
      if (data) {
        // Reset
        condMap['diabetes'] = 0;
        condMap['hypertension'] = 0;
        condMap['asthma'] = 0;
        condMap['none'] = 0;

        Object.values(data).forEach(p => {
          if (p.conditions) {
            const lowerCond = p.conditions.toLowerCase();
            if (lowerCond.includes('diabetes')) condMap['diabetes']++;
            else if (lowerCond.includes('hyper')) condMap['hypertension']++;
            else if (lowerCond.includes('asthma')) condMap['asthma']++;
            else condMap['none']++;
          } else {
            condMap['none']++;
          }
        });
        updateMetrics();
      }
    });

    const unsubMeds = dbService.onValue('medicines', (data) => {
      if (data) {
        taken = 0; skipped = 0;
        Object.values(data).forEach(pMeds => {
          Object.values(pMeds).forEach(m => {
            if (m.status === 'taken') taken++;
            if (m.status === 'skipped') skipped++;
          });
        });
        updateMetrics();
      }
    });

    const unsubAppts = dbService.onValue('appointments', (data) => {
      if (data) {
        Object.keys(apptCounts).forEach(k => apptCounts[k] = 0);
        Object.keys(docsAppts).forEach(k => docsAppts[k] = 0);

        Object.values(data).forEach(a => {
          if (apptCounts[a.status] !== undefined) apptCounts[a.status]++;
          if (a.doctorName && docsAppts[a.doctorName] !== undefined) {
            docsAppts[a.doctorName]++;
          }
        });
        updateMetrics();
      }
    });

    const unsubEmerg = dbService.onValue('emergencies', (data) => {
      if (data) {
        emergCount = 0;
        Object.values(data).forEach(pE => emergCount += Object.keys(pE).length);
        updateMetrics();
      }
    });

    const unsubAlerts = dbService.onValue('alerts', (data) => {
      if (data) {
        missedCount = 0;
        Object.values(data).forEach(pA => {
          Object.values(pA).forEach(a => {
            if (a.type === 'missed_medicine') missedCount++;
          });
        });
        updateMetrics();
      }
    });

    function updateMetrics() {
      const adPct = (taken + skipped) > 0 ? Math.round((taken / (taken + skipped)) * 100) : 0;
      const workload = Object.keys(docsAppts).map(name => ({ name, count: docsAppts[name] })).sort((a,b) => b.count - a.count);
      
      const condArr = Object.keys(condMap).map(k => ({
        name: k.charAt(0).toUpperCase() + k.slice(1),
        count: condMap[k],
        pct: totalPatients > 0 ? Math.round((condMap[k] / totalPatients) * 100) : 0
      })).filter(c => c.count > 0).sort((a,b) => b.count - a.count);

      setMetrics({
        adherencePct: adPct, taken, skipped, emergencies: emergCount, missedAlerts: missedCount,
        appts: apptCounts,
        docsWorkload: workload,
        conditionsCount: condArr
      });
    }

    return () => { unsubUsers(); unsubProfiles(); unsubMeds(); unsubAppts(); unsubEmerg(); unsubAlerts(); };
  }, []);

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Metric,Value\n"
      + `Overall Adherence,${metrics.adherencePct}%\n`
      + `Medicines Taken,${metrics.taken}\n`
      + `Medicines Skipped,${metrics.skipped}\n`
      + `Emergency Alerts,${metrics.emergencies}\n`
      + `Missed Medicine Alerts,${metrics.missedAlerts}\n`
      + `Completed Appointments,${metrics.appts.completed}\n`
      + `Pending Appointments,${metrics.appts.pending}\n`
      + `Missed Appointments,${metrics.appts.missed}\n`
      + `Cancelled Appointments,${metrics.appts.cancelled}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hospital_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout title={t('reports')}>
      <div className="max-w-6xl mx-auto py-8">
        
        <div className="mb-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
              <FileText size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">System Reports</h1>
              <p className="text-gray-500 mt-1">Analytics and data export</p>
            </div>
          </div>
          
          <button onClick={handleExportCSV} className="px-6 py-3 bg-medical-blue hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-medical-blue/30 transition-colors flex items-center gap-2">
            <Download size={20} /> {t('export_report')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 rounded-full bg-teal-50 text-medical-teal flex items-center justify-center mb-4">
              <Activity size={32} />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Overall Adherence</p>
            <h3 className={`text-4xl font-bold ${metrics.adherencePct >= 80 ? 'text-green-500' : 'text-amber-500'}`}>{metrics.adherencePct}%</h3>
            <p className="text-xs text-gray-400 mt-2">{metrics.taken} Taken / {metrics.skipped} Skipped</p>
          </div>

          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center mb-4">
              <Pill size={32} />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Missed Medicines</p>
            <h3 className="text-4xl font-bold text-orange-600">{metrics.missedAlerts}</h3>
            <p className="text-xs text-gray-400 mt-2">Alerts generated (7 days)</p>
          </div>

          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle size={32} />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Emergencies</p>
            <h3 className="text-4xl font-bold text-red-600">{metrics.emergencies}</h3>
            <p className="text-xs text-gray-400 mt-2">SOS triggers (7 days)</p>
          </div>

          <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-medical-blue flex items-center justify-center mb-4">
              <Calendar size={32} />
            </div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Appt Status</p>
            <div className="w-full flex justify-between px-4 mt-2">
              <div className="text-center"><p className="font-bold text-green-600">{metrics.appts.completed}</p><p className="text-[10px] text-gray-400 uppercase">Comp</p></div>
              <div className="text-center"><p className="font-bold text-amber-500">{metrics.appts.pending}</p><p className="text-[10px] text-gray-400 uppercase">Pend</p></div>
              <div className="text-center"><p className="font-bold text-red-500">{metrics.appts.missed}</p><p className="text-[10px] text-gray-400 uppercase">Miss</p></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Count by Condition */}
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Heart size={20} className="text-rose-500" /> Patient Count by Condition
            </h2>
            {metrics.conditionsCount.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No condition data available.</p>
            ) : (
              <div className="space-y-5">
                {metrics.conditionsCount.map((cond, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-end mb-1">
                      <span className="font-bold text-gray-700">{cond.name}</span>
                      <span className="text-xs font-bold text-gray-500">{cond.count} patients ({cond.pct}%)</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-rose-400 rounded-full transition-all duration-1000" style={{ width: `${cond.pct}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Doctor Workload */}
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-medical-blue" /> {t('doctor_workload')}
            </h2>
            {metrics.docsWorkload.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No doctor data available.</p>
            ) : (
              <div className="space-y-4">
                {metrics.docsWorkload.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="w-40 font-bold text-gray-700 truncate">Dr. {doc.name}</span>
                    <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden flex items-center relative">
                      <div className="h-full bg-medical-blue rounded-full transition-all duration-1000" style={{ width: `${Math.max(5, (doc.count / 20) * 100)}%` }}></div>
                    </div>
                    <span className="w-12 text-right font-bold text-medical-blue">{doc.count} appts</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
