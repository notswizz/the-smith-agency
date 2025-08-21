import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UserGroupIcon, ArrowRightIcon, UserPlusIcon, MapPinIcon } from '@heroicons/react/24/outline';
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

  // Helper function to get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Helper function to get avatar background color
  const getAvatarColor = (name) => {
    if (!name) return 'bg-secondary-500';
    const colors = [
      'bg-violet-500',
      'bg-indigo-500', 
      'bg-blue-500',
      'bg-emerald-500',
      'bg-amber-500',
      'bg-rose-500',
      'bg-purple-500',
      'bg-cyan-500'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div>
      {/* Enhanced Header (theme-aligned) */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-white border border-black-900/10 flex items-center justify-center mr-3 shadow-sm">
            <UserPlusIcon className="h-4 w-4 text-primary-500" />
          </div>
          <h3 className="text-lg font-semibold text-black-950">Recent Staff Signups</h3>
        </div>
        <Link 
          href="/staff" 
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center group transition-colors"
        >
          View all
          <ArrowRightIcon className="ml-1 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
      
      {recentStaff.length > 0 ? (
        <div className="space-y-4">
          {recentStaff.map((member, index) => {
            if (!member) return null;
            
            // Get name from either name field or first/last name
            const displayName = member.name || 
              `${member.firstName || ''} ${member.lastName || ''}`.trim() || 
              'Staff Member';
            
            // Format the signup date
            const signupDate = new Date(member.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
            
            // Check for profile image (from any of the possible fields)
            const profileImage = member.image || member.photoURL || member.photoUrl || member.profileImage || member.picture;
            const initials = getInitials(displayName);
            const avatarColor = getAvatarColor(displayName);
              
            return (
              <Link 
                key={member.id || index} 
                href={`/staff/${member.id}`}
                className="group block p-4 rounded-xl bg-white/95 border border-secondary-100 hover:border-secondary-200 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center">
                  {/* Enhanced Avatar */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 mr-4 shadow-lg border border-black-900/10 group-hover:scale-105 transition-transform">
                    {profileImage ? (
                      <Image
                        src={profileImage}
                        alt={displayName}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`w-full h-full ${avatarColor} text-white flex items-center justify-center font-semibold text-sm ${
                        profileImage ? 'hidden' : 'flex'
                      }`}
                    >
                      {initials}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-black-950 text-base leading-tight group-hover:text-secondary-800 transition-colors">
                          {displayName}
                        </h4>
                        {member.location && (
                          <div className="flex items-center text-sm text-secondary-600 mt-0.5">
                            <MapPinIcon className="h-3 w-3 mr-1 text-primary-500" />
                            <span className="leading-tight">{member.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Signup Date */}
                      <div className="flex items-center px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200 ml-3 flex-shrink-0">
                        <span className="text-xs font-medium text-primary-700">
                          {signupDate}
                        </span>
                      </div>
                    </div>
                    
                    {/* Additional Info */}
                    {member.email && (
                      <div className="text-sm text-secondary-500 leading-tight">
                        {member.email}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 px-6 bg-white/95 rounded-xl border border-secondary-200/50">
          <div className="w-16 h-16 rounded-full bg-secondary-200 flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="h-8 w-8 text-secondary-400" />
          </div>
          <p className="text-secondary-600 font-medium">No recent signups</p>
          <p className="text-secondary-500 text-sm mt-1">New staff members will appear here</p>
        </div>
      )}
    </div>
  );
} 