'use client';

import { useState } from 'react';

export default function ConnectionModal({ isOpen, onClose, onSuccess, initialData }: any) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    type: initialData?.type || 'mysql',
    host: initialData?.host || '',
    port: initialData?.port || '',
    username: initialData?.username || '',
    password: initialData?.password || '',
    database: initialData?.database || '',
  });

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const url = initialData 
      ? `http://localhost:4000/api/connections/${initialData.id}` 
      : 'http://localhost:4000/api/connections';
    const method = initialData ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          port: parseInt(formData.port as string) || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
        onClose();
      } else {
        alert(data.error);
      }
    } catch (err) {
      alert('Failed to save connection');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{initialData ? 'Edit' : 'Add'} Connection</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input name="name" value={formData.name} onChange={handleChange} className="w-full border rounded p-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium">Type</label>
            <select name="type" value={formData.type} onChange={handleChange} className="w-full border rounded p-2">
              <option value="mysql">MySQL</option>
              <option value="postgres">PostgreSQL</option>
              <option value="mongodb">MongoDB</option>
              <option value="sqlite">SQLite</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Host</label>
              <input name="host" value={formData.host} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Port</label>
              <input name="port" type="number" value={formData.port} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Username</label>
              <input name="username" value={formData.username} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium">Password</label>
              <input name="password" type="password" value={formData.password} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Database Name</label>
            <input name="database" value={formData.database} onChange={handleChange} className="w-full border rounded p-2" />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}
