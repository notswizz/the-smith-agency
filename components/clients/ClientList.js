import React from 'react';
import Link from 'next/link';
import {
	CalendarIcon
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/router';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ClientList({ clients, view = 'grid' }) {
	return (
		<div className="space-y-4 sm:space-y-6">
			{view === 'grid' ? (
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 snap-y snap-mandatory overflow-y-auto sm:overflow-visible">
					{clients.map((client) => (
						<ClientCard key={client.id} client={client} />
					))}
				</div>
			) : (
				<ClientTable clients={clients} />
			)}
		</div>
	);
}

function ClientCard({ client }) {
	const router = useRouter();
	const totalStaffDays = client.totalStaffDays || 0;
	// Variant palette (soft, professional tints)
	const palette = (() => {
		const variants = [
			{ bar: 'from-pink-50 via-pink-100 to-pink-50', hoverBorder: 'hover:border-pink-200' },
			{ bar: 'from-blue-50 via-blue-100 to-blue-50', hoverBorder: 'hover:border-blue-200' },
			{ bar: 'from-emerald-50 via-emerald-100 to-emerald-50', hoverBorder: 'hover:border-emerald-200' },
			{ bar: 'from-violet-50 via-violet-100 to-violet-50', hoverBorder: 'hover:border-violet-200' },
			{ bar: 'from-amber-50 via-amber-100 to-amber-50', hoverBorder: 'hover:border-amber-200' },
		];
		const key = String(client.id || client.name || '');
		let sum = 0;
		for (let i = 0; i < key.length; i++) sum = (sum + key.charCodeAt(i)) % 2147483647;
		const idx = key ? sum % variants.length : 0;
		return variants[idx];
	})();

	return (
		<Link href={`/clients/${client.id}`} className="block">
			<div className={`relative rounded-2xl bg-white border border-gray-200/80 transition-all shadow-sm hover:shadow-xl hover:shadow-gray-200/60 ${palette.hoverBorder} group`}>
				{/* Accent bar */}
				<div className={`h-1 w-full bg-gradient-to-r ${palette.bar}`} />

				{/* Days booked badge */}
				<div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full bg-white/85 backdrop-blur border border-gray-200 text-gray-700 shadow-sm">
					<CalendarIcon className="h-3.5 w-3.5 text-gray-500" />
					<span>{totalStaffDays}</span>
				</div>

				{/* Company name */}
				<div className="px-5 py-8 text-center">
					<h3 className="text-slate-900 text-base font-semibold leading-snug tracking-wide line-clamp-2 max-h-[3.2rem]">
						{client.name}
					</h3>
				</div>

				{/* Subtle bottom border on hover for depth */}
				<div className="h-0.5 w-full bg-gradient-to-r from-transparent via-gray-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
			</div>
		</Link>
	);
}

// Add ClientTable component
function ClientTable({ clients }) {
	return (
		<div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shows (Total)</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Booked</th>
						<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{clients.map((client) => (
						<tr key={client.id} className="hover:bg-gray-50">
							<td className="px-6 py-4 whitespace-nowrap">
								<div className="flex items-center">
									<div>
										<div className="font-medium text-gray-900">{client.name}</div>
										{client.industry && (
											<div className="text-gray-500 text-sm">{client.industry}</div>
										)}
									</div>
								</div>
							</td>
							<td className="px-6 py-4 whitespace-nowrap">
								{client.location && (
									<div className="flex items-center text-sm text-gray-600">
										<span>{client.location}</span>
									</div>
								)}
							</td>
							<td className="px-6 py-4 whitespace-nowrap">
								<div className="text-sm">
									{client.email && (
										<div className="flex items-center text-sm text-gray-600">
											<a href={`mailto:${client.email}`} className="hover:text-primary-600">
												{client.email}
											</a>
										</div>
									)}
									{client.phone && (
										<div className="flex items-center mt-1 text-sm text-gray-600">
											<a href={`tel:${client.phone}`} className="hover:text-primary-600">
												{client.phone}
											</a>
										</div>
									)}
								</div>
							</td>
							<td className="px-6 py-4 whitespace-nowrap">
								<div className="flex items-center text-sm text-gray-600">
									<span>
										{Array.isArray(client.shows) ? client.shows.length : 0} total
									</span>
								</div>
							</td>
							<td className="px-6 py-4 whitespace-nowrap">
								<div className="flex items-center text-sm text-gray-600">
									<span className="font-medium">
										{client.totalStaffDays || 0}
									</span>
								</div>
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
								<div className="flex justify-end gap-2">
									<Link href={`/clients/${client.id}`}>
										<button className="inline-flex items-center px-2.5 py-1.5 border border-primary-300 shadow-sm text-xs font-medium rounded text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-1 focus:ring-primary-500">
											View
										</button>
									</Link>
									<Link href={`/clients/${client.id}?edit=true`}>
										<button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-500">
											Edit
										</button>
									</Link>
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
} 