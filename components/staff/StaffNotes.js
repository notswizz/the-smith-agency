import React, { useState } from 'react';
import { 
  PencilSquareIcon, 
  XMarkIcon,
  TrashIcon,
  DocumentTextIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import useStore from '@/lib/hooks/useStore';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

// Format the date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
};

export default function StaffNotes({ staffId, staffMember }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addStaffNote, deleteStaffNote } = useStore();

  const notes = staffMember?.notes || [];

  const handleOpenModal = () => {
    setNoteText('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addStaffNote(staffId, noteText);
      setNoteText('');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      await deleteStaffNote(staffId, noteId);
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note. Please try again.');
    }
  };

  return (
    <>
      <Card
        title="Staff Notes"
        icon={<DocumentTextIcon className="h-5 w-5 text-gray-500" />}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenModal}
            className="flex items-center"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Note
          </Button>
        }
      >
        {notes.length > 0 ? (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500">
                    {formatDate(note.createdAt)}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-2 text-gray-700 whitespace-pre-wrap">{note.text}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="bg-gray-100 p-3 rounded-full text-gray-400 mb-3">
              <DocumentTextIcon className="h-6 w-6" />
            </div>
            <p className="text-gray-500 text-sm">No notes added yet.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-4 flex items-center"
              onClick={handleOpenModal}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add First Note
            </Button>
          </div>
        )}
      </Card>

      {/* Modal for adding a new note */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">
                Add Note for {staffMember.name}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitNote}>
              <div className="p-4">
                <label htmlFor="note-text" className="block text-sm font-medium text-gray-700 mb-2">
                  Note
                </label>
                <textarea
                  id="note-text"
                  rows="5"
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter note details..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  required
                ></textarea>
              </div>
              
              <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={isSubmitting || !noteText.trim()}
                  className="inline-flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <PencilSquareIcon className="h-4 w-4 mr-1" />
                      Save Note
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 