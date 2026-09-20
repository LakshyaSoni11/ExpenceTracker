import React, { useState } from 'react';
import { Plus, X, Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/api/axios';

const GroupModal = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState([]);

  const resetForm = () => {
    setName('');
    setQuery('');
    setResults([]);
    setSelected([]);
  };

  const searchUsers = async (q) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get('/users/search', { params: { q } });
      const existing = new Set(selected.map((s) => s._id));
      setResults(res.data.filter((u) => !existing.has(u._id)));
    } catch {
      toast.error("Failed to search users");
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = (user) => {
    setSelected((prev) => [...prev, user]);
    setQuery('');
    setResults([]);
  };

  const handleRemove = (id) => {
    setSelected((prev) => prev.filter((s) => s._id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    if (selected.length === 0) {
      toast.error("Add at least 1 other member");
      return;
    }

    onSubmit({
      name: name.trim(),
      members: selected.map((s) => s._id)
    });

    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900">Create New Group</DialogTitle>
          <DialogDescription>
            Give your group a name and add registered members (you're added automatically; they'll be invited and must accept)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-medium text-slate-700">
              Group Name
            </Label>
            <input
              id="groupName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="e.g., Vegas Trip, Roommates, Office Lunch"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">Members</Label>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                placeholder="Search by email or name"
              />
              {query.trim() && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                  {searching ? (
                    <p className="px-4 py-2 text-sm text-slate-500">Searching...</p>
                  ) : results.length === 0 ? (
                    <p className="px-4 py-2 text-sm text-slate-500">No users found</p>
                  ) : (
                    results.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => handleAdd(user)}
                        className="w-full text-left px-4 py-2 hover:bg-emerald-50 flex items-center gap-3 transition-colors"
                      >
                        <Users className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-sm font-medium text-slate-900 truncate">{user.name}</span>
                        <span className="text-xs text-slate-500 truncate">{user.email}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {selected.length > 0 && (
              <div className="space-y-2">
                {selected.map((user) => (
                  <div key={user._id} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="flex-1 text-sm font-medium text-slate-900 truncate">{user.name}</span>
                    <span className="text-xs text-slate-500 hidden sm:block truncate">{user.email}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(user._id)}
                      className="h-6 w-6 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="w-full border-dashed border-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Member (Search)
            </Button>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
            >
              Create Group
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GroupModal;