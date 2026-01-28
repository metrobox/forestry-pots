import { useState, useEffect } from 'react';
import { getAllRFPs, updateRFPStatus } from '../../services/adminService';

const RFPsManagement = () => {
  const [rfps, setRfps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRFP, setSelectedRFP] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadRFPs();
  }, [statusFilter]);

  const loadRFPs = async () => {
    try {
      setLoading(true);
      const data = await getAllRFPs(statusFilter);
      setRfps(data);
    } catch (error) {
      console.error('Error loading RFPs:', error);
      setMessage({ type: 'error', text: 'Failed to load RFPs' });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (rfpId, newStatus) => {
    try {
      await updateRFPStatus(rfpId, newStatus);
      setMessage({ type: 'success', text: 'RFP status updated successfully' });
      loadRFPs();
      if (selectedRFP && selectedRFP.id === rfpId) {
        setSelectedRFP({ ...selectedRFP, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating RFP status:', error);
      setMessage({ type: 'error', text: 'Failed to update RFP status' });
    }
  };

  const handleViewDetails = (rfp) => {
    setSelectedRFP(rfp);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      New: 'bg-blue-100 text-blue-700 border-blue-200',
      Processing: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      Closed: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return styles[status] || styles.New;
  };

  const getStatusIcon = (status) => {
    const icons = {
      New: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      Processing: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      Closed: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    };
    return icons[status] || icons.New;
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">RFP Management</h2>
          <p className="text-sm text-gray-500">View and manage all RFP requests from users.</p>
        </div>
        
        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
          >
            <option value="">All Status</option>
            <option value="New">New</option>
            <option value="Processing">Processing</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Success/Error Message */}
      {message.text && (
        <div
          className={`mb-4 p-4 rounded-lg text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        ) : rfps.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium mb-1">No RFP requests found</p>
            <p className="text-sm">
              {statusFilter ? `No RFPs with status "${statusFilter}"` : 'No RFP requests have been submitted yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">RFP ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Products</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rfps.map((rfp) => (
                  <tr key={rfp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-gray-900">#{String(rfp.id).padStart(4, '0')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{rfp.user_name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{rfp.user_email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">{rfp.user_company || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          {rfp.products?.length || 0} product{(rfp.products?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={rfp.status}
                        onChange={(e) => handleStatusChange(rfp.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${getStatusBadge(rfp.status)}`}
                      >
                        <option value="New">New</option>
                        <option value="Processing">Processing</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {new Date(rfp.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(rfp.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleViewDetails(rfp)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RFP Details Modal */}
      {showDetailsModal && selectedRFP && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-xl z-10">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">RFP #{String(selectedRFP.id).padStart(4, '0')}</h3>
                  <p className="text-sm text-gray-500 mt-1">Request for Proposal Details</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusBadge(selectedRFP.status)}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getStatusIcon(selectedRFP.status)} />
                  </svg>
                  {selectedRFP.status}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRFP(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[calc(90vh-180px)] overflow-y-auto">
              
              {/* User Information */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">User Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Name</p>
                    <p className="text-sm font-medium text-gray-900">{selectedRFP.user_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email</p>
                    <p className="text-sm font-medium text-gray-900">{selectedRFP.user_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Company</p>
                    <p className="text-sm font-medium text-gray-900">{selectedRFP.user_company || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Submitted</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(selectedRFP.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
              {selectedRFP.message && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Message</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedRFP.message}</p>
                  </div>
                </div>
              )}

              {/* Requested Products */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Requested Products ({selectedRFP.products?.length || 0})
                </h4>
                <div className="space-y-3">
                  {selectedRFP.products && selectedRFP.products.length > 0 ? (
                    selectedRFP.products.map((product, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        {/* Product Image */}
                        <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                          {product.image_url ? (
                            <img
                              src={`http://localhost:5001/uploads/${product.image_url}`}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full">
                              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-sm font-semibold text-gray-900 mb-1">{product.name}</h5>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>ID: {product.id}</span>
                            {product.dimensions && <span>Size: {product.dimensions}</span>}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">No products found</p>
                  )}
                </div>
              </div>

              {/* Status Update */}
              <div>
                <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Update Status</h4>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleStatusChange(selectedRFP.id, 'New')}
                    disabled={selectedRFP.status === 'New'}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors border-2 ${
                      selectedRFP.status === 'New'
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    New
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedRFP.id, 'Processing')}
                    disabled={selectedRFP.status === 'Processing'}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors border-2 ${
                      selectedRFP.status === 'Processing'
                        ? 'bg-yellow-100 border-yellow-500 text-yellow-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-yellow-300'
                    }`}
                  >
                    <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Processing
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedRFP.id, 'Closed')}
                    disabled={selectedRFP.status === 'Closed'}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors border-2 ${
                      selectedRFP.status === 'Closed'
                        ? 'bg-gray-100 border-gray-500 text-gray-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Closed
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white rounded-b-xl">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRFP(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFPsManagement;
