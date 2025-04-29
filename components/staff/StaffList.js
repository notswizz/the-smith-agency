import React from 'react';
import Link from 'next/link';
import {
  EnvelopeIcon,
  PhoneIcon,
  PencilSquareIcon,
  UserCircleIcon,
  BriefcaseIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function StaffList({ staff = [], view = 'grid' }) {
  return (
    <div className="space-y-6">
      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {staff && staff.map((staffMember) => (
            <StaffCard key={staffMember.id} staffMember={staffMember} />
          ))}
        </div>
      ) : (
        <StaffTable staff={staff || []} />
      )}
    </div>
  );
}

function StaffCard({ staffMember }) {
  const profileImage = staffMember.photoURL || null;
  const initials = `${staffMember.firstName?.charAt(0) || ''}${staffMember.lastName?.charAt(0) || ''}`.toUpperCase();

  return (
    <Card className="group transition-all duration-300 hover:shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 h-12"></div>
      <div className="px-5 pt-5 pb-5 space-y-5">
        <div className="flex items-start space-x-4">
          <div className="relative -mt-10">
            {profileImage ? (
              <img
                src={profileImage}
                alt={`${staffMember.firstName} ${staffMember.lastName}`}
                className="h-16 w-16 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center border-2 border-white text-primary-700 text-xl font-semibold">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-grow">
            <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
              {staffMember.firstName} {staffMember.lastName}
            </h3>
            <div className="flex items-center mt-1">
              <BriefcaseIcon className="h-4 w-4 text-secondary-400 mr-1" />
              <span className="text-sm text-secondary-500">{staffMember.role}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center text-sm text-secondary-700">
            <div className="bg-primary-50 p-1.5 rounded-full mr-2.5 text-primary-500">
              <IdentificationIcon className="h-4 w-4" />
            </div>
            <span>ID: {staffMember.id.substring(0, 8)}</span>
          </div>
          
          <div className="flex items-center text-sm text-secondary-700">
            <div className="bg-primary-50 p-1.5 rounded-full mr-2.5 text-primary-500">
              <EnvelopeIcon className="h-4 w-4" />
            </div>
            <a 
              href={`mailto:${staffMember.email}`}
              className="truncate hover:text-primary-600 transition-colors"
            >
              {staffMember.email}
            </a>
          </div>
          
          {staffMember.phone && (
            <div className="flex items-center text-sm text-secondary-700">
              <div className="bg-primary-50 p-1.5 rounded-full mr-2.5 text-primary-500">
                <PhoneIcon className="h-4 w-4" />
              </div>
              <a 
                href={`tel:${staffMember.phone}`}
                className="hover:text-primary-600 transition-colors"
              >
                {staffMember.phone}
              </a>
            </div>
          )}
        </div>

        <div className="border-t border-secondary-200 pt-4 flex justify-end">
          <Link href={`/staff/${staffMember.id}/edit`}>
            <Button variant="outline" size="sm" className="flex items-center">
              <PencilSquareIcon className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
} 