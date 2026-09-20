import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const GroupModal = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [members, setMembers] = useState(['', '']);

  const resetForm = () => {
    setName('');
    setMembers(['', '']);
  };

  const addMember = () => {
    setMembers([...members, '']);
  };

  const removeMember = (index) => {
    if (members.length > 2) {
      setMembers(members.filter((_, i) => i !== index));
    }
  };

  const updateMember = (index, value) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    const validMembers = members.filter(m => m.trim() !== '');
    if (validMembers.length < 2) {
      toast.error("Please add at least 2 members");
      return;
    }

    onSubmit({
      name: name.trim(),
      members: validMembers
    });

    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gray-300">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-slate-900">Create New Group</DialogTitle>
          <DialogDescription>
            Add a group name and at least 2 members to get started
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="e.g., Vegas Trip, Roommates, Office Lunch"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-slate-700">
              Members (Minimum 2)
            </Label>
            {members.map((member, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={member}
                  onChange={(e) => updateMember(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder={`Member ${index + 1} name`}
                />
                {members.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMember(index)}
                    className="hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={addMember}
              className="w-full border-dashed border-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Another Member
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