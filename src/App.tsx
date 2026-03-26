import React, { useState, useEffect } from 'react';
import { Users, Mail, Settings, Plus, Send, Trash2, MessageSquare } from 'lucide-react';
import AddEmployeeModal from './components/AddEmployeeModal';
import TemplateEditor from './components/TemplateEditor';
import SendMessageModal from './components/SendMessageModal';

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTemplateEditorOpen, setIsTemplateEditorOpen] = useState(false);
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchTemplates();
  }, []);

  const fetchEmployees = async () => {
    const res = await fetch('/api/employees');
    const data = await res.json();
    setEmployees(data);
  };

  const fetchTemplates = async () => {
    const res = await fetch('/api/templates');
    const data = await res.json();
    setTemplates(data);
  };

  const handleAddEmployee = async (employee) => {
    await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(employee),
    });
    fetchEmployees();
    setIsAddModalOpen(false);
  };

  const handleDeleteEmployee = async (id) => {
    if (confirm('정말 이 직원을 삭제하시겠습니까?')) {
      await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      fetchEmployees();
    }
  };

  const handleSendNow = async (employeeId, templateId) => {
    await fetch('/api/send-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, templateId }),
    });
    alert('메시지가 성공적으로 발송되었습니다.');
    fetchEmployees();
    setIsSendMessageModalOpen(false);
  };

  const handleSendScheduled = async () => {
    const res = await fetch('/api/cron/send-reminders', { method: 'POST' });
    const data = await res.json();
    alert(`오늘 대상자 일괄 발송이 완료되었습니다. (총 ${data.sentCount}건 발송)`);
    fetchEmployees();
    setIsSendMessageModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Mail className="h-6 w-6 text-blue-600 mr-2" />
              <span className="font-semibold text-xl">온보딩 자동화 시스템</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsTemplateEditorOpen(true)}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <Settings className="h-4 w-4 mr-1" />
                템플릿 관리
              </button>
              <button
                onClick={() => setIsSendMessageModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                문자 보내기
              </button>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                직원 추가
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">소속/팀</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">입사일</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((emp) => (
                <tr key={emp.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{emp.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.team}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{emp.email}</div>
                    <div className="text-xs text-gray-400">{emp.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.joinDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {emp.status === 'pending' ? '대기 중' : emp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => handleDeleteEmployee(emp.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    등록된 직원이 없습니다. 직원을 추가해주세요.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      {isAddModalOpen && (
        <AddEmployeeModal
          onClose={() => setIsAddModalOpen(false)}
          onAdd={handleAddEmployee}
        />
      )}

      {isTemplateEditorOpen && (
        <TemplateEditor
          onClose={() => setIsTemplateEditorOpen(false)}
        />
      )}

      {isSendMessageModalOpen && (
        <SendMessageModal
          onClose={() => setIsSendMessageModalOpen(false)}
          employees={employees}
          templates={templates}
          onSendNow={handleSendNow}
          onSendScheduled={handleSendScheduled}
        />
      )}
    </div>
  );
}
