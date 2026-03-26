import React, { useState, useEffect } from 'react';
import { X, Send, Calendar, Clock } from 'lucide-react';

export default function SendMessageModal({ onClose, employees, templates, onSendNow, onSendScheduled }) {
  const [activeTab, setActiveTab] = useState('scheduled'); // 'scheduled' | 'immediate'
  
  // Immediate Send State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Scheduled Send State
  const [schedules, setSchedules] = useState([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  useEffect(() => {
    if (activeTab === 'scheduled') {
      fetchSchedules();
    }
  }, [activeTab]);

  const fetchSchedules = async () => {
    setIsLoadingSchedules(true);
    try {
      const res = await fetch('/api/schedules');
      const data = await res.json();
      setSchedules(data);
    } catch (error) {
      console.error('Failed to fetch schedules', error);
    } finally {
      setIsLoadingSchedules(false);
    }
  };

  const handleImmediateSend = (e) => {
    e.preventDefault();
    if (!selectedEmployeeId || !selectedTemplateId) {
      alert('직원과 템플릿을 모두 선택해주세요.');
      return;
    }
    onSendNow(selectedEmployeeId, selectedTemplateId);
    setSelectedEmployeeId('');
    setSelectedTemplateId('');
  };

  const todaySchedules = schedules.filter(s => s.isToday && !s.status.includes(s.templateId));
  const upcomingSchedules = schedules.filter(s => !s.isPast && !s.isToday);

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">문자 보내기</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'scheduled' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('scheduled')}
          >
            예약 발송 (자동 분류)
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'immediate' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('immediate')}
          >
            즉시 발송 (수동 선택)
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'scheduled' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-md font-medium text-gray-900">오늘 발송 대상자</h4>
                  <p className="text-sm text-gray-500">입사일을 기준으로 시스템이 자동으로 분류한 오늘의 발송 대상입니다.</p>
                </div>
                <button
                  onClick={onSendScheduled}
                  disabled={todaySchedules.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 mr-2" />
                  오늘 대상자 일괄 발송 ({todaySchedules.length}건)
                </button>
              </div>

              {isLoadingSchedules ? (
                <div className="text-center py-4 text-gray-500">일정을 불러오는 중...</div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md border">
                  <ul className="divide-y divide-gray-200">
                    {todaySchedules.length > 0 ? todaySchedules.map((schedule, idx) => (
                      <li key={idx} className="px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <Clock className="h-6 w-6 text-blue-500" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{schedule.employeeName} ({schedule.team})</div>
                            <div className="text-sm text-gray-500">{schedule.templateId} 안내 문자</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          오늘 발송 예정
                        </div>
                      </li>
                    )) : (
                      <li className="px-6 py-4 text-center text-sm text-gray-500">오늘 발송할 대상자가 없습니다.</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="mt-8">
                <h4 className="text-md font-medium text-gray-900 mb-4">다가오는 발송 일정</h4>
                <div className="bg-white shadow overflow-hidden sm:rounded-md border">
                  <ul className="divide-y divide-gray-200">
                    {upcomingSchedules.length > 0 ? upcomingSchedules.map((schedule, idx) => (
                      <li key={idx} className="px-6 py-4 flex items-center justify-between bg-gray-50">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <Calendar className="h-6 w-6 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{schedule.employeeName} ({schedule.team})</div>
                            <div className="text-sm text-gray-500">{schedule.templateId} 안내 문자</div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {schedule.scheduledDate} 예정
                        </div>
                      </li>
                    )) : (
                      <li className="px-6 py-4 text-center text-sm text-gray-500">예정된 발송 일정이 없습니다.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'immediate' && (
            <form onSubmit={handleImmediateSend} className="space-y-6 max-w-lg mx-auto mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">대상 직원 선택</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  required
                >
                  <option value="">직원을 선택하세요</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.team})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">발송할 템플릿 선택</label>
                <select
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  required
                >
                  <option value="">템플릿을 선택하세요</option>
                  {templates.map(tpl => (
                    <option key={tpl.id} value={tpl.id}>{tpl.id} 안내</option>
                  ))}
                </select>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Send className="h-4 w-4 mr-2" />
                  즉시 발송하기
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
