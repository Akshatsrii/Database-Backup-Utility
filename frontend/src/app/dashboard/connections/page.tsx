'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Database, Trash2, Edit, RefreshCw } from 'lucide-react';
import ConnectionModal from '@/components/ConnectionModal';

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<any>(null);

  const fetchConnections = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/connections');
      const data = await res.json();
      if (data.success) {
        setConnections(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this connection?')) return;
    try {
      await fetch(`http://localhost:4000/api/connections/${id}`, { method: 'DELETE' });
      fetchConnections();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  const handleTest = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/connections/${id}/test`, { method: 'POST' });
      const data = await res.json();
      alert(data.data?.message || data.error);
    } catch (err) {
      alert('Test failed');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Database Connections</h1>
        <Button onClick={() => { setEditingConnection(null); setIsModalOpen(true); }}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Connection
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {connections.map((conn) => (
          <Card key={conn.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Database className="mr-2 h-4 w-4 text-muted-foreground" />
                {conn.name}
              </CardTitle>
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon" onClick={() => handleTest(conn.id)} title="Test">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => { setEditingConnection(conn); setIsModalOpen(true); }} title="Edit">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(conn.id)} title="Delete">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mt-2">
                Type: {conn.type.toUpperCase()} <br/>
                Host: {conn.host || 'N/A'}:{conn.port || ''}
              </div>
            </CardContent>
          </Card>
        ))}
        {connections.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-10">
            No connections found. Add one to get started.
          </div>
        )}
      </div>

      {isModalOpen && (
        <ConnectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={fetchConnections}
          initialData={editingConnection}
        />
      )}
    </div>
  );
}
