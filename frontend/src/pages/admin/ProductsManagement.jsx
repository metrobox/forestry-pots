import { useState, useEffect } from 'react';
import { getAllProducts, createProduct, updateProduct, deleteProduct } from '../../services/adminService';

const ProductsManagement = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState({
    topDia: [0, 500],
    height: [0, 500],
    bottomDia: [0, 500],
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [dimensions, setDimensions] = useState([]);
  const [colors, setColors] = useState([]);
  const [finishes, setFinishes] = useState([]);
  const [textures, setTextures] = useState([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [selectedModalImageIndex, setSelectedModalImageIndex] = useState(0);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    images: [],
    existingImages: [],
    pdfFile: null,
    dwgFile: null,
    existingPdfUrl: null,
    existingDwgUrl: null,
    selectedDimensions: [],
    selectedColors: [],
    selectedFinishes: [],
    selectedTextures: [],
    selectedVariations: []
  });

  // Variation management states
  const [showDimensionManager, setShowDimensionManager] = useState(false);
  const [showFinishManager, setShowFinishManager] = useState(false);
  const [showTextureManager, setShowTextureManager] = useState(false);
  
  const [newDimension, setNewDimension] = useState({ type: 'Diameter', value: '' });
  const [newFinish, setNewFinish] = useState('');
  const [newColor, setNewColor] = useState('#000000');
  const [textureUpload, setTextureUpload] = useState(null);

  useEffect(() => {
    loadProducts();
    loadVariations();
  }, []);

  // Filter products based on search query and size filters
  useEffect(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(product => {
        const query = searchQuery.toLowerCase();
        const nameMatch = product.name?.toLowerCase().includes(query);
        const skuMatch = product.sku?.toLowerCase().includes(query);
        return nameMatch || skuMatch;
      });
    }

    // Size filter - parse dimensions and filter
    const isDefaultFilter = 
      sizeFilter.topDia[0] === 0 && sizeFilter.topDia[1] === 500 &&
      sizeFilter.height[0] === 0 && sizeFilter.height[1] === 500 &&
      sizeFilter.bottomDia[0] === 0 && sizeFilter.bottomDia[1] === 500;

    if (!isDefaultFilter) {
      filtered = filtered.filter(product => {
        if (!product.dimensions) return true;
        
        // Parse dimensions from string (assuming format like "Top: 50cm, Height: 100cm, Bottom: 40cm")
        const dims = product.dimensions.toLowerCase();
        
        // Extract numeric values
        const topMatch = dims.match(/top[^\d]*(\d+)/);
        const heightMatch = dims.match(/height[^\d]*(\d+)/);
        const bottomMatch = dims.match(/bottom[^\d]*(\d+)/);
        
        const top = topMatch ? parseInt(topMatch[1]) : null;
        const height = heightMatch ? parseInt(heightMatch[1]) : null;
        const bottom = bottomMatch ? parseInt(bottomMatch[1]) : null;
        
        // Check if values are within filter ranges
        const topInRange = top === null || (top >= sizeFilter.topDia[0] && top <= sizeFilter.topDia[1]);
        const heightInRange = height === null || (height >= sizeFilter.height[0] && height <= sizeFilter.height[1]);
        const bottomInRange = bottom === null || (bottom >= sizeFilter.bottomDia[0] && bottom <= sizeFilter.bottomDia[1]);
        
        return topInRange && heightInRange && bottomInRange;
      });
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, sizeFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
      setMessage({ type: 'error', text: 'Failed to load products' });
    } finally {
      setLoading(false);
    }
  };

  const loadVariations = () => {
    // Load saved variations from localStorage or API
    const savedDimensions = JSON.parse(localStorage.getItem('dimensionTypes') || '["Diameter", "Height", "Width", "Length"]');
    const savedFinishes = JSON.parse(localStorage.getItem('finishTypes') || '["Stone", "Paint", "Matte", "Glossy"]');
    setDimensions(savedDimensions);
    setFinishes(savedFinishes);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    if (primaryImageIndex >= formData.images.length - 1) {
      setPrimaryImageIndex(Math.max(0, formData.images.length - 2));
    } else if (index < primaryImageIndex) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    }
  };

  const removeExistingImage = (index) => {
    setFormData(prev => ({
      ...prev,
      existingImages: prev.existingImages.filter((_, i) => i !== index)
    }));
  };

  const addDimensionToProduct = (dimension) => {
    setFormData(prev => ({
      ...prev,
      selectedDimensions: [...prev.selectedDimensions, dimension]
    }));
  };

  const removeDimension = (index) => {
    setFormData(prev => ({
      ...prev,
      selectedDimensions: prev.selectedDimensions.filter((_, i) => i !== index)
    }));
  };

  const addColorToProduct = () => {
    if (!formData.selectedColors.includes(newColor)) {
      setFormData(prev => ({
        ...prev,
        selectedColors: [...prev.selectedColors, newColor]
      }));
    }
  };

  const removeColor = (color) => {
    setFormData(prev => ({
      ...prev,
      selectedColors: prev.selectedColors.filter(c => c !== color)
    }));
  };

  const saveDimensionType = () => {
    if (newDimension.type && !dimensions.includes(newDimension.type)) {
      const updated = [...dimensions, newDimension.type];
      setDimensions(updated);
      localStorage.setItem('dimensionTypes', JSON.stringify(updated));
    }
  };

  const saveFinishType = () => {
    if (newFinish && !finishes.includes(newFinish)) {
      const updated = [...finishes, newFinish];
      setFinishes(updated);
      localStorage.setItem('finishTypes', JSON.stringify(updated));
      setNewFinish('');
    }
  };

  const handleTextureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const texture = {
          name: file.name,
          file: file, // Store actual file object
          preview: reader.result
        };
        setFormData(prev => ({
          ...prev,
          selectedTextures: [...prev.selectedTextures, texture]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeTexture = (index) => {
    setFormData(prev => ({
      ...prev,
      selectedTextures: prev.selectedTextures.filter((_, i) => i !== index)
    }));
  };

  const addVariation = () => {
    const newVariation = {
      id: Date.now(),
      dimensions: [],  // Array of {type: 'Diameter', value: '324'}
      skuSuffix: '',
      stock: 1,
      isOpen: true  // Auto-open the new variation
    };
    // Close all other variations and add the new one
    setFormData(prev => ({
      ...prev,
      selectedVariations: [
        ...prev.selectedVariations.map(v => ({ ...v, isOpen: false })),
        newVariation
      ]
    }));
  };

  const addDimensionToVariation = (variationId, dimensionType) => {
    setFormData(prev => ({
      ...prev,
      selectedVariations: prev.selectedVariations.map(v => {
        if (v.id === variationId) {
          return {
            ...v,
            dimensions: [...v.dimensions, { type: dimensionType, value: '' }]
          };
        }
        return v;
      })
    }));
  };

  const updateVariationDimension = (variationId, dimensionIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      selectedVariations: prev.selectedVariations.map(v => {
        if (v.id === variationId) {
          const updatedDimensions = [...v.dimensions];
          updatedDimensions[dimensionIndex] = {
            ...updatedDimensions[dimensionIndex],
            [field]: value
          };
          return { ...v, dimensions: updatedDimensions };
        }
        return v;
      })
    }));
  };

  const removeDimensionFromVariation = (variationId, dimensionIndex) => {
    setFormData(prev => ({
      ...prev,
      selectedVariations: prev.selectedVariations.map(v => {
        if (v.id === variationId) {
          return {
            ...v,
            dimensions: v.dimensions.filter((_, idx) => idx !== dimensionIndex)
          };
        }
        return v;
      })
    }));
  };

  const updateVariation = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      selectedVariations: prev.selectedVariations.map(v =>
        v.id === id ? { ...v, [field]: value } : v
      )
    }));
  };

  const removeVariation = (id) => {
    setFormData(prev => ({
      ...prev,
      selectedVariations: prev.selectedVariations.filter(v => v.id !== id)
    }));
  };

  const handleEdit = (product) => {
    console.log('=== EDITING PRODUCT ===');
    console.log('Full product object:', JSON.stringify(product, null, 2));
    console.log('Product.dimensions:', product.dimensions);
    console.log('Product.description:', product.description);
    setEditingProduct(product);
    
    // Parse all_images
    let existingImgs = [];
    if (product.all_images) {
      const parsedImages = typeof product.all_images === 'string' 
        ? JSON.parse(product.all_images) 
        : product.all_images;
      if (Array.isArray(parsedImages) && parsedImages.length > 0) {
        existingImgs = parsedImages.filter(url => url);
      }
    } else if (product.image_url) {
      existingImgs = [product.image_url];
    }
    
    // Parse colors
    let existingColors = [];
    if (product.colors) {
      try {
        const colors = typeof product.colors === 'string' 
          ? JSON.parse(product.colors) 
          : product.colors;
        if (Array.isArray(colors) && colors.length > 0) {
          existingColors = colors;
        }
      } catch (e) {
        console.error('Error parsing colors:', e);
      }
    }
    
    // Parse finishes
    let existingFinishes = [];
    if (product.finishes) {
      try {
        const finishes = typeof product.finishes === 'string' 
          ? JSON.parse(product.finishes) 
          : product.finishes;
        if (Array.isArray(finishes) && finishes.length > 0) {
          existingFinishes = finishes;
        }
      } catch (e) {
        console.error('Error parsing finishes:', e);
      }
    }
    
    // Parse textures
    let existingTextures = [];
    if (product.textures) {
      try {
        const textures = typeof product.textures === 'string' 
          ? JSON.parse(product.textures) 
          : product.textures;
        if (Array.isArray(textures) && textures.length > 0) {
          const validTextures = textures.filter(url => url);
          existingTextures = validTextures.map((url, index) => ({
            name: `Texture ${index + 1}`,
            preview: `/uploads/${url}`,
            url: url,
            isExisting: true
          }));
        }
      } catch (e) {
        console.error('Error parsing textures:', e);
      }
    }
    
    // Parse dimensions - try multiple approaches
    let existingDimensions = [];
    
    // Approach 1: Check if dimensions field has structured JSON data
    if (product.dimensions) {
      console.log('Product dimensions field:', product.dimensions);
      try {
        // Try to parse as JSON first
        const parsedDims = typeof product.dimensions === 'string' 
          ? JSON.parse(product.dimensions) 
          : product.dimensions;
        
        if (Array.isArray(parsedDims) && parsedDims.length > 0) {
          // Check if it's an array of dimension objects
          if (parsedDims[0] && typeof parsedDims[0] === 'object' && 'type' in parsedDims[0]) {
            existingDimensions = parsedDims;
            console.log('Loaded dimensions from JSON array:', existingDimensions);
          }
        }
      } catch (e) {
        // Not JSON, try regex parsing
        console.log('Dimensions is not JSON, trying regex parsing');
      }
    }
    
    // Approach 2: If no dimensions found yet, try parsing from description/dimensions string
    if (existingDimensions.length === 0) {
      // IMPORTANT: Check dimensions field FIRST, then fall back to description
      const dimensionString = product.dimensions || product.description || '';
      console.log('Dimension string:', dimensionString);
      
      if (dimensionString) {
        // Try to extract dimension values
        // Pattern format: "Diameter 50cm x Height 100cm" or "Top Diameter: 50cm, Height: 100cm"
        const patterns = [
          { regex: /Top\s+Diameter\s+(\d+)cm/i, type: 'Top Diameter' },
          { regex: /Bottom\s+Diameter\s+(\d+)cm/i, type: 'Bottom Diameter' },
          { regex: /Diameter\s+(\d+)cm/i, type: 'Diameter' },
          { regex: /Height\s+(\d+)cm/i, type: 'Height' },
          { regex: /Width\s+(\d+)cm/i, type: 'Width' },
          { regex: /Length\s+(\d+)cm/i, type: 'Length' },
          { regex: /Depth\s+(\d+)cm/i, type: 'Depth' },
          { regex: /Thickness\s+(\d+)cm/i, type: 'Thickness' },
          // Also support format with colon: "Diameter: 50cm"
          { regex: /top\s*(?:dia|diameter)?[:\s]*(\d+)\s*cm/i, type: 'Top Diameter' },
          { regex: /bottom\s*(?:dia|diameter)?[:\s]*(\d+)\s*cm/i, type: 'Bottom Diameter' },
          { regex: /diameter[:\s]*(\d+)\s*cm/i, type: 'Diameter' },
          { regex: /height[:\s]*(\d+)\s*cm/i, type: 'Height' },
          { regex: /width[:\s]*(\d+)\s*cm/i, type: 'Width' },
          { regex: /length[:\s]*(\d+)\s*cm/i, type: 'Length' },
        ];
        
        // Use a Set to avoid duplicates
        const foundTypes = new Set();
        
        patterns.forEach(({ regex, type }) => {
          if (!foundTypes.has(type)) {
            const match = dimensionString.match(regex);
            if (match && match[1]) {
              console.log(`Found dimension - ${type}: ${match[1]}`);
              existingDimensions.push({
                type: type,
                value: match[1]
              });
              foundTypes.add(type);
            }
          }
        });
      }
    }
    
    console.log('Final parsed dimensions:', existingDimensions);
    console.log('Parsed colors:', existingColors);
    console.log('Parsed finishes:', existingFinishes);
    console.log('Parsed textures:', existingTextures);
    
    // Parse variations
    let existingVariations = [];
    if (product.variations) {
      try {
        const variations = typeof product.variations === 'string' 
          ? JSON.parse(product.variations) 
          : product.variations;
        if (Array.isArray(variations) && variations.length > 0) {
          // Ensure each variation has the correct structure
          existingVariations = variations.map(v => ({
            id: v.id || Date.now() + Math.random(),
            dimensions: v.dimensions || [],
            skuSuffix: v.skuSuffix || '',
            stock: v.stock || 1,
            isOpen: false
          }));
        }
      } catch (e) {
        console.error('Error parsing variations:', e);
      }
    }
    console.log('Parsed variations:', existingVariations);
    
    setFormData({
      name: product.name || '',
      description: product.description || '',
      sku: product.sku || '',
      images: [],
      existingImages: existingImgs,
      pdfFile: null,
      dwgFile: null,
      existingPdfUrl: product.pdf_url || null,
      existingDwgUrl: product.dwg_url || null,
      selectedDimensions: existingDimensions,
      selectedColors: existingColors,
      selectedFinishes: existingFinishes,
      selectedTextures: existingTextures,
      selectedVariations: existingVariations
    });
    setPrimaryImageIndex(0);
    setShowAddModal(true);
  };

  const handleViewDetails = (product) => {
    setSelectedProduct(product);
    setSelectedModalImageIndex(0);
    setShowDetailsModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    
    setDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      setMessage({ type: 'success', text: 'Product deleted successfully' });
      setShowDeleteModal(false);
      setProductToDelete(null);
      loadProducts();
      
      // Auto-close success message after 2 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete product' });
    } finally {
      setDeleting(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  const clearFilters = () => {
    setSizeFilter({
      topDia: [0, 500],
      height: [0, 500],
      bottomDia: [0, 500],
    });
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const isFilterActive = () => {
    return (
      sizeFilter.topDia[0] !== 0 || sizeFilter.topDia[1] !== 500 ||
      sizeFilter.height[0] !== 0 || sizeFilter.height[1] !== 500 ||
      sizeFilter.bottomDia[0] !== 0 || sizeFilter.bottomDia[1] !== 500
    );
  };

  const resetForm = () => {
    setEditingProduct(null);
    setPrimaryImageIndex(0);
    setFormData({
      name: '',
      description: '',
      sku: '',
      images: [],
      existingImages: [],
      pdfFile: null,
      dwgFile: null,
      existingPdfUrl: null,
      existingDwgUrl: null,
      selectedDimensions: [],
      selectedColors: [],
      selectedFinishes: [],
      selectedTextures: [],
      selectedVariations: []
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Product name is required' });
      return;
    }

    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Create FormData for multipart upload
      const submitData = new FormData();
      
      // Add basic fields
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('sku', formData.sku);
      
      // Add images with primary image first
      if (formData.images.length > 0) {
        // Add primary image first
        submitData.append('images', formData.images[primaryImageIndex]);
        
        // Add remaining images
        formData.images.forEach((image, index) => {
          if (index !== primaryImageIndex) {
            submitData.append('images', image);
          }
        });
        
        // Store primary image index for reference
        submitData.append('primaryImageIndex', '0'); // Primary is always first now
      }
      
      // Add PDF file
      if (formData.pdfFile) {
        submitData.append('pdfFile', formData.pdfFile);
      }
      
      // Add DWG file
      if (formData.dwgFile) {
        submitData.append('dwgFile', formData.dwgFile);
      }
      
      // Add dimensions as JSON
      submitData.append('dimensions', JSON.stringify(formData.selectedDimensions));
      
      // Add colors as JSON
      submitData.append('colors', JSON.stringify(formData.selectedColors));
      
      // Add finishes as JSON
      submitData.append('finishes', JSON.stringify(formData.selectedFinishes));
      
      // Add variations as JSON
      submitData.append('variations', JSON.stringify(formData.selectedVariations));
      
      // Add textures - use stored file objects directly
      formData.selectedTextures.forEach((texture) => {
        if (texture.file) {
          // Use the original file object
          submitData.append('textures', texture.file);
        } else if (texture.preview) {
          // Fallback: convert base64 preview to file (for legacy support)
          fetch(texture.preview)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], texture.name, { type: blob.type || 'image/png' });
              submitData.append('textures', file);
            });
        }
      });
      
      // Submit to backend - create or update
      if (editingProduct) {
        await updateProduct(editingProduct.id, submitData);
        setMessage({ type: 'success', text: 'Product updated successfully!' });
      } else {
        await createProduct(submitData);
        setMessage({ type: 'success', text: 'Product created successfully!' });
      }
      
      setShowAddModal(false);
      
      // Reset form
      resetForm();
      
      // Reload products
      loadProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || `Failed to ${editingProduct ? 'update' : 'create'} product. Please try again.` 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Product Management</h2>
          <p className="text-sm text-gray-500">Manage product catalog and variations.</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Product
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or SKU..."
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
          {searchQuery && (
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
          className={`px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
            isFilterActive()
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter by Size
          {isFilterActive() && (
            <span className="ml-1 px-1.5 py-0.5 bg-emerald-600 text-white text-xs rounded-full">
              Active
            </span>
          )}
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

        <div className="ml-auto text-sm text-gray-600">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
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
        ) : products.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-lg font-medium mb-1">No products yet</p>
            <p className="text-sm">Click "Add New Product" to create your first product</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-lg font-medium mb-1">No products found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Image</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Dimensions</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Files</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr 
                    key={product.id} 
                    onClick={() => handleViewDetails(product)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      {product.image_url ? (
                        <img
                          src={`http://localhost:5001/uploads/${product.image_url}`}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"%3E%3C/path%3E%3C/svg%3E';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{product.name}</div>
                      {product.sku && (
                        <div className="text-xs text-gray-500 mt-1">SKU: {product.sku}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">{product.dimensions || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {product.pdf_url && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-red-700 text-xs font-medium">
                            PDF
                          </span>
                        )}
                        {product.dwg_url && (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
                            DWG
                          </span>
                        )}
                        {!product.pdf_url && !product.dwg_url && (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700">
                        {new Date(product.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(product);
                          }}
                          className="p-2 text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Edit product"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProductToDelete(product);
                            setShowDeleteModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete product"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full my-8">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white rounded-t-xl z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {editingProduct ? 'Update product details' : 'Fill in the product details'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                      placeholder="Forestry Pot 200L"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({...formData, sku: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                      placeholder="POT-0001"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm resize-none"
                    placeholder="Product description..."
                  />
                </div>
              </div>

              {/* Images Section */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer inline-flex flex-col items-center"
                  >
                    <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-600">Click to upload images or drag and drop</span>
                    <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each</span>
                  </label>
                </div>
                
                {formData.existingImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Existing Images</p>
                    <div className="grid grid-cols-4 gap-4">
                      {formData.existingImages.map((imageUrl, index) => (
                        <div key={`existing-${index}`} className="relative group">
                          <img
                            src={`http://localhost:5001/uploads/${imageUrl}`}
                            alt={`Existing ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            onClick={() => removeExistingImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {formData.images.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">New Images</p>
                    <div className="grid grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={`new-${index}`} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className={`w-full h-24 object-cover rounded-lg border-2 transition-all ${
                              primaryImageIndex === index 
                                ? 'border-emerald-500 ring-2 ring-emerald-200' 
                                : 'border-gray-200'
                            }`}
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setPrimaryImageIndex(index)}
                            className={`absolute bottom-1 left-1 px-2 py-1 text-xs font-medium rounded transition-all ${
                              primaryImageIndex === index
                                ? 'bg-emerald-500 text-white'
                                : 'bg-white/90 text-gray-700 hover:bg-emerald-100'
                            }`}
                            title="Set as primary image"
                          >
                            {primaryImageIndex === index ? (
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                Primary
                              </span>
                            ) : (
                              'Set Primary'
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Files Section */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Technical Files</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      PDF File
                    </label>
                    {formData.existingPdfUrl && !formData.pdfFile && (
                      <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-blue-900 font-medium">Current PDF</span>
                        </div>
                        <a 
                          href={`http://localhost:5001/uploads/${formData.existingPdfUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          View
                        </a>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setFormData({...formData, pdfFile: e.target.files[0]})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    {formData.pdfFile && (
                      <p className="text-xs text-gray-500 mt-1">{formData.pdfFile.name}</p>
                    )}
                    {formData.existingPdfUrl && (
                      <p className="text-xs text-gray-500 mt-1">Upload a new file to replace existing</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      DWG File
                    </label>
                    {formData.existingDwgUrl && !formData.dwgFile && (
                      <div className="mb-2 p-3 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-purple-900 font-medium">Current DWG</span>
                        </div>
                        <a 
                          href={`http://localhost:5001/uploads/${formData.existingDwgUrl}`}
                          download
                          className="text-xs text-purple-600 hover:text-purple-800 underline"
                        >
                          Download
                        </a>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".dwg"
                      onChange={(e) => setFormData({...formData, dwgFile: e.target.files[0]})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 text-sm"
                    />
                    {formData.dwgFile && (
                      <p className="text-xs text-gray-500 mt-1">{formData.dwgFile.name}</p>
                    )}
                    {formData.existingDwgUrl && (
                      <p className="text-xs text-gray-500 mt-1">Upload a new file to replace existing</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Size Variations */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Product Size Variations</h4>
                    <p className="text-sm text-gray-500 mt-1">Add different sizes for this product</p>
                  </div>
                  <button
                    onClick={() => setShowDimensionManager(!showDimensionManager)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {showDimensionManager ? 'Hide' : 'Manage'} Dimension Types
                  </button>
                </div>

                {/* Dimension Type Manager */}
                {showDimensionManager && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm font-semibold text-gray-800 mb-2">Manage Available Dimension Types</p>
                    <p className="text-xs text-gray-600 mb-3">Add custom dimension types that will be available in the dropdown when creating size variations.</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newDimension.type}
                        onChange={(e) => setNewDimension({...newDimension, type: e.target.value})}
                        placeholder="e.g., Thickness, Inner Diameter, Outer Width"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={saveDimensionType}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Add Type
                      </button>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-600 mb-2">Current Types:</p>
                      <div className="flex flex-wrap gap-2">
                        {dimensions.map(dim => (
                          <span key={dim} className="px-2 py-1 bg-white border border-blue-200 text-blue-700 rounded text-xs font-medium">
                            {dim}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Variations List */}
                <div className="space-y-3">
                  {formData.selectedVariations.map((variation, index) => (
                    <div key={variation.id} className="border border-gray-300 rounded-xl overflow-hidden">
                      {/* Variation Header - Collapsible */}
                      <div 
                        onClick={() => {
                          const updatedVariations = formData.selectedVariations.map(v => 
                            v.id === variation.id ? { ...v, isOpen: !v.isOpen } : v
                          );
                          setFormData({ ...formData, selectedVariations: updatedVariations });
                        }}
                        className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-teal-50 cursor-pointer hover:from-emerald-100 hover:to-teal-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                            <span className="text-base font-bold text-white">#{index + 1}</span>
                          </div>
                          <div>
                            <h5 className="text-sm font-semibold text-gray-900">Size {index + 1}</h5>
                            {variation.dimensions && variation.dimensions.length > 0 ? (
                              <p className="text-xs text-gray-600 mt-0.5">
                                {variation.dimensions.map(dim => 
                                  dim.value ? `${dim.type} ${dim.value}cm` : dim.type
                                ).join(' × ')}
                              </p>
                            ) : (
                              <p className="text-xs text-gray-400 mt-0.5">Click to add dimensions</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeVariation(variation.id);
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove size"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <svg 
                            className={`w-5 h-5 text-gray-400 transition-transform ${variation.isOpen ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {/* Variation Content - Expandable */}
                      {variation.isOpen && (
                        <div className="p-4 bg-white border-t border-gray-200">
                          <div className="space-y-4">
                            {/* Dimensions Builder */}
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-semibold text-gray-700">Dimensions</label>
                              </div>

                              {/* Existing Dimensions List */}
                              {variation.dimensions && variation.dimensions.length > 0 && (
                                <div className="space-y-2 mb-3">
                                  {variation.dimensions.map((dim, dimIndex) => (
                                    <div key={dimIndex} className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                      <select
                                        value={dim.type}
                                        onChange={(e) => updateVariationDimension(variation.id, dimIndex, 'type', e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                      >
                                        {dimensions.map(dimType => (
                                          <option key={dimType} value={dimType}>{dimType}</option>
                                        ))}
                                      </select>
                                      <input
                                        type="number"
                                        value={dim.value}
                                        onChange={(e) => updateVariationDimension(variation.id, dimIndex, 'value', e.target.value)}
                                        placeholder="Enter value"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                      />
                                      <span className="text-sm text-gray-500 font-medium">cm</span>
                                      <button
                                        onClick={() => removeDimensionFromVariation(variation.id, dimIndex)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remove dimension"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add Dimension Dropdown */}
                              <div className="flex gap-2">
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      addDimensionToVariation(variation.id, e.target.value);
                                      e.target.value = ''; // Reset dropdown
                                    }
                                  }}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                  defaultValue=""
                                >
                                  <option value="" disabled>+ Add a dimension</option>
                                  {dimensions.map(dimType => (
                                    <option key={dimType} value={dimType}>{dimType}</option>
                                  ))}
                                </select>
                              </div>

                              {variation.dimensions && variation.dimensions.length === 0 && (
                                <p className="text-xs text-gray-400 mt-2 text-center">Select a dimension type to get started</p>
                              )}
                            </div>

                            {/* Additional Info Row */}
                            <div>
                              <label className="block text-sm font-semibold text-gray-700 mb-3">Additional Info</label>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1.5">SKU Suffix (optional)</label>
                                  <input
                                    type="text"
                                    value={variation.skuSuffix}
                                    onChange={(e) => updateVariation(variation.id, 'skuSuffix', e.target.value)}
                                    placeholder="V1, -40H, etc."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Stock Quantity</label>
                                  <input
                                    type="number"
                                    value={variation.stock}
                                    onChange={(e) => updateVariation(variation.id, 'stock', Math.max(0, parseInt(e.target.value) || 0))}
                                    min="0"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Preview */}
                            {variation.dimensions && variation.dimensions.length > 0 && (
                              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <svg className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-emerald-900">Preview</p>
                                    <p className="text-sm font-semibold text-emerald-700 mt-1">
                                      {variation.dimensions.map(dim => 
                                        dim.value ? `${dim.type} ${dim.value}cm` : dim.type
                                      ).join(' × ')}
                                    </p>
                                    {variation.skuSuffix && (
                                      <p className="text-xs text-emerald-600 mt-1">
                                        SKU: {formData.sku || 'BASE'}-{variation.skuSuffix}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Size Button */}
                <button
                  onClick={addVariation}
                  className="mt-4 w-full px-4 py-3 border-2 border-dashed border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {formData.selectedVariations.length === 0 ? 'Add First Size' : 'Add Another Size'}
                </button>
              </div>

              {/* Colors Section */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Colors</h4>
                <div className="flex gap-3 items-center mb-4">
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <button
                    onClick={addColorToProduct}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
                  >
                    Add Color
                  </button>
                </div>
                {formData.selectedColors.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {formData.selectedColors.map((color, index) => (
                      <div key={index} className="relative group">
                        <div
                          className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-sm cursor-pointer"
                          style={{ backgroundColor: color }}
                        />
                        <button
                          onClick={() => removeColor(color)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Finish Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Finish</h4>
                  <button
                    onClick={() => setShowFinishManager(!showFinishManager)}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    {showFinishManager ? 'Hide' : 'Manage Variations'}
                  </button>
                </div>

                {showFinishManager && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-3">Add New Finish Type</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFinish}
                        onChange={(e) => setNewFinish(e.target.value)}
                        placeholder="e.g., Textured, Polished"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={saveFinishType}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Add Type
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {finishes.map((finish) => (
                    <button
                      key={finish}
                      onClick={() => {
                        if (formData.selectedFinishes.includes(finish)) {
                          setFormData(prev => ({
                            ...prev,
                            selectedFinishes: prev.selectedFinishes.filter(f => f !== finish)
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            selectedFinishes: [...prev.selectedFinishes, finish]
                          }));
                        }
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.selectedFinishes.includes(finish)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {finish}
                    </button>
                  ))}
                </div>
              </div>

              {/* Texture Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">Textures</h4>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mb-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleTextureUpload}
                    className="hidden"
                    id="texture-upload"
                  />
                  <label
                    htmlFor="texture-upload"
                    className="cursor-pointer inline-flex flex-col items-center"
                  >
                    <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-600">Upload texture image</span>
                  </label>
                </div>
                {formData.selectedTextures.length > 0 && (
                  <div className="flex flex-wrap gap-3">
                    {formData.selectedTextures.map((texture, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={texture.preview}
                          alt={texture.name}
                          className="w-20 h-20 rounded-lg border-2 border-gray-300 object-cover"
                        />
                        <button
                          onClick={() => removeTexture(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        <p className="text-xs text-gray-500 mt-1 text-center truncate w-20">{texture.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3 sticky bottom-0 bg-white rounded-b-xl">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                disabled={saving}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {editingProduct ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingProduct ? 'Update Product' : 'Create Product'
                )}
              </button>
            </div>
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
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedProduct(null);
                }}
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

              {/* Product Images Gallery */}
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
                try {
                  // Parse all_images array, fallback to single image_url
                  let images = [];
                  if (selectedProduct.all_images) {
                    const parsedImages = typeof selectedProduct.all_images === 'string' 
                      ? JSON.parse(selectedProduct.all_images) 
                      : selectedProduct.all_images;
                    if (Array.isArray(parsedImages) && parsedImages.length > 0) {
                      images = parsedImages.filter(url => url);
                    }
                  }
                  
                  // Fallback to single image_url if no all_images
                  if (images.length === 0 && selectedProduct.image_url) {
                    images = [selectedProduct.image_url];
                  }

                  if (images.length > 0) {
                    return (
                      <div className="space-y-3">
                        {/* Main Image Display */}
                        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden border border-gray-200 group">
                          <img
                            src={`http://localhost:5001/uploads/${images[selectedModalImageIndex]}`}
                            alt={`${selectedProduct.name} - Image ${selectedModalImageIndex + 1}`}
                            className="w-full h-72 object-contain"
                            onError={(e) => {
                              e.target.parentElement.innerHTML = '<div class="flex items-center justify-center h-72 text-gray-400"><svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                            }}
                          />
                          {/* Image Counter */}
                          <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold rounded-lg">
                            {selectedModalImageIndex + 1} / {images.length}
                          </div>
                        </div>

                        {/* Thumbnail Grid - Only show if multiple images */}
                        {images.length > 1 && (
                          <div className="grid grid-cols-8 gap-2">
                            {images.map((imageUrl, index) => (
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
                                  src={`http://localhost:5001/uploads/${imageUrl}`}
                                  alt={`Thumbnail ${index + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.classList.add('bg-gray-200');
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
                  } else {
                    return (
                      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 text-center border-2 border-dashed border-gray-300">
                        <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-xs font-medium text-gray-500">No images available</p>
                      </div>
                    );
                  }
                } catch (e) {
                  console.error('Error parsing images:', e);
                  return null;
                }
              })()}
              </div>

              {/* Dimensions */}
              {selectedProduct.dimensions && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
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
                (() => {
                  try {
                    const colors = typeof selectedProduct.colors === 'string' 
                      ? JSON.parse(selectedProduct.colors) 
                      : selectedProduct.colors;
                    if (Array.isArray(colors) && colors.length > 0) {
                      return (
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg">
                              <svg className="w-4 h-4 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                              </svg>
                            </div>
                            <h4 className="text-sm font-bold text-gray-900">Colors</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {colors.map((color, index) => (
                              <div key={index} className="flex items-center gap-2 bg-gray-50 px-2.5 py-2 rounded-lg border border-gray-200">
                                <div
                                  className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
                                  style={{ backgroundColor: color }}
                                  title={color}
                                />
                                <span className="text-xs font-mono text-gray-600">{color}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  } catch (e) {
                    console.error('Error parsing colors:', e);
                  }
                  return null;
                })()
              )}

              {/* Finishes */}
              {selectedProduct.finishes && (
                (() => {
                  try {
                    const finishes = typeof selectedProduct.finishes === 'string' 
                      ? JSON.parse(selectedProduct.finishes) 
                      : selectedProduct.finishes;
                    if (Array.isArray(finishes) && finishes.length > 0) {
                      return (
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                            </div>
                            <h4 className="text-sm font-bold text-gray-900">Finishes</h4>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {finishes.map((finish, index) => (
                              <span
                                key={index}
                                className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 text-purple-700 rounded-lg text-xs font-semibold"
                              >
                                {finish}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  } catch (e) {
                    console.error('Error parsing finishes:', e);
                  }
                  return null;
                })()
              )}

              {/* Textures */}
              {selectedProduct.textures && (
                (() => {
                  try {
                    const textures = typeof selectedProduct.textures === 'string' 
                      ? JSON.parse(selectedProduct.textures) 
                      : selectedProduct.textures;
                    
                    if (Array.isArray(textures) && textures.length > 0) {
                      const validTextures = textures.filter(url => url);
                      
                      if (validTextures.length > 0) {
                        return (
                          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-1.5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg">
                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                </svg>
                              </div>
                              <h4 className="text-sm font-bold text-gray-900">Textures</h4>
                            </div>
                            <div className="grid grid-cols-6 gap-2">
                              {validTextures.map((textureUrl, index) => {
                                const fullUrl = `http://localhost:5001/uploads/${textureUrl}`;
                                return (
                                  <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-amber-300 transition-all shadow-sm hover:shadow-md">
                                    <img
                                      src={fullUrl}
                                      alt={`Texture ${index + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"><span class="text-xs text-gray-400 font-medium">Failed</span></div>';
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }
                    }
                  } catch (e) {
                    console.error('Error parsing textures:', e, selectedProduct.textures);
                  }
                  return null;
                })()
              )}

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
                  {selectedProduct.pdf_url ? (
                    <a
                      href={`http://localhost:5001/uploads/${selectedProduct.pdf_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 p-3 bg-gradient-to-br from-red-50 to-rose-50 border-2 border-red-200 text-red-700 rounded-lg hover:from-red-100 hover:to-rose-100 transition-all"
                    >
                      <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-bold">PDF</p>
                        <p className="text-xs opacity-75">Datasheet</p>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-dashed border-gray-200 text-gray-400 rounded-lg">
                      <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-bold">PDF</p>
                        <p className="text-xs">Not available</p>
                      </div>
                    </div>
                  )}
                  
                  {selectedProduct.dwg_url ? (
                    <a
                      href={`http://localhost:5001/uploads/${selectedProduct.dwg_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 p-3 bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 text-purple-700 rounded-lg hover:from-purple-100 hover:to-violet-100 transition-all"
                    >
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-bold">DWG</p>
                        <p className="text-xs opacity-75">CAD File</p>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 border-2 border-dashed border-gray-200 text-gray-400 rounded-lg">
                      <div className="w-10 h-10 bg-gray-300 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-bold">DWG</p>
                        <p className="text-xs">Not available</p>
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
                onClick={(e) => {
                  setShowDetailsModal(false);
                  setSelectedProduct(null);
                  handleEdit(selectedProduct);
                }}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-bold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Product
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedProduct(null);
                }}
                className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-red-50 via-white to-rose-50/30 px-6 py-6 border-b border-red-100">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg shadow-red-500/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">Delete Product</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 mb-2">
                  Are you sure you want to delete this product?
                </p>
                <div className="flex items-center gap-3 mt-3">
                  {productToDelete.image_url ? (
                    <img
                      src={`http://localhost:5001/uploads/${productToDelete.image_url}`}
                      alt={productToDelete.name}
                      className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"%3E%3C/path%3E%3C/svg%3E';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{productToDelete.name}</p>
                    <p className="text-xs text-gray-500">SKU: {productToDelete.sku || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <svg className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-red-800">
                  All product data including images, specifications, and files will be permanently deleted.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 flex gap-3 bg-gray-50">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setProductToDelete(null);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg text-sm font-bold hover:from-red-700 hover:to-rose-700 transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Product
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Size Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Filter by Size</h3>
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
                  Top Diameter: {sizeFilter.topDia[0]}cm - {sizeFilter.topDia[1]}cm
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={sizeFilter.topDia[0]}
                    onChange={(e) => setSizeFilter({...sizeFilter, topDia: [parseInt(e.target.value), sizeFilter.topDia[1]]})}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={sizeFilter.topDia[1]}
                    onChange={(e) => setSizeFilter({...sizeFilter, topDia: [sizeFilter.topDia[0], parseInt(e.target.value)]})}
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
                  Height: {sizeFilter.height[0]}cm - {sizeFilter.height[1]}cm
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={sizeFilter.height[0]}
                    onChange={(e) => setSizeFilter({...sizeFilter, height: [parseInt(e.target.value), sizeFilter.height[1]]})}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={sizeFilter.height[1]}
                    onChange={(e) => setSizeFilter({...sizeFilter, height: [sizeFilter.height[0], parseInt(e.target.value)]})}
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
                  Bottom Diameter: {sizeFilter.bottomDia[0]}cm - {sizeFilter.bottomDia[1]}cm
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={sizeFilter.bottomDia[0]}
                    onChange={(e) => setSizeFilter({...sizeFilter, bottomDia: [parseInt(e.target.value), sizeFilter.bottomDia[1]]})}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={sizeFilter.bottomDia[1]}
                    onChange={(e) => setSizeFilter({...sizeFilter, bottomDia: [sizeFilter.bottomDia[0], parseInt(e.target.value)]})}
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
                onClick={() => {
                  clearFilters();
                  setShowFilterModal(false);
                }}
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
    </div>
  );
};

export default ProductsManagement;
