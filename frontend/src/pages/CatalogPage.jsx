import { useState, useEffect } from 'react';
import { getProducts, downloadFile } from '../services/productService';
import { createRFP } from '../services/rfpService';
import { useAuth } from '../context/AuthContext';

const CatalogPage = () => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [productQuantities, setProductQuantities] = useState({});
  const [search, setSearch] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState({
    topDia: [0, 500],
    height: [0, 500],
    bottomDia: [0, 500],
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
  });
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [loading, setLoading] = useState(false);
  const [showRFPModal, setShowRFPModal] = useState(false);
  const [rfpSubmitted, setRfpSubmitted] = useState(false);
  const [rfpMessage, setRfpMessage] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedModalImageIndex, setSelectedModalImageIndex] = useState(0);

  useEffect(() => {
    loadProducts(1);
  }, []);

  // Auto-search as user types with debouncing
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadProducts(1);
    }, 300); // 300ms delay after user stops typing

    return () => clearTimeout(delayDebounceFn);
  }, [search, filters, itemsPerPage]);

  const loadProducts = async (page) => {
    setLoading(true);
    try {
      console.log('Loading products - page:', page, 'search:', search, 'filters:', filters);
      const data = await getProducts(search, page, itemsPerPage, filters);
      console.log('Products loaded:', data);
      setProducts(data.products);
      setPagination(data.pagination);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadProducts(1);
  };

  const clearSearch = () => {
    setSearch('');
  };

  const toggleProductSelection = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
    // Initialize quantity to 1 when selecting
    if (!selectedProducts.includes(productId)) {
      setProductQuantities(prev => ({ ...prev, [productId]: 1 }));
    }
  };

  const updateQuantity = (productId, quantity) => {
    const qty = Math.max(1, Math.min(999, parseInt(quantity) || 1));
    setProductQuantities(prev => ({ ...prev, [productId]: qty }));
  };

  const applyFilters = () => {
    setShowFilterModal(false);
    loadProducts(1);
  };

  const resetFilters = () => {
    setFilters({
      topDia: [0, 500],
      height: [0, 500],
      bottomDia: [0, 500],
    });
  };

  const clearFilters = () => {
    setFilters({
      topDia: [0, 500],
      height: [0, 500],
      bottomDia: [0, 500],
    });
  };

  const isFilterActive = () => {
    return (
      filters.topDia[0] !== 0 || filters.topDia[1] !== 500 ||
      filters.height[0] !== 0 || filters.height[1] !== 500 ||
      filters.bottomDia[0] !== 0 || filters.bottomDia[1] !== 500
    );
  };

  const handleDownload = async (productId, type) => {
    try {
      const response = await downloadFile(productId, type);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `download.${type}`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to download file' });
    }
  };

  const handleSubmitRFP = async () => {
    if (selectedProducts.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least one product' });
      return;
    }

    try {
      // Create RFP data with quantities
      const rfpData = {
        products: selectedProducts.map(productId => ({
          productId,
          quantity: productQuantities[productId] || 1
        })),
        message: rfpMessage
      };
      
      await createRFP(selectedProducts, rfpMessage);
      setRfpSubmitted(true);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit RFP' });
    }
  };

  const closeRFPModal = () => {
    setShowRFPModal(false);
    setRfpSubmitted(false);
    setSelectedProducts([]);
    setProductQuantities({});
    setRfpMessage('');
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setSelectedModalImageIndex(0);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedProduct(null);
    setSelectedModalImageIndex(0);
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Product Catalog</h2>
            <p className="text-sm text-gray-500">
              Browse and download pot products with secure watermarking.
              <span className="ml-2 text-gray-400">
                • Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            </p>
          </div>
          <button
            onClick={() => {
              console.log('Manual refresh triggered');
              loadProducts(1);
            }}
            disabled={loading}
            className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-gray-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-sm"
            title="Refresh products"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {message.text && (
        <div
          className={`mb-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
                placeholder="Search by name, SKU, dimensions..."
                className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
              />
              <svg
                className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {search && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            
            <button 
              onClick={() => setShowFilterModal(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter
            </button>

            {isFilterActive() && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 border border-red-300 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                title="Clear all filters"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            )}

            {/* Items Per Page Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Show:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              >
                <option value={8}>8</option>
                <option value={12}>12</option>
                <option value={16}>16</option>
                <option value={24}>24</option>
                <option value={32}>32</option>
              </select>
            </div>
          </div>

          {selectedProducts.length > 0 && (
            <button
              onClick={() => setShowRFPModal(true)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Request RFP ({selectedProducts.length})
            </button>
          )}
        </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <>
          {/* Product Grid */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className={`group relative bg-white rounded-2xl overflow-hidden transition-all hover:shadow-xl ${
                  selectedProducts.includes(product.id)
                    ? 'ring-2 ring-emerald-500 shadow-lg'
                    : 'border border-gray-200 hover:border-emerald-200 shadow-sm'
                }`}
              >
                {/* Checkbox */}
                <div className="absolute top-4 left-4 z-10">
                  <div className={`p-1 rounded-lg backdrop-blur-sm transition-all ${
                    selectedProducts.includes(product.id) 
                      ? 'bg-emerald-500/90' 
                      : 'bg-white/90 hover:bg-emerald-50/90'
                  }`}>
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => toggleProductSelection(product.id)}
                      className="w-5 h-5 text-emerald-600 bg-white border-2 border-gray-300 rounded focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Product Image */}
                <div 
                  onClick={() => handleViewDetails(product)}
                  className="relative h-56 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden cursor-pointer group/image"
                >
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/5 transition-all duration-300 z-[1]" />
                  
                  {/* View Details Badge */}
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover/image:opacity-100 transition-all duration-300 transform -translate-y-2 group-hover/image:translate-y-0">
                    <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </div>
                  </div>

                  {product.image_url ? (
                    <img
                      src={`/uploads/${product.image_url}`}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover/image:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x300?text=Pot+Image';
                      }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full text-gray-300">
                      <svg className="w-20 h-20 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-medium">No Image</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-5">
                  {/* Header Section */}
                  <div className="mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 
                        onClick={() => handleViewDetails(product)}
                        className="text-base font-bold text-gray-900 line-clamp-2 cursor-pointer hover:text-emerald-600 transition-colors flex-1 leading-tight"
                      >
                        {product.name}
                      </h3>
                      <button
                        onClick={() => handleViewDetails(product)}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-white hover:bg-emerald-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                        title="View Details"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* SKU Badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg">
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                      </svg>
                      <span className="text-xs font-semibold text-gray-700">POT-{String(product.id).padStart(4, '0')}</span>
                    </div>
                  </div>
                  
                  {/* Dimensions Section */}
                  <div className="mb-4">
                    <div className="flex items-start gap-2 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-blue-900 mb-0.5">Dimensions</p>
                        <p className="text-xs text-blue-700 font-semibold line-clamp-2">{product.dimensions || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  {selectedProducts.includes(product.id) && (
                    <div className="mb-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                      <label className="block text-xs font-bold text-emerald-900 mb-2.5 uppercase tracking-wide">Quantity</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(product.id, (productQuantities[product.id] || 1) - 1)}
                          className="w-9 h-9 flex items-center justify-center bg-white border-2 border-emerald-300 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                          </svg>
                        </button>
                        <input
                          type="number"
                          min="1"
                          max="999"
                          value={productQuantities[product.id] || 1}
                          onChange={(e) => updateQuantity(product.id, e.target.value)}
                          className="flex-1 px-3 py-2 text-center border-2 border-emerald-300 bg-white rounded-lg text-base font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                        />
                        <button
                          onClick={() => updateQuantity(product.id, (productQuantities[product.id] || 1) + 1)}
                          className="w-9 h-9 flex items-center justify-center bg-white border-2 border-emerald-300 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors shadow-sm"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Download Section */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wide">Downloads</p>
                    <div className="grid grid-cols-3 gap-2">
                      {product.image_url ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(product.id, 'image');
                          }}
                          className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl transition-all duration-200 group/btn border border-blue-200 shadow-sm hover:shadow-md"
                          title="Download Image"
                        >
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mb-1.5 group-hover/btn:scale-110 transition-transform">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </div>
                          <span className="text-xs font-bold text-blue-900">Image</span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl border border-gray-200 opacity-40">
                          <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center mb-1.5">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </div>
                          <span className="text-xs font-bold text-gray-400">Image</span>
                        </div>
                      )}

                      {product.dwg_url ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(product.id, 'dwg');
                          }}
                          className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl transition-all duration-200 group/btn border border-purple-200 shadow-sm hover:shadow-md"
                          title="Download DWG"
                        >
                          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mb-1.5 group-hover/btn:scale-110 transition-transform">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </div>
                          <span className="text-xs font-bold text-purple-900">DWG</span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl border border-gray-200 opacity-40">
                          <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center mb-1.5">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </div>
                          <span className="text-xs font-bold text-gray-400">DWG</span>
                        </div>
                      )}

                      {product.pdf_url ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(product.id, 'pdf');
                          }}
                          className="flex flex-col items-center justify-center p-3 bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 rounded-xl transition-all duration-200 group/btn border border-red-200 shadow-sm hover:shadow-md"
                          title="Download PDF"
                        >
                          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center mb-1.5 group-hover/btn:scale-110 transition-transform">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </div>
                          <span className="text-xs font-bold text-red-900">PDF</span>
                        </button>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl border border-gray-200 opacity-40">
                          <div className="w-8 h-8 bg-gray-300 rounded-lg flex items-center justify-center mb-1.5">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </div>
                          <span className="text-xs font-bold text-gray-400">PDF</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-sm">No products found</p>
            </div>
          )}

          {/* Footer with selection and pagination */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50">
            <div className="text-sm text-gray-500">
              {selectedProducts.length > 0 && (
                <span className="font-medium text-gray-700">
                  {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
                </span>
              )}
              {!selectedProducts.length && (
                <span>
                  Showing {((pagination.currentPage - 1) * 12) + 1} - {Math.min(pagination.currentPage * 12, pagination.totalCount)} of {pagination.totalCount}
                </span>
              )}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadProducts(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">{pagination.currentPage}</span>
                  <span className="text-sm text-gray-500">/ {pagination.totalPages}</span>
                </div>
                
                <button
                  onClick={() => loadProducts(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </>
      )}
      </div>
      
      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Filter Products</h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Top Diameter Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Top Diameter: {filters.topDia[0]}cm - {filters.topDia[1]}cm
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={filters.topDia[0]}
                    onChange={(e) => setFilters({...filters, topDia: [parseInt(e.target.value), filters.topDia[1]]})}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={filters.topDia[1]}
                    onChange={(e) => setFilters({...filters, topDia: [filters.topDia[0], parseInt(e.target.value)]})}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0cm</span>
                  <span>500cm</span>
                </div>
              </div>

              {/* Height Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Height: {filters.height[0]}cm - {filters.height[1]}cm
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={filters.height[0]}
                    onChange={(e) => setFilters({...filters, height: [parseInt(e.target.value), filters.height[1]]})}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={filters.height[1]}
                    onChange={(e) => setFilters({...filters, height: [filters.height[0], parseInt(e.target.value)]})}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0cm</span>
                  <span>500cm</span>
                </div>
              </div>

              {/* Bottom Diameter Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Bottom Diameter: {filters.bottomDia[0]}cm - {filters.bottomDia[1]}cm
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={filters.bottomDia[0]}
                    onChange={(e) => setFilters({...filters, bottomDia: [parseInt(e.target.value), filters.bottomDia[1]]})}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={filters.bottomDia[1]}
                    onChange={(e) => setFilters({...filters, bottomDia: [filters.bottomDia[0], parseInt(e.target.value)]})}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0cm</span>
                  <span>500cm</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={resetFilters}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={applyFilters}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showRFPModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            {!rfpSubmitted ? (
              <>
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900">Submit RFP Request</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Review your selected products and submit your request
                  </p>
                </div>
                
                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {/* Selected Products Grid */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Selected Products ({selectedProducts.length})
                    </label>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {selectedProducts.map((productId) => {
                        const product = products.find(p => p.id === productId);
                        if (!product) return null;
                        
                        return (
                          <div 
                            key={productId}
                            className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            {/* Product Image */}
                            <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                              {product.image_url ? (
                                <img
                                  src={`/uploads/${product.image_url}`}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/64x64?text=Pot';
                                  }}
                                />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full">
                                  <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                </div>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {product.name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                SKU: POT-{String(product.id).padStart(4, '0')}
                              </p>
                            </div>

                            {/* Quantity Badge */}
                            <div className="flex-shrink-0">
                              <div className="px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                                <span className="text-xs font-medium text-emerald-700">
                                  Qty: {productQuantities[productId] || 1}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Message (Optional)
                    </label>
                    <textarea
                      value={rfpMessage}
                      onChange={(e) => setRfpMessage(e.target.value)}
                      rows={4}
                      placeholder="Add any special requirements or questions..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm resize-none"
                    />
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-200 flex gap-3">
                  <button
                    onClick={closeRFPModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitRFP}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Submit Request
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Success Message */}
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  {/* Success Icon */}
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>

                  {/* Success Text */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    RFP Submitted Successfully!
                  </h3>
                  <p className="text-sm text-gray-600 mb-8 max-w-md">
                    Your request for proposal has been submitted. Our team will review your request and get back to you shortly.
                  </p>

                  {/* Close Button */}
                  <button
                    onClick={closeRFPModal}
                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Product Details Modal */}
      {showDetailsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full my-6 overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-gray-50 via-white to-emerald-50/30 px-6 py-6 border-b border-gray-100">
              <button
                onClick={closeDetailsModal}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="max-w-4xl pr-12">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-1.5 leading-tight">{selectedProduct.name}</h3>
                    {selectedProduct.sku && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
                        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                        </svg>
                        <span className="text-gray-700 font-semibold text-xs">{selectedProduct.sku}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5 max-h-[calc(90vh-200px)] overflow-y-auto bg-gray-50">
              
              {/* Description */}
              {selectedProduct.description && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-bold text-gray-900">Description</h4>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedProduct.description}</p>
                </div>
              )}

              {/* Image Gallery */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Product Images</h4>
                </div>
                {(() => {
                  let images = [];
                  if (selectedProduct.all_images) {
                    const parsedImages = typeof selectedProduct.all_images === 'string' 
                      ? JSON.parse(selectedProduct.all_images) 
                      : selectedProduct.all_images;
                    
                    if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                      images = parsedImages;
                    }
                  }
                  
                  if (images.length === 0 && selectedProduct.image_url) {
                    images = [selectedProduct.image_url];
                  }

                  if (images.length === 0) {
                    return (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                        <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs font-medium text-gray-500">No images available</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {/* Main Image */}
                      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                        <img
                          src={`/uploads/${images[selectedModalImageIndex]}`}
                          alt={`${selectedProduct.name} - Image ${selectedModalImageIndex + 1}`}
                          className="w-full h-72 object-contain"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Found';
                          }}
                        />
                        {/* Image Counter */}
                        <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold rounded-lg">
                          {selectedModalImageIndex + 1} / {images.length}
                        </div>
                      </div>

                      {/* Thumbnail Gallery */}
                      {images.length > 1 && (
                        <div className="grid grid-cols-8 gap-2">
                          {images.map((img, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedModalImageIndex(index)}
                              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                                selectedModalImageIndex === index
                                  ? 'border-emerald-500 ring-2 ring-emerald-200 scale-105'
                                  : 'border-gray-200 hover:border-emerald-300 hover:scale-105'
                              }`}
                            >
                              <img
                                src={`/uploads/${img}`}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/100x100?text=Img';
                                }}
                              />
                              {selectedModalImageIndex === index && (
                                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                  <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Specifications Grid */}
              <div className="grid md:grid-cols-3 gap-4">
                
                {/* Dimensions */}
                {selectedProduct.dimensions && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 md:col-span-3">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">Dimensions</h4>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
                      <p className="text-blue-900 font-semibold text-sm">{selectedProduct.dimensions}</p>
                    </div>
                  </div>
                )}

                {/* Colors */}
                {selectedProduct.colors && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg">
                        <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">Colors</h4>
                    </div>
                    {(() => {
                      try {
                        const colors = typeof selectedProduct.colors === 'string' 
                          ? JSON.parse(selectedProduct.colors) 
                          : selectedProduct.colors;

                        if (!Array.isArray(colors) || colors.length === 0) {
                          return <p className="text-xs text-gray-500">No colors available</p>;
                        }

                        return (
                          <div className="flex flex-wrap gap-2">
                            {colors.map((color, index) => (
                              <div key={index} className="group relative">
                                <div
                                  className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm cursor-pointer transition-transform hover:scale-110"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                                <span className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs font-mono text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {color}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      } catch (e) {
                        return <p className="text-xs text-gray-500">Unable to display colors</p>;
                      }
                    })()}
                  </div>
                )}

                {/* Finishes */}
                {selectedProduct.finishes && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">Finishes</h4>
                    </div>
                    {(() => {
                      try {
                        const finishes = typeof selectedProduct.finishes === 'string' 
                          ? JSON.parse(selectedProduct.finishes) 
                          : selectedProduct.finishes;

                        if (!Array.isArray(finishes) || finishes.length === 0) {
                          return <p className="text-xs text-gray-500">No finishes available</p>;
                        }

                        return (
                          <div className="flex flex-wrap gap-1.5">
                            {finishes.map((finish, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200 shadow-sm"
                              >
                                {finish}
                              </span>
                            ))}
                          </div>
                        );
                      } catch (e) {
                        return <p className="text-xs text-gray-500">Unable to display finishes</p>;
                      }
                    })()}
                  </div>
                )}

                {/* Textures */}
                {selectedProduct.textures && (
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg">
                        <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-gray-900">Textures</h4>
                    </div>
                    {(() => {
                      try {
                        const textures = typeof selectedProduct.textures === 'string' 
                          ? JSON.parse(selectedProduct.textures) 
                          : selectedProduct.textures;

                        if (!Array.isArray(textures) || textures.length === 0) {
                          return <p className="text-xs text-gray-500">No textures available</p>;
                        }

                        return (
                          <div className="grid grid-cols-6 gap-2">
                            {textures.map((texture, index) => (
                              <div key={index} className="group relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-amber-300 transition-all shadow-sm hover:shadow-md">
                                <img
                                  src={`/uploads/${texture}`}
                                  alt={`Texture ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"><span class="text-xs text-gray-400 font-medium">Failed</span></div>';
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        );
                      } catch (e) {
                        return <p className="text-xs text-gray-500">Unable to display textures</p>;
                      }
                    })()}
                  </div>
                )}
              </div>

              {/* Downloads */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Downloads</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* PDF Download */}
                  {selectedProduct.pdf_url ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDownload(selectedProduct.id, 'pdf');
                      }}
                      className="group bg-gradient-to-br from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 rounded-lg p-3 border border-red-200 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-xs font-bold text-red-900">PDF</p>
                          <p className="text-xs text-red-700">Datasheet</p>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 opacity-40">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-xs font-bold text-gray-500">PDF</p>
                          <p className="text-xs text-gray-400">Not available</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DWG Download */}
                  {selectedProduct.dwg_url ? (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDownload(selectedProduct.id, 'dwg');
                      }}
                      className="group bg-gradient-to-br from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 rounded-lg p-3 border border-purple-200 transition-all duration-200 shadow-sm hover:shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-xs font-bold text-purple-900">DWG</p>
                          <p className="text-xs text-purple-700">CAD File</p>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 opacity-40">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-xs font-bold text-gray-500">DWG</p>
                          <p className="text-xs text-gray-400">Not available</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">Metadata</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Created</p>
                    </div>
                    <p className="text-xs text-gray-900 font-semibold">
                      {new Date(selectedProduct.created_at).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {new Date(selectedProduct.created_at).toLocaleString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  
                  {selectedProduct.updated_at && selectedProduct.updated_at !== selectedProduct.created_at && (
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">Updated</p>
                      </div>
                      <p className="text-xs text-gray-900 font-semibold">
                        {new Date(selectedProduct.updated_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {new Date(selectedProduct.updated_at).toLocaleString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-gradient-to-r from-gray-50 to-slate-50 rounded-b-xl">
              <button
                onClick={closeDetailsModal}
                className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
              <button
                onClick={() => {
                  toggleProductSelection(selectedProduct.id);
                  closeDetailsModal();
                }}
                className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2 ${
                  selectedProducts.includes(selectedProduct.id)
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'
                }`}
              >
                {selectedProducts.includes(selectedProduct.id) ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    Remove
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add to RFP
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
