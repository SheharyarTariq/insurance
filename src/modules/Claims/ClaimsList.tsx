import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Import,
  Plus,
  Filter,
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { deleteClaim, getClaims } from '../../services/Claims/Claims.tsx';
import "react-datepicker/dist/react-datepicker.css";
import { useDispatch } from "react-redux";
import { setIsClosed } from '../../redux/Claim/claimSlice.tsx';
import type { SortDescriptor } from "react-aria-components";
import { DateRangePicker } from "../../components/application/date-picker/date-range-picker.tsx";
import { Table, TableCard, TableRowActionsDropdown } from "../../components/application/table/table.tsx";
import { PaginationCardMinimal } from "../../components/application/pagination/pagination.tsx";
import { Avatar } from "../../components/base/avatar/avatar.tsx";
import { BadgeWithDot } from "../../components/base/badges/badges.tsx";

interface Claim {
  id: number;
  abroad_date?: string | null;
  any_passengers?: string | null;
  case_status_id?: number | null;
  case_status_label?: string | null;
  claim_type_id?: number | null;
  claim_type_label?: string | null;
  client_going_abroad?: boolean | null;
  client_injured?: string | null;
  credit_hire_accepted?: boolean | null;
  file_closed_at?: string | null;
  file_closed_reason?: string | null;
  file_opened_at?: string | null;
  handler_id?: number | null;
  handler_label?: string | null;
  is_locked?: boolean | null;
  manager_notified_at?: string | null;
  non_fault_accident?: string | null;
  present_position_id?: number | null;
  present_position_label?: string | null;
  prospect_label?: string | null;
  prospects_id?: number | null;
  source_id?: number | null;
  source_label?: string | null;
  source_staff_label?: string | null;
  source_staff_user_id?: number | null;
  target_debt_id?: number | null;
  target_debt_label?: string | null;
}

