import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserGroupIcon, ArrowRightIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import useStore from '@/lib/hooks/useStore';

export default function RecentStaffSignups() {
  const { staff } = useStore();
  
  // Use createdAt field to find the most recent staff signups
  const recentStaff = React.useMemo(() => {
    if (!staff || !Array.isArray(staff) || staff.length === 0) {
      return [];
    }
    
    // Copy the array and sort by createdAt (newest first)
    return [...staff]
      .filter(member => member && member.createdAt)
      .sort((a, b) => {
        // Sort by createdAt timestamp (newest first)
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      })
      .slice(0, 2); // Take just the first 2
  }, [staff]);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <UserPlusIcon className="h-5 w-5 mr-2 text-violet-600" />
          <h3 className="text-base font-medium text-secondary-900">Recent Staff Signups</h3>
        </div>
        <Link href="/staff" className="text-sm text-violet-600 hover:text-violet-800 flex items-center">
          View all
          <ArrowRightIcon className="ml-1 h-4 w-4" />
        </Link>
      </div>
      
      {recentStaff.length > 0 ? (
        <div className="space-y-3">
          {recentStaff.map((member, index) => {
            if (!member) return null;
            
            // Get name from either name field or first/last name
            const displayName = member.name || 
              `${member.firstName || ''} ${member.lastName || ''}`.trim() || 
              'Staff Member';
            
            // Format the signup date
            const signupDate = new Date(member.createdAt).toLocaleDateString();
            
            // Check for profile image (from any of the possible fields)
            const profileImage = member.image || member.photoURL || member.photoUrl || member.profileImage || member.picture;
              
            return (
              <Link 
                key={member.id || index} 
                href={`/staff/${member.id}`}
                className="flex items-center p-3 rounded-lg bg-violet-50 border border-violet-100 hover:bg-violet-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mr-3 bg-violet-500 text-white flex items-center justify-center font-medium text-sm shadow-sm border border-violet-200">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt={displayName}
                      width={40}
                      height={40}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    displayName.charAt(0)
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-secondary-900">{displayName}</div>
                  <div className="flex items-center justify-between">
                    {member.location && (
                      <div className="text-xs text-secondary-500">{member.location}</div>
                    )}
                    <div className="text-xs text-violet-500 ml-auto">
                      {signupDate}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center p-4 bg-secondary-50 rounded-lg">
          <UserGroupIcon className="h-8 w-8 mx-auto text-secondary-400 mb-2" />
          <p className="text-secondary-500 text-sm">No recent signups</p>
        </div>
      )}
    </div>
  );
} 