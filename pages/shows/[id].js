import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '@/components/ui/DashboardLayout';
import Button from '@/components/ui/Button';
import useStore from '@/lib/hooks/useStore';
import { formatDate } from '@/utils/dateUtils';
import { 
  CalendarIcon,
  ArrowLeftIcon,
  UserIcon,
  PlayIcon,
  PauseIcon
} from '@heroicons/react/24/outline';
// Removed PDF libs; we'll open a printable payroll view in a new window

export default function ShowProfile() {
  const router = useRouter();
  const { id } = router.query;
  const { shows, staff, bookings, clients } = useStore();

  const [showData, setShowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookings, setShowBookings] = useState([]);
  const [viewMode, setViewMode] = useState('bookings'); // 'bookings' | 'payroll'
  

  // Fetch show data and related bookings
  useEffect(() => {
    if (id && shows.length > 0) {
      const show = shows.find(s => s.id === id);
      if (show) {
        setShowData(show);
        // no inline editing; just keep show data

        // Get bookings for this show
        const relatedBookings = bookings.filter(booking => booking.showId === id);
        setShowBookings(relatedBookings);
      }
      setLoading(false);
    }
  }, [id, shows, bookings]);

  // No editing handlers (removed)

  // Helper to get client name for a booking
  const getClientName = (booking) => {
    if (booking.clientName) return booking.clientName;
    if (booking.clientId && Array.isArray(clients)) {
      const client = clients.find(c => c.id === booking.clientId);
      if (client) return client.name;
    }
    return 'Client';
  };

  // No submit handler (editing removed)

  // Build payroll data for the show (per staff: days worked and pay rate)
  const buildPayrollData = () => {
    const staffIdToSummary = {};
    showBookings.forEach(booking => {
      (booking.datesNeeded || []).forEach(d => {
        (d.staffIds || []).filter(Boolean).forEach(staffId => {
          if (!staffIdToSummary[staffId]) {
            const s = staff.find(x => x.id === staffId) || {};
            const name = s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || '[NO NAME]';
            const rate = (typeof s.payRate === 'number') ? s.payRate : (parseFloat(s.payRate) || 0);
            staffIdToSummary[staffId] = { name, rate, days: 0 };
          }
          staffIdToSummary[staffId].days += 1;
        });
      });
    });
    return Object.values(staffIdToSummary).sort((a, b) => a.name.localeCompare(b.name));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const HOURS_PER_DAY = 9;

  // Memoized payroll data for inline display (must be before any early returns)
  const payrollData = useMemo(() => buildPayrollData(), [showBookings, staff]);
  const grandTotal = useMemo(() => payrollData.reduce((sum, p) => sum + (p.days * HOURS_PER_DAY * (p.rate || 0)), 0), [payrollData]);

  // Open printable payroll view in a new window
  const handleOpenPayroll = () => {
    const payroll = buildPayrollData();
    const totalOwed = payroll.reduce((sum, p) => sum + (p.days * HOURS_PER_DAY * (p.rate || 0)), 0);
    const showRange = `${formatDate(showData.startDate)} - ${formatDate(showData.endDate)}`;
    const rowsHtml = payroll.map(p => {
      const total = (p.days || 0) * (p.rate || 0);
      return '<tr>' +
        `<td>${p.name}</td>` +
        `<td class="num">${p.days}</td>` +
        `<td class="num">${formatCurrency(p.rate || 0)} / hr</td>` +
        `<td class="num">${formatCurrency(total)}</td>` +
      '</tr>';
    }).join('');

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Payroll – ${showData.name}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif; color: #0f172a; margin: 24px; }
      .header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
      .title { font-size: 22px; font-weight: 800; }
      .subtitle { color: #475569; font-size: 13px; }
      .table { width: 100%; border-collapse: collapse; margin-top: 12px; }
      .table th { text-align: left; font-size: 12px; color: #334155; background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 10px; }
      .table td { font-size: 13px; border-bottom: 1px solid #e2e8f0; padding: 10px; }
      .num { text-align: right; }
      .footer { margin-top: 16px; display: flex; justify-content: flex-end; }
      .total { font-weight: 800; font-size: 14px; }
      @media print { .print-hide { display: none; } body { margin: 12mm; } }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="title">Payroll – ${showData.name}</div>
        <div class="subtitle">${showRange} • ${showData.location || ''}</div>
      </div>
      <button class="print-hide" onclick="window.print()" style="padding:8px 12px;border:1px solid #e2e8f0;border-radius:8px;background:#fff;cursor:pointer">Print</button>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>Staff</th>
          <th class="num">Days</th>
          <th class="num">Rate (hr)</th>
          <th class="num">Total Owed</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
    <div class="footer"><div class="total">Hours/day: ${HOURS_PER_DAY} • Grand Total: ${formatCurrency(totalOwed)}</div></div>
  </body>
</html>`;

    let w = window.open('about:blank', '_blank', 'noopener');
    if (!w) {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      return;
    }
    try {
      w.document.open();
      w.document.write(html);
      w.document.close();
      w.focus();
    } catch (e) {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      w.location.href = url;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!showData) {
    return (
      <DashboardLayout>
        <div className="text-center p-6">
          <h2 className="text-xl font-semibold text-secondary-800">Show not found</h2>
          <p className="mt-2 text-secondary-600">The show you're looking for doesn't exist or has been removed.</p>
          <Link href="/shows">
            <Button variant="primary" className="mt-4">
              Return to Shows Directory
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <Head>
        <title>{showData.name} | The Smith Agency</title>
        <meta name="description" content={`Details for ${showData.name} at The Smith Agency`} />
      </Head>

      <DashboardLayout>
        <div className="space-y-6">
          {/* Back button and header */}
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              <Link href="/shows" className="mr-4">
                <Button variant="outline" size="sm" className="flex items-center">
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  Back
                </Button>
              </Link>
              <h1 className="text-3xl font-extrabold text-primary-800 ml-2 drop-shadow-sm">{showData.name}</h1>
            </div>
            <div className="flex space-x-3"></div>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-end">
            <div className="inline-flex rounded-lg border border-secondary-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('payroll')}
                className={`px-3 sm:px-4 py-1.5 text-sm font-medium ${viewMode === 'payroll' ? 'bg-primary-600 text-white' : 'bg-white text-secondary-700 hover:bg-secondary-50'}`}
              >
                Payroll
              </button>
              <button
                type="button"
                onClick={() => setViewMode('bookings')}
                className={`px-3 sm:px-4 py-1.5 text-sm font-medium border-l border-secondary-200 ${viewMode === 'bookings' ? 'bg-primary-600 text-white' : 'bg-white text-secondary-700 hover:bg-secondary-50'}`}
              >
                Bookings
              </button>
            </div>
          </div>

          {/* Payroll Section */}
          {viewMode === 'payroll' && (
          <div className="bg-white shadow rounded-xl p-6 border border-secondary-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center text-lg text-secondary-700 font-semibold">
                <CalendarIcon className="h-5 w-5 mr-2 text-primary-500" />
                <span>{formatDate(showData.startDate)} - {formatDate(showData.endDate)}</span>
              </div>
              <div className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                (showData.status || 'active') === 'active' 
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                  : 'bg-secondary-100 text-secondary-700 border border-secondary-200'
              }`}>
                {(showData.status || 'active') === 'active' ? (
                  <>
                    <PlayIcon className="h-4 w-4 mr-1" />
                    Active
                  </>
                ) : (
                  <>
                    <PauseIcon className="h-4 w-4 mr-1" />
                    Inactive
                  </>
                )}
              </div>
            </div>
            <div className="mb-3 text-secondary-700">Payroll for this show</div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-secondary-200">
                <thead className="bg-secondary-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-secondary-600 uppercase tracking-wider">Staff</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">Days</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">Rate</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-secondary-600 uppercase tracking-wider">Total Owed</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-secondary-100">
                  {payrollData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-4 py-6 text-center text-sm text-secondary-500">No staff assigned yet for this show.</td>
                    </tr>
                  ) : (
                    payrollData.map((p, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 text-sm font-medium text-secondary-900">{p.name}</td>
                        <td className="px-4 py-2 text-sm text-secondary-700 text-right">{p.days}</td>
                        <td className="px-4 py-2 text-sm text-secondary-700 text-right">{formatCurrency(p.rate || 0)}<span className="text-2xs text-secondary-500">/hr</span></td>
                        <td className="px-4 py-2 text-sm font-semibold text-secondary-900 text-right">{formatCurrency((p.days || 0) * HOURS_PER_DAY * (p.rate || 0))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="px-4 py-3 text-sm font-semibold text-secondary-900" colSpan="3">Grand Total</td>
                    <td className="px-4 py-3 text-sm font-extrabold text-secondary-900 text-right">{formatCurrency(grandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          )}

          {/* Bookings Section - always visible, compact view */}
          {viewMode === 'bookings' && (
          <div id="bookings-pdf-section" className="bg-white shadow-lg rounded-xl p-6 border border-secondary-200">
            <div className="mb-4 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-secondary-900">Bookings</h3>
                <p className="text-md text-secondary-600">
                  {showBookings.length} booking{showBookings.length !== 1 ? 's' : ''} for this show
                </p>
              </div>
            </div>
            {showBookings.length === 0 ? (
              <div className="text-center p-6 bg-secondary-50 rounded-lg">
                <UserIcon className="h-8 w-8 mx-auto text-secondary-400" />
                <h3 className="mt-2 text-lg font-medium text-secondary-900">No bookings yet</h3>
                <p className="mt-1 text-md text-secondary-600">
                  Get started by assigning staff members to this show.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {showBookings.map((booking) => {
                  // Calculate total staff assigned and total days
                  const totalDays = Array.isArray(booking.datesNeeded) ? booking.datesNeeded.filter(d => (d.staffCount || 0) > 0).length : 0;
                  const staffSet = new Set();
                  const staffDaysById = {};
                  if (Array.isArray(booking.datesNeeded)) {
                    booking.datesNeeded.forEach(date => {
                      if (Array.isArray(date.staffIds)) {
                        date.staffIds.filter(Boolean).forEach(id => {
                          staffSet.add(id);
                          staffDaysById[id] = (staffDaysById[id] || 0) + 1;
                        });
                      }
                    });
                  }
                  const totalStaff = staffSet.size;
                  // List unique staff assigned with number of days beside name
                  const staffList = Array.from(staffSet).map(staffId => {
                    const staffMember = staff.find(s => s.id === staffId) || {};
                    const name = staffMember.firstName ? `${staffMember.firstName} ${staffMember.lastName}` : (staffMember.name || 'Staff');
                    const days = staffDaysById[staffId] || 0;
                    return `${name} (${days})`;
                  });
                  // Extract first contact and showroom/booth location if available on booking
                  const primaryContact = booking.primaryContact || booking.primaryContactName || null;
                  const primaryLocation = booking.primaryLocation || booking.primaryLocationName || booking.location || null;
                  return (
                    <div key={booking.id} className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg shadow border border-secondary-200 hover:shadow-lg transition-shadow p-4 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-lg font-semibold text-primary-700">{getClientName(booking)}</div>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800' 
                            : booking.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Pending'}
                        </span>
                      </div>
                      <div className="text-sm text-secondary-700 mb-2">
                        <span className="font-medium">Notes:</span> {booking.notes || '—'}
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-xs text-secondary-700">
                        {primaryLocation && (
                          <div>
                            <span className="font-semibold">Showroom:</span> {primaryLocation}
                          </div>
                        )}
                        {primaryContact && (
                          <div>
                            <span className="font-semibold">Contact:</span> {primaryContact}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm text-secondary-700">
                        <div><span className="font-medium">Total Days:</span> {totalDays}</div>
                        <div><span className="font-medium">Staff Assigned:</span> {totalStaff}</div>
                      </div>
                      {staffList.length > 0 && (
                        <div className="mt-2 text-xs text-secondary-700">
                          <span className="font-medium">Staff Working:</span> {staffList.join(', ')}
                        </div>
                      )}
                      <div className="mt-auto flex justify-end pt-4">
                        <Link href={`/bookings/${booking.id}`} className="text-primary-600 hover:text-primary-900 text-sm font-medium">
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )}
        </div>
      </DashboardLayout>
    </>
  );
} 