function Claims() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClaims, setSelectedClaims] = useState<Claim[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [setIsMobile] = useState(window.innerWidth < 768);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const navigate = useNavigate();
  const [openOptions, setOpenOptions] = useState(null)
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  const dispatch = useDispatch();

  const handleRowClick = (claimId: number, e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    setOpenOptions(!openOptions)
  
    if (
      target.closest('input[type="checkbox"]') ||
      target.closest('button') ||
      target.closest('svg')
    ) {
      return;
    }
  
    navigate(`/claim/${claimId}`);
  };
  

  useEffect(() => {
    fetchClaims();
    dispatch({ type: "RESET_STORE" });
    dispatch(setIsClosed(false))
  }, []);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const response = await getClaims();
      const responseData = Array.isArray(response)
        ? (response.length > 0 && Array.isArray(response[0]) ? response[0] : response)
        : response.data || response;

      if (!responseData) {
        throw new Error('No data received from API');
      }

      const claimsArray = (Array.isArray(responseData) ? responseData : [responseData]).map(claim => ({
        ...claim,
        abroad_date: claim.abroad_date || null,
        any_passengers: claim.any_passengers || null,
        case_status_label: claim.case_status_label || null,
        claim_type_label: claim.claim_type_label || null,
        client_injured: claim.client_injured || null,
        handler_label: claim.handler_label || null,
        present_position_label: claim.present_position_label || null,
        source_label: claim.source_label || null,
        source_staff_label: claim.source_staff_label || null,
      }));

      setClaims(claimsArray);
    } catch (err) {
      console.error('Error details:', err);
      setError('Failed to fetch claims. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredClaims = useMemo(() => {
    let filtered = claims.filter((claim) => {
      const searchLower = searchQuery.toLowerCase();

      const matchesSearch =
        searchQuery === "" ||
        claim.source_staff_label?.toLowerCase().includes(searchLower) ||
        claim.handler_label?.toLowerCase().includes(searchLower) ||
        claim.claim_type_label?.toLowerCase().includes(searchLower) ||
        claim.case_status_label?.toLowerCase().includes(searchLower) ||
        claim.client_injured?.toLowerCase().includes(searchLower);

      let matchesDate = true;
      if (startDate && endDate && claim.file_opened_at) {
        const claimDate = new Date(claim.file_opened_at);
        matchesDate =
          claimDate >= new Date(startDate.setHours(0, 0, 0, 0)) &&
          claimDate <= new Date(endDate.setHours(23, 59, 59, 999));
      }

      return matchesSearch && matchesDate;
    });

    if (sortDescriptor.column) {
      filtered.sort((a, b) => {
        const first = a[sortDescriptor.column as keyof Claim];
        const second = b[sortDescriptor.column as keyof Claim];

        if (first === null || first === undefined) return sortDescriptor.direction === "ascending" ? -1 : 1;
        if (second === null || second === undefined) return sortDescriptor.direction === "ascending" ? 1 : -1;

        if (typeof first === "string" && typeof second === "string") {
          let cmp = first.localeCompare(second);
          return sortDescriptor.direction === "descending" ? -cmp : cmp;
        }

        return 0;
      });
    }

    return filtered;
  }, [claims, searchQuery, startDate, endDate, sortDescriptor]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredClaims.length / pageSize);
  const paginatedClaims = filteredClaims.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    localStorage.removeItem('isClosed')
  }, [selectedClaims, paginatedClaims]);


  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleDeleteClaim = async (id: number) => {
    try {
      await deleteClaim(id);
      await fetchClaims();
      setCurrentPage(1)
    } catch (e) {
      console.log(e);
    }
  };

  const getStatusColor = (status: string | null | undefined) => {
    if (!status) return 'gray';
    const statusLower = status.toLowerCase();

    if (statusLower.includes('approve') || statusLower.includes('accept') || statusLower.includes('complete'))
      return 'gray';
    if (statusLower.includes('cancel') || statusLower.includes('reject') || statusLower.includes('deny'))
      return 'error';
    if (statusLower.includes('pending') || statusLower.includes('progress') || statusLower.includes('process'))
      return 'warning';
    if (statusLower.includes('close') || statusLower.includes('done') || statusLower.includes('finish'))
      return 'gray';
    if (statusLower.includes('new') || statusLower.includes('open') || statusLower.includes('active'))
      return 'blue';

    return 'brand';
  };

  const getStatusTextColor = (status: string | null | undefined) => {
    if (!status) return 'text-gray-700';
    const statusLower = status.toLowerCase();

    if (statusLower.includes('approve') || statusLower.includes('accept') || statusLower.includes('complete'))
      return 'text-green-800 bg-green-600/20';
    if (statusLower.includes('cancel') || statusLower.includes('reject') || statusLower.includes('deny'))
      return 'text-red-800 bg-red-600/20';
    if (statusLower.includes('pending') || statusLower.includes('progress') || statusLower.includes('process'))
      return 'text-yellow-800 bg-yellow-600/20';
    if (statusLower.includes('close') || statusLower.includes('done') || statusLower.includes('finish'))
      return 'text-gray-700 bg-gray-600/20';
    if (statusLower.includes('new') || statusLower.includes('open') || statusLower.includes('active'))
      return 'text-blue-800 bg-blue-600/20';

    return 'bg-[#414651] text-white';
  };

  const getSafeValue = (value: any, defaultValue: string = 'N/A') =>
    value !== null && value !== undefined ? value : defaultValue;

  return (
    <div className="min-h-screen font-semibold bg-white justify-center pr-14 pl-28 py-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Claims Management</h1>
          <p className="text-gray-600 font-medium mt-1 md:mt-2">Manage and track all the claims in your queue</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button className="flex items-center justify-center px-4 py-2 shadow-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 w-full sm:w-auto">
            <Import className="h-4 w-4 mr-2" />
            Import
          </button>
          <button
            onClick={() => {
              dispatch(setIsClosed(false))
              navigate('/new-claim')
            }}
            className="flex items-center justify-center px-4 py-2 font-normal shadow-sm bg-custom text-white rounded-lg hover:bg-[#252B37] w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Claim
          </button>
        </div>
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full pb-6 gap-4">
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search for claims"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1); // reset to page 1 when searching
            }}
            className="w-full pl-10 pr-4 py-2 md:py-3 border shadow-sm border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>

        <div className="relative w-full md:w-auto">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center px-3 py-2 shadow-sm rounded-lg text-sm text-gray-700 hover:bg-gray-50 w-full md:w-auto justify-center border border-gray-300"
          >
            <Filter className="h-4 w-4 mr-2 text-gray-500" />
            Filters
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-10 p-4">
              <h4 className="text-sm font-semibold mb-2 text-gray-800">Filter by File Opened Date</h4>
              <DateRangePicker
                selectsRange
                startDate={startDate}
                endDate={endDate}
                onChange={(update) => {
                  if (!update) {
                    setDateRange([null, null]);
                    return;
                  }

                  const start = update.start
                    ? new Date(update.start.year, update.start.month - 1, update.start.day)
                    : null;

                  const end = update.end
                    ? new Date(update.end.year, update.end.month - 1, update.end.day)
                    : null;

                  setDateRange([start, end]);
                  setCurrentPage(1);
                }}

                isClearable
                placeholderText="Select date range"
                className="w-72 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-200 border-none"
                popperPlacement="bottom-start"
                popperModifiers={[
                  { name: "offset", options: { offset: [0, 4] } },
                  { name: "preventOverflow", options: { padding: 8 } },
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-600">
          Loading claims...
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-red-600">
          {error}
        </div>
      ) : (
        <TableCard.Root size="sm" className="border border-gray-200 rounded-lg overflow-hidden">
          <Table
            aria-label="Claims"
            selectionMode="multiple"
            selectionBehavior="toggle" 
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            selectedKeys={selectedClaims.map(c => c.id.toString())}
            onSelectionChange={(keys) => {
              if (keys === "all") {
                setSelectedClaims(paginatedClaims);
              } else {
                const selectedIds = Array.from(keys).map(id => parseInt(id as string));
                setSelectedClaims(paginatedClaims.filter(claim => selectedIds.includes(claim.id)));
              }
            }}
          >
            <Table.Header className="bg-gray-100 text-gray-700">
              <Table.Head id="id" label="ID" isRowHeader allowsSorting className="" />
              <Table.Head id="source_staff_label" label="Client" isRowHeader allowsSorting className="" style={{fontSize: '12px'}} />
              <Table.Head id="claim_type_label" label="Claim Type" allowsSorting />
              <Table.Head id="case_status_label" label="Status" allowsSorting />
              <Table.Head id="handler_label" label="Handler" allowsSorting />
              <Table.Head id="client_injured" label="Injury" allowsSorting />
              <Table.Head id="actions" />
            </Table.Header>

            <Table.Body items={paginatedClaims}>
              {(claim) => (
                <Table.Row
                id={claim.id.toString()}
                onClick={(e) => handleRowClick(claim.id, e)}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <Table.Cell className="whitespace-nowrap text-gray-700" style={{ fontWeight: 500, fontFamily: 'Inter', fontSize: '14px' }}>
                  {claim.id}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Avatar
                      name={getSafeValue(claim.source_label)}
                      size="sm"
                    />
                    <p className="text-sm font-medium whitespace-nowrap text-gray-800" style={{ fontWeight: 500, fontFamily: 'Inter', fontSize: '14px' }}>
                      {getSafeValue(claim.source_label)}
                    </p>
                  </div>
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap text-gray-700" style={{ fontWeight: 500, fontFamily: 'Inter', fontSize: '14px' }}>
                  {getSafeValue(claim.claim_type_label)}
                </Table.Cell>
                <Table.Cell>
                  <BadgeWithDot
                    size="sm"
                    color={getStatusColor(claim.case_status_label)}
                    type="modern"
                    className={`font-medium ${getStatusTextColor(claim.case_status_label)}`}
                  >
                    {getSafeValue(claim.case_status_label)}
                  </BadgeWithDot>
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap text-gray-700" style={{ fontWeight: 500, fontFamily: 'Inter', fontSize: '14px' }}>
                  {getSafeValue(claim.handler_label, 'Unassigned')}
                </Table.Cell>
                <Table.Cell className="whitespace-nowrap text-gray-700" style={{ fontWeight: 500, fontFamily: 'Inter', fontSize: '14px' }}>
                  {getSafeValue(claim.client_injured)}
                </Table.Cell>
                <Table.Cell className="px-3">
                  <TableRowActionsDropdown onDelete={() => handleDeleteClaim(claim.id)} onEdit={() => {
                    navigate(`/claim/${claim.id}`);
                  }} />
                </Table.Cell>
              </Table.Row>
              
              )}
            </Table.Body>
          </Table>

          <PaginationCardMinimal
            align="right"
            page={currentPage}
            total={totalPages}
            onPageChange={handleNextPage}
            className="px-4 py-3 md:px-5 md:pt-3 md:pb-4 bg-gray-50 border-t border-gray-200"
          />
        </TableCard.Root>
      )}
    </div>
  );
}

export default Claims;  