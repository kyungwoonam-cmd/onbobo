import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

export default function TemplateEditor({ onClose }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const res = await fetch('/api/templates');
    const data = await res.json();
    setTemplates(data);
    if (data.length > 0 && !selectedTemplate) {
      setSelectedTemplate(data[0]);
    }
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    
    await fetch(`/api/templates/${selectedTemplate.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: selectedTemplate.subject,
        body: selectedTemplate.body,
      }),
    });
    alert('템플릿이 성공적으로 저장되었습니다.');
    fetchTemplates();
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">메시지 템플릿 관리</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-1/4 border-r bg-gray-50 p-4 overflow-y-auto">
            <nav className="space-y-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    selectedTemplate?.id === tpl.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {tpl.id} 안내
                </button>
              ))}
            </nav>
          </div>

          {/* Editor */}
          <div className="flex-1 p-6 overflow-y-auto">
            {selectedTemplate ? (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">사용 가능한 변수</h4>
                  <p className="text-sm text-blue-600">
                    <code className="bg-white px-1 py-0.5 rounded border">{"{{name}}"}</code> - 직원 이름<br/>
                    <code className="bg-white px-1 py-0.5 rounded border">{"{{team}}"}</code> - 소속/팀명<br/>
                    <code className="bg-white px-1 py-0.5 rounded border">{"{{date}}"}</code> - 입사 예정일
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">제목</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                    value={selectedTemplate.subject}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, subject: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">메시지 내용</label>
                  <textarea
                    rows={12}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border font-mono"
                    value={selectedTemplate.body}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, body: e.target.value })}
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={handleSave}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    템플릿 저장
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                편집할 템플릿을 선택해주세요
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
