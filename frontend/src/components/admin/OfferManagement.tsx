/**
 * @fileoverview Offer Management component for admin interface
 * 
 * Complete offer management interface with CRUD operations, real-time analytics,
 * and pixel URL auto-generation. Integrates with the backend API for all operations.
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { 
  OfferWithMetrics, 
  CreateOfferRequest, 
  UpdateOfferRequest, 
  OfferCategory, 
  OfferStatus,
  ListOffersRequest 
} from '@survai/shared';
import { offerApi } from '../../services/offer';
import { OfferMetrics } from './OfferMetrics';

/**
 * Form data interfaces
 */
interface OfferFormData {
  title: string;
  description: string;
  category: OfferCategory;
  destinationUrl: string;
  payout: number;
  currency: string;
  dailyClickCap?: number;
  totalClickCap?: number;
  cooldownPeriod?: number;
  geoTargeting: string[];
  deviceTargeting: string[];
}

/**
 * Offer Management component
 */
export const OfferManagement: React.FC = () => {
  const [offers, setOffers] = useState<OfferWithMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOffer, setSelectedOffer] = useState<OfferWithMetrics | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferWithMetrics | null>(null);
  const [formData, setFormData] = useState<OfferFormData>({
    title: '',
    description: '',
    category: 'FINANCE',
    destinationUrl: '',
    payout: 0,
    currency: 'USD',
    dailyClickCap: undefined,
    totalClickCap: undefined,
    cooldownPeriod: undefined,
    geoTargeting: [],
    deviceTargeting: []
  });
  const [generatedPixelUrl, setGeneratedPixelUrl] = useState<string>('');
  const [formLoading, setFormLoading] = useState(false);

  // Filter and pagination state
  const [filters, setFilters] = useState<ListOffersRequest>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasMore: false
  });

  /**
   * Load offers from API
   */
  const loadOffers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await offerApi.list(filters);
      
      if (response.success) {
        setOffers(response.data.offers);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || 'Failed to load offers');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load offers');
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Generate pixel URL when destination URL changes
   */
  const generatePixelUrl = useCallback((destinationUrl: string) => {
    if (destinationUrl) {
      // Generate pixel URL template
      const baseUrl = process.env.VITE_TRACKING_PIXEL_URL || 'https://tracking.survai.app/pixel';
      const pixelUrl = `${baseUrl}?click_id={click_id}&survey_id={survey_id}`;
      setGeneratedPixelUrl(pixelUrl);
    } else {
      setGeneratedPixelUrl('');
    }
  }, []);

  /**
   * Handle form input changes
   */
  const handleInputChange = (field: keyof OfferFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate pixel URL when destination URL changes
    if (field === 'destinationUrl') {
      generatePixelUrl(value);
    }
  };

  /**
   * Reset form data
   */
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: 'FINANCE',
      destinationUrl: '',
      payout: 0,
      currency: 'USD',
      dailyClickCap: undefined,
      totalClickCap: undefined,
      cooldownPeriod: undefined,
      geoTargeting: [],
      deviceTargeting: []
    });
    setGeneratedPixelUrl('');
    setEditingOffer(null);
  };

  /**
   * Open create form
   */
  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  /**
   * Open edit form
   */
  const openEditForm = (offer: OfferWithMetrics) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description || '',
      category: offer.category,
      destinationUrl: offer.destinationUrl,
      payout: offer.config.payout,
      currency: offer.config.currency,
      dailyClickCap: offer.config.dailyClickCap,
      totalClickCap: offer.config.totalClickCap,
      cooldownPeriod: offer.config.cooldownPeriod,
      geoTargeting: offer.targeting?.geoTargeting || [],
      deviceTargeting: offer.targeting?.deviceTargeting || []
    });
    setGeneratedPixelUrl(offer.pixelUrl || '');
    setShowForm(true);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.destinationUrl) {
      setError('Title and destination URL are required');
      return;
    }

    setFormLoading(true);
    setError(null);

    try {
      if (editingOffer) {
        // Update existing offer
        const updateData: UpdateOfferRequest = {
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category,
          destinationUrl: formData.destinationUrl,
          config: {
            payout: formData.payout,
            currency: formData.currency,
            dailyClickCap: formData.dailyClickCap,
            totalClickCap: formData.totalClickCap,
            cooldownPeriod: formData.cooldownPeriod
          },
          targeting: {
            geoTargeting: formData.geoTargeting,
            deviceTargeting: formData.deviceTargeting
          }
        };

        const response = await offerApi.update(editingOffer.id, updateData);
        
        if (response.success) {
          setShowForm(false);
          resetForm();
          await loadOffers();
        } else {
          setError(response.error || 'Failed to update offer');
        }
      } else {
        // Create new offer
        const createData: CreateOfferRequest = {
          title: formData.title,
          description: formData.description || undefined,
          category: formData.category,
          destinationUrl: formData.destinationUrl,
          config: {
            payout: formData.payout,
            currency: formData.currency,
            dailyClickCap: formData.dailyClickCap,
            totalClickCap: formData.totalClickCap,
            cooldownPeriod: formData.cooldownPeriod
          },
          targeting: {
            geoTargeting: formData.geoTargeting,
            deviceTargeting: formData.deviceTargeting
          }
        };

        const response = await offerApi.create(createData);
        
        if (response.success) {
          setShowForm(false);
          resetForm();
          await loadOffers();
        } else {
          setError(response.error || 'Failed to create offer');
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to save offer');
      console.error('Error saving offer:', error);
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Handle offer deletion
   */
  const handleDelete = async (offer: OfferWithMetrics) => {
    if (!confirm(`Are you sure you want to delete "${offer.title}"?`)) {
      return;
    }

    try {
      const response = await offerApi.delete(offer.id);
      
      if (response.success) {
        await loadOffers();
      } else {
        setError(response.error || 'Failed to delete offer');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete offer');
      console.error('Error deleting offer:', error);
    }
  };

  /**
   * Handle status toggle
   */
  const handleToggleStatus = async (offer: OfferWithMetrics) => {
    const newStatus = offer.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    
    try {
      const response = await offerApi.toggle(offer.id, newStatus);
      
      if (response.success) {
        await loadOffers();
      } else {
        setError(response.error || 'Failed to toggle offer status');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to toggle offer status');
      console.error('Error toggling offer status:', error);
    }
  };

  /**
   * Copy pixel URL to clipboard
   */
  const copyPixelUrl = (pixelUrl: string) => {
    navigator.clipboard.writeText(pixelUrl);
    alert('Pixel URL copied to clipboard!');
  };

  /**
   * Load offers on component mount and when filters change
   */
  useEffect(() => {
    loadOffers();
  }, [loadOffers]);

  /**
   * Set up auto-refresh every 30 seconds
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (!showForm) {
        loadOffers();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [loadOffers, showForm]);

  if (loading) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Offer Management</h3>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <div>Loading offers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 className="card-title">Offer Management</h3>
            <p style={{ margin: 0, color: '#718096', fontSize: '0.875rem' }}>
              {offers.length} offers • Auto-refresh every 30s
            </p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={openCreateForm}
            style={{ fontSize: '0.875rem' }}
          >
            Create New Offer
          </button>
        </div>
      </div>

      {error && (
        <div style={{ 
          padding: '1rem', 
          backgroundColor: '#fed7d7', 
          color: '#c53030', 
          borderRadius: '0.25rem',
          margin: '1rem' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              style={{ 
                background: 'none', 
                border: 'none', 
                fontSize: '1.25rem', 
                cursor: 'pointer',
                color: '#c53030'
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '0.875rem'
        }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Offer</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>EPC</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Clicks</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Conv. Rate</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Revenue</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Pixel URL</th>
              <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id} style={{ borderBottom: '1px solid #f7fafc' }}>
                <td style={{ padding: '0.75rem' }}>
                  <div>
                    <div style={{ fontWeight: '500', color: '#1a202c' }}>
                      {offer.title}
                    </div>
                    <div style={{ color: '#718096', fontSize: '0.75rem' }}>
                      {offer.category} • ${offer.config.payout} payout
                    </div>
                  </div>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{ 
                    padding: '0.25rem 0.5rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    backgroundColor: offer.status === 'ACTIVE' ? '#c6f6d5' : '#fed7d7',
                    color: offer.status === 'ACTIVE' ? '#2f855a' : '#c53030'
                  }}>
                    {offer.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{ 
                    fontWeight: '600',
                    color: offer.epcMetrics?.epc && offer.epcMetrics.epc > 0 ? '#38a169' : '#718096'
                  }}>
                    ${offer.epcMetrics?.epc?.toFixed(2) || '0.00'}
                  </span>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {offer.epcMetrics?.totalClicks || 0}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {offer.epcMetrics?.conversionRate?.toFixed(1) || '0.0'}%
                </td>
                <td style={{ padding: '0.75rem' }}>
                  ${offer.epcMetrics?.totalRevenue?.toFixed(2) || '0.00'}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={offer.pixelUrl || 'No pixel URL'}
                      readOnly
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.25rem',
                        backgroundColor: '#f7fafc',
                        minWidth: '200px',
                        maxWidth: '300px'
                      }}
                    />
                    {offer.pixelUrl && (
                      <button
                        onClick={() => copyPixelUrl(offer.pixelUrl!)}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#3182ce',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.25rem',
                          cursor: 'pointer'
                        }}
                      >
                        Copy
                      </button>
                    )}
                  </div>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => openEditForm(offer)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#4a5568',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(offer)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: offer.status === 'ACTIVE' ? '#e53e3e' : '#38a169',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                      }}
                    >
                      {offer.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setSelectedOffer(offer)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#3182ce',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                      }}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleDelete(offer)}
                      style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#e53e3e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {offers.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
          No offers found. Create your first offer to get started.
        </div>
      )}

      {/* Offer Form Modal */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: 0 }}>
                {editingOffer ? 'Edit Offer' : 'Create New Offer'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value as OfferCategory)}
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="FINANCE">Finance</option>
                    <option value="INSURANCE">Insurance</option>
                    <option value="HEALTH">Health</option>
                    <option value="EDUCATION">Education</option>
                    <option value="TECHNOLOGY">Technology</option>
                    <option value="TRAVEL">Travel</option>
                    <option value="SHOPPING">Shopping</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                    Payout *
                  </label>
                  <input
                    type="number"
                    value={formData.payout}
                    onChange={(e) => handleInputChange('payout', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    required
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Destination URL *
                </label>
                <input
                  type="url"
                  value={formData.destinationUrl}
                  onChange={(e) => handleInputChange('destinationUrl', e.target.value)}
                  required
                  placeholder="https://example.com/offer"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Pixel URL (Auto-generated)
                </label>
                <input
                  type="text"
                  value={generatedPixelUrl}
                  readOnly
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#f7fafc',
                    color: '#4a5568'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#e2e8f0',
                    color: '#4a5568',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: '#3182ce',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: formLoading ? 'not-allowed' : 'pointer',
                    opacity: formLoading ? 0.6 : 1
                  }}
                >
                  {formLoading ? 'Saving...' : (editingOffer ? 'Update Offer' : 'Create Offer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Details Modal */}
      {selectedOffer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: 0 }}>Offer Details</h3>
              <button
                onClick={() => setSelectedOffer(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            <OfferMetrics offer={selectedOffer} />
          </div>
        </div>
      )}
    </div>
  );
